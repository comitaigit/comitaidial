# Discagem paralela (3 linhas simultâneas) — guia de implementação

Este documento descreve como a discagem paralela **já está implementada** nesta
branch (`claude/aws-commiati-trhubm`) do Comitai Dialer. Ele existe para que você
possa colar este arquivo (ou os trechos relevantes) para outra sessão de Claude
que esteja trabalhando num ambiente diferente (ex: ainda na branch `dev`, que só
tem discagem de uma linha por vez) e pedir para ela replicar/mesclar esse
comportamento.

Antes de reimplementar do zero: confirme se dá para simplesmente puxar/mesclar
esta branch (`claude/aws-commiati-trhubm`) em vez de reescrever — a lógica abaixo
já está testada e em produção neste código.

> **Status real, para não gerar falsa expectativa:** o **backend está 100%
> pronto e funcional** (todas as rotas, AMD, compare-and-swap). No
> **front-end**, a API client (`startParallelBatch`, `getBatchStatus`,
> `cancelBatch` em `dialer-api.ts`) e o método `callParallel()` do softphone
> (`useSoftphone.ts`) já existem — mas **nada na tela do Dialer os chama
> ainda**. O hook que orquestra a tela hoje, `useDialerStage.tsx`, só usa o
> caminho de **uma linha por vez** (`softphone.call()`). Ou seja: falta o
> último passo de fiação (plugar esses dois pedaços no `useDialerStage`) —
> ver a seção "O que falta fazer" no final deste documento.

## O pedido original (CEO), ponto a ponto

1. **"Campo iniciar discagem deve disparar três discagens paralelas"**
2. **"O status deve ser atualizado para discando."**
3. **"Após finalização do status as três ligações dão lugar aos contatos
   seguintes. A classificação das chamadas pode ser automática se for ocupada,
   não atende e caixa postal."**
4. **"A regra é que o primeiro a atender seja a linha que permanece e as demais
   sejam encerradas."**

Cada um desses pontos está implementado da seguinte forma.

---

## Visão geral da arquitetura

O navegador do BDR **nunca disca um número diretamente**. Em vez disso:

1. O backend origina até 3 chamadas de saída em paralelo via API REST do Twilio
   (uma por contato), cada uma com **AMD assíncrono** (Answering Machine
   Detection) ligado.
2. O navegador do BDR entra numa sala de **Conference** do Twilio e espera.
3. A primeira chamada cujo AMD confirmar "humano" é redirecionada para dentro
   dessa mesma sala — só ela é ligada de fato ao BDR.
4. As outras duas são encerradas (ou já tinham resolvido sozinhas: caixa
   postal, ocupado, não atende).

Isso resolve o requisito 4 ("o primeiro a atender permanece, as demais são
encerradas") através de um **compare-and-swap** no banco, não por lógica no
front-end — importante porque duas chamadas podem ser atendidas quase ao mesmo
tempo.

### Arquivos principais

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Backend | `apps/backend/src/calls/calls.service.ts` | Toda a lógica de negócio (origina as 3 chamadas, processa AMD, decide o vencedor) |
| Backend | `apps/backend/src/calls/calls.controller.ts` | Endpoints HTTP + webhooks públicos do Twilio |
| Backend | `apps/backend/prisma/schema.prisma` | Modelos `DialBatch` e `Call` (campo `parallelLegStatus`) |
| Frontend | `apps/frontend/src/features/dialer/hooks/useSoftphone.ts` | Dono do `Twilio.Device` (SDK de voz no navegador); método `callParallel(batchId)` |
| Frontend | `apps/frontend/src/features/dialer/hooks/useDialerQueue.ts` | Fila de contatos — remove/reenfileira por `personId` após o batch resolver |
| Frontend | `apps/frontend/src/features/dialer/hooks/useDialerStage.tsx` | Orquestra o fluxo da tela do Dialer (**ainda não plugado ao fluxo paralelo** — ver "O que falta fazer") |
| Frontend | `apps/frontend/src/features/dialer/data/dialer-api.ts` | Client HTTP: `startParallelBatch`, `getBatchStatus`, `cancelBatch` |

### Rotas HTTP completas (`calls.controller.ts`)

| Método | Rota | Auth | Função |
|---|---|---|---|
| POST | `/v1/calls/parallel-batch` | JWT | Inicia um novo batch de até 3 chamadas |
| GET | `/v1/calls/parallel-batch/:id` | JWT | Status atual das 3 legs (para polling) |
| POST | `/v1/calls/parallel-batch/:id/cancel` | JWT | BDR desligou antes de alguém atender — cancela as legs ainda tocando |
| POST | `/v1/calls/voice` | `@Public()` | Voice URL do TwiML App — trata tanto o browser leg (`mode=parallel`) quanto o leg de 1 linha antigo |
| POST | `/v1/calls/parallel-leg` | `@Public()` | TwiML inicial de cada leg de saída (mantém a chamada em silêncio até o AMD decidir) |
| POST | `/v1/calls/parallel-leg-amd` | `@Public()` | `asyncAmdStatusCallback` — é aqui que a corrida (ponto 4) é decidida |
| POST | `/v1/calls/parallel-leg-join` | `@Public()` | TwiML que a leg vencedora recebe, para entrar na Conference |
| POST | `/v1/calls/parallel-leg-status` | `@Public()` | `statusCallback` padrão — classifica ocupado/não atende/falha |
| POST | `/v1/calls/recording-status` | `@Public()` | Callback de gravação (single-line e conference) |

Todas as rotas `@Public()` **precisam** ser validadas pela assinatura de
requisição do Twilio (`X-Twilio-Signature`), não pelo `JwtAuthGuard` — não têm
outra defesa contra chamadas forjadas.

### Modelo `DialBatch` (schema.prisma)

```prisma
model DialBatch {
  id             String   @id @default(uuid())
  tenantId       String
  cadenceId      String
  userId         String
  conferenceName String   @unique   // ex: "batch-<uuid>", sala do Twilio Conference
  winnerCallSid  String?             // null = sem vencedor ainda; setado via compare-and-swap
  createdAt      DateTime @default(now())
  calls          Call[]              // as até 3 legs deste batch
}
```

E em `Call`, o campo que rastreia cada leg dentro de um batch:

```prisma
parallelLegStatus ParallelLegStatus?   // null para chamadas de 1 linha (fluxo antigo)
dialBatchId       String?              // FK para o DialBatch, null fora do fluxo paralelo
abandonedByParallelDial Boolean @default(false)
```

---

## 1. "Iniciar discagem" dispara 3 chamadas paralelas

**Endpoint:** `POST /v1/calls/parallel-batch` (`calls.controller.ts`)
**Lógica:** `CallsService.startParallelBatch()` (`calls.service.ts:407-499`)

```
const PARALLEL_LINES = 3; // fixo por enquanto — ainda não é config por tenant
```

Passo a passo:

1. Busca a fila do cadence (`DialerService.getQueue`) e pega até 3 candidatos,
   pulando quem já estiver "em voo" (RINGING) num outro batch aberto da mesma
   cadência — evita discar a mesma pessoa em duas linhas ao mesmo tempo.
2. Cria um `DialBatch` no banco (id, `conferenceName` único tipo
   `batch-<uuid>`).
3. Para cada um dos até 3 candidatos:
   - Cria a `Call` no banco **antes** de acionar o Twilio (regra do projeto:
     sempre persistir antes de qualquer efeito visível), com
     `parallelLegStatus: RINGING`.
   - Chama `this.client.calls.create()` da API do Twilio com:
     - `machineDetection: 'DetectMessageEnd'`
     - `asyncAmd: 'true'`
     - `asyncAmdStatusCallback` apontando para o webhook que decide o vencedor
       (seção 4 abaixo)
4. Retorna a lista das 3 "legs" (pernas) da chamada para o front-end.

**No front-end**, o navegador do BDR entra na sala de conferência (não disca
nenhum número diretamente):

```ts
// useSoftphone.ts — callParallel()
const activeCall = await device.connect({ params: { mode: "parallel", batchId } });
```

O TwiML App do Twilio, ao receber essa conexão, chama de volta
`POST /v1/calls/voice` com `mode=parallel&batchId=...`, que o backend trata em
`handleParallelVoiceWebhook()` — o BDR entra na sala como **iniciador**
(`startConferenceOnEnter`/`endConferenceOnExit=true`), então a sala só existe
enquanto ele estiver nela.

---

## 2. Status atualizado para "discando"

O front-end expõe o status do softphone como uma máquina de estados
(`useSoftphone.ts`):

```ts
export type SoftphoneStatus =
  | "idle" | "registering" | "ready" | "connecting" | "in-call" | "error";
```

No fluxo paralelo, `status` vira `"connecting"` assim que `callParallel()` é
chamado, e só passa para `"in-call"` quando o `Call` do navegador emite
`accept` (ou seja, quando o BDR efetivamente entra na sala) — isso é
importante: **`in-call` aqui significa "o BDR está na sala", não "um prospect
atendeu"**. Quem sabe se um prospect real atendeu é o *poll* de status do
batch, não o evento do SDK.

Para exibir "discando" (ou os 3 contatos individualmente como "tocando"),
o front-end faz **polling** em:

**Endpoint:** `GET /v1/calls/parallel-batch/:id`
**Lógica:** `CallsService.getBatchStatus()` (`calls.service.ts:504-554`)

Retorna, para cada uma das 3 legs, o `parallelLegStatus` atual:

```ts
enum ParallelLegStatus {
  RINGING            // discando
  MACHINE_DETECTED   // caixa postal (AMD confirmou máquina)
  NO_ANSWER
  BUSY
  FAILED
  CONNECTED          // esta é a vencedora
  ABANDONED          // perdeu a corrida ou foi cancelada
}
```

Não há WebSocket nesta v1 — é polling simples desse endpoint enquanto o batch
estiver em aberto (nenhuma leg `CONNECTED` ainda e ainda existem legs
`RINGING`).

---

## 3. Classificação automática (ocupada / não atende / caixa postal)

Isso acontece por dois caminhos diferentes, dependendo do tipo de evento:

### a) Caixa postal / secretária eletrônica → via AMD
`CallsService.handleParallelLegAmd()` (`calls.service.ts:568-626`), chamado
pelo `asyncAmdStatusCallback` do Twilio. Se `AnsweredBy !== 'human'` (máquina,
fax, ou indeterminado):

```ts
await this.client.calls(call.twilioCallSid).update({ status: 'completed' });
await this.prisma.call.update({
  where: { id: callId },
  data: {
    parallelLegStatus: ParallelLegStatus.MACHINE_DETECTED,
    outcome: CallOutcome.VOICEMAIL, // classificado automaticamente, sem ação do BDR
  },
});
```

### b) Ocupado / não atende / falha → via status callback padrão do Twilio
`CallsService.handleParallelLegStatus()` (`calls.service.ts:645-681`), chamado
pelo `statusCallback` (evento `completed`) de cada leg:

```ts
const outcomeByStatus = {
  busy: CallOutcome.BUSY,
  'no-answer': CallOutcome.NO_ANSWER,
  failed: CallOutcome.INVALID_NUMBER,
};
```

Só aplica se a leg ainda estiver `RINGING` e sem `outcome` — ou seja, nunca
sobrescreve uma leg que o AMD ou o compare-and-swap já resolveu.

Essas 3 classificações (ocupado / não atende / caixa postal) marcam o contato
como **elegível para retry** — ficam na fila para ser discados de novo, em vez
de serem descartados:

```ts
// calls.service.ts
const RETRY_ELIGIBLE_OUTCOMES = new Set<CallOutcome>([
  CallOutcome.NO_ANSWER,
  CallOutcome.VOICEMAIL,
  CallOutcome.BUSY,
]);
```

No front-end, `useDialerQueue.requeuePersonId()` manda o contato para o fim da
fila local; `removeByPersonIds()` é usado só para outcomes finais (não
retry-eligible).

---

## 4. A primeira linha a atender permanece; as demais são encerradas

Esta é a parte mais delicada — duas chamadas podem ser atendidas quase
simultaneamente, então a decisão de "quem venceu" não pode confiar em timing
no front-end. A solução é um **compare-and-swap atômico no Postgres**, dentro
de `handleParallelLegAmd()`:

```ts
// calls.service.ts:599-625
const claim = await this.prisma.dialBatch.updateMany({
  where: { id: call.dialBatch.id, winnerCallSid: null }, // só ganha se ainda não tem vencedor
  data: { winnerCallSid: call.twilioCallSid },
});

if (claim.count === 1) {
  // Esta leg venceu a corrida — redireciona pro TwiML que entra na conference
  await this.client.calls(call.twilioCallSid).update({
    url: `${publicApiUrl}/v1/calls/parallel-leg-join?callId=${callId}`,
    method: 'POST',
  });
  await this.prisma.call.update({
    where: { id: callId },
    data: { parallelLegStatus: ParallelLegStatus.CONNECTED },
  });
} else {
  // Perdeu — encerra a chamada imediatamente
  await this.client.calls(call.twilioCallSid).update({ status: 'completed' });
  await this.prisma.call.update({
    where: { id: callId },
    data: {
      parallelLegStatus: ParallelLegStatus.ABANDONED,
      abandonedByParallelDial: true,
    },
  });
}
```

Por que isso funciona mesmo com concorrência real: o `updateMany` com
`where: { winnerCallSid: null }` é uma única instrução SQL — o Postgres
serializa as duas atualizações concorrentes, então **só uma** delas
efetivamente muda uma linha (`claim.count === 1`). A outra "perde" mesmo que
os dois webhooks do Twilio tenham chegado no mesmo milissegundo.

A leg vencedora é redirecionada (via `parallel-leg-join`) para dentro da mesma
sala de Conference onde o BDR já está esperando — nesse momento a ligação real
é bridged ao navegador.

### Se o BDR desligar antes de qualquer linha atender

`CallsService.cancelBatch()` (`calls.service.ts:690-728`) cancela via API REST
toda leg ainda `RINGING`, e marca todas como `ABANDONED` + `outcome: NO_ANSWER`
(retry-eligible) — sem isso, uma leg que fosse atendida depois do BDR já ter
saído criaria uma sala nova vazia com o prospect sozinho.

---

## Como as 3 linhas "dão lugar" ao próximo lote de contatos

Depois que o batch resolve (uma leg `CONNECTED`, ou todas as 3 resolvidas sem
vencedor), o front-end:

1. Para a leg vencedora: segue o fluxo normal de ligação (pesquisa de conta,
   timer, modal de outcome ao desligar).
2. Para as legs perdedoras: `useDialerQueue.requeuePersonId()` ou
   `removeByPersonIds()`, dependendo do outcome (retry-eligible vs final).
3. Um novo `POST /v1/calls/parallel-batch` é disparado para o próximo lote de
   até 3 contatos da fila — o mesmo fluxo do ponto 1 se repete.

---

## Coisas para checar antes de replicar em outro ambiente

- **Variáveis de ambiente Twilio obrigatórias** (o app falha o boot sem elas —
  ver `apps/backend/src/config/env.validation.ts`):
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`,
  `TWILIO_TWIML_APP_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`,
  `PUBLIC_API_URL` (precisa ser publicamente alcançável pelo Twilio para os
  webhooks).
- O TwiML App do Twilio precisa ter a **Voice URL** apontando para
  `POST {PUBLIC_API_URL}/v1/calls/voice`.
- Todos os webhooks do Twilio (`/calls/voice`, `/calls/parallel-leg*`,
  `/calls/recording-status`) são `@Public()` — não passam pelo `JwtAuthGuard`
  — e devem ser validados pela assinatura de requisição do Twilio, não por
  JWT.
- É necessária a migration que adiciona `DialBatch` e o campo
  `parallelLegStatus` em `Call` (`prisma/schema.prisma`) — sem isso os
  endpoints de batch não funcionam. Nesta branch: migration
  `20260824000000_add_multi_tenancy` e as seguintes em
  `apps/backend/prisma/migrations/`.

---

## O que falta fazer (frontend) para o botão "Iniciar discagem" usar isso

Hoje `useDialerStage.tsx` chama `softphone.call(phone, personId)` — 1 linha.
Para ativar o fluxo de 3 linhas descrito acima, é preciso reescrever esse
hook (ou criar um novo, ex: `useParallelDialerStage.ts`) seguindo este
roteiro:

1. **Ao clicar "Iniciar discagem"**: chamar `startParallelBatch(cadenceId,
   accessToken)` (já existe em `dialer-api.ts`). Guardar o `batchId` e a
   lista de `legs` retornada (nome/telefone dos até 3 contatos que entraram
   no batch).
2. **Imediatamente depois**: chamar `softphone.callParallel(batchId)` (já
   existe em `useSoftphone.ts`) para o navegador do BDR entrar na sala de
   Conference e esperar.
3. **Status "discando"**: enquanto isso, mostrar as 3 linhas como
   "Discando"/"Tocando" na UI (isso é puramente visual — os dados reais vêm
   do poll abaixo).
4. **Poll de status**: a cada ~1–2s, chamar `getBatchStatus(batchId,
   accessToken)` (já existe) até que:
   - uma leg tenha `status === "CONNECTED"` → essa é a vencedora. Parar o
     poll, atualizar a UI para "Estado 2 — conectado" com os dados dessa
     pessoa (o campo `winner` da resposta já traz nome/conta/role prontos).
   - **ou** todas as legs tiverem resolvido sem vencedor (todas em
     `MACHINE_DETECTED`/`NO_ANSWER`/`BUSY`/`FAILED`) → nenhuma atendeu,
     nenhum humano — encerrar o batch (ver próximo item) e já disparar o
     próximo lote de 3 (repetir o passo 1) automaticamente, sem esperar ação
     do BDR — é isso que corresponde a "os contatos seguintes tomam o
     lugar" mencionado pelo CEO.
5. **Nas legs perdedoras** (toda leg que não é a vencedora, uma vez que o
   batch resolveu): usar `useDialerQueue.requeuePersonId()` para as
   retry-eligible (`NO_ANSWER`/`VOICEMAIL`/`BUSY`) e `removeByPersonIds()`
   para as finais (ex: `INVALID_NUMBER`/`FAILED`) — mesma lógica que já
   existe hoje para o outcome de uma chamada de 1 linha, só que agora
   aplicada às 2 (ou 3) legs perdedoras de uma vez.
6. **Se o BDR clicar "Encerrar ligação" antes de alguém atender**: chamar
   `cancelBatch(batchId, accessToken)` (já existe) em vez de
   `softphone.hangup()` sozinho — isso é o que cancela as legs `RINGING` no
   lado do Twilio, evitando a "sala fantasma" descrita na seção 4 acima.
7. **Depois que a leg vencedora atende**: o fluxo já existente de "Estado 2"
   (pesquisa de conta, timer de chamada, modal de outcome ao desligar) pode
   ser reaproveitado quase sem mudança — a única diferença é que o `callId`
   ativo agora vem do campo `winner.callId` da resposta do batch, em vez de
   ser buscado depois via `getLatestCallForPerson`.

Um jeito seguro de fazer essa mudança: manter `useDialerStage.tsx` como está
(fluxo de 1 linha, como fallback) e criar a variante paralela do zero
reaproveitando `useSoftphone`, `useDialerQueue`, `useResearchCard` e
`useCallTimer`, que não precisam mudar — só a camada de orquestração muda.
