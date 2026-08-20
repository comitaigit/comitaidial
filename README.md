# Comitai Dialer

Monorepo do Comitai Dialer: backend em NestJS + Postgres, frontend em Next.js.

## Stack

- **Backend** (`apps/backend`): NestJS 11, Prisma 7 (driver adapter `@prisma/adapter-pg`), Postgres 17, autenticação JWT (access curto + refresh rotativo em cookie httpOnly).
- **Frontend** (`apps/frontend`): Next.js 16 (App Router), roda no host (fora do Docker) para hot reload rápido.
- **Infra**: Docker Compose para Postgres + backend; pnpm workspaces para o monorepo.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) — o repo usa `pnpm@11.22.0` (via corepack)
- [Docker](https://www.docker.com/) e Docker Compose

```bash
corepack enable
```

## Setup inicial

1. Clone o repositório e instale as dependências:

   ```bash
   pnpm install
   ```

2. Copie os arquivos de ambiente de exemplo e ajuste se necessário:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env.local
   ```

   Os valores padrão já funcionam para desenvolvimento local. Para gerar segredos JWT
   reais (obrigatório fora de dev local):

   ```bash
   openssl rand -base64 64
   ```

## Rodando o projeto

Sobe Postgres + backend no Docker e o frontend no host, tudo de uma vez:

```bash
pnpm dev
```

Ou peça por peça:

```bash
pnpm dev:backend     # docker compose up backend (sobe postgres via depends_on)
pnpm dev:frontend    # pnpm --filter comitai-frontend dev — roda no host
pnpm stop            # docker compose down — para postgres + backend
```

### Portas

| Serviço      | URL                              |
|--------------|-----------------------------------|
| Frontend     | http://localhost:3000            |
| Backend API  | http://localhost:3001 (rotas versionadas em `/v1/...`) |
| Postgres     | localhost:5433                   |

> A porta do Postgres é 5433 (não a padrão 5432) para não colidir com uma instalação
> local do Postgres na máquina.

## Banco de dados

Com o Postgres no ar (`pnpm dev:backend` ou `docker compose up -d postgres`):

```bash
pnpm db:migrate      # prisma migrate dev — cria e aplica uma nova migration
pnpm db:studio       # abre o Prisma Studio (navegador visual do banco)
```

## Build e lint

```bash
pnpm build:frontend
pnpm build:backend
pnpm lint:frontend
pnpm lint:backend
```

Não há `pnpm build`/`pnpm lint` combinados — rode os dois explicitamente se a mudança
afeta ambos os apps.

## Estrutura

```
comitai-dialer/
  apps/
    frontend/   Next.js App Router — arquitetura em vertical slices (features/)
    backend/    NestJS — módulos por feature, Prisma, autenticação JWT
  docker-compose.yml
  package.json  scripts de orquestração da raiz
```

Cada app tem suas próprias skills/documentação com convenções específicas:
- `apps/frontend/AGENTS.md`
- `apps/backend/AGENTS.md`

## Variáveis de ambiente

### `apps/backend/.env`

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão Postgres (driver adapter `@prisma/adapter-pg`) |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_TTL` | Segredo e TTL do access token (padrão 15m) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_TTL` | Segredo e TTL do refresh token (padrão 30d) |
| `CORS_ORIGINS` | Origens permitidas (ex: `http://localhost:3000`) |
| `REFRESH_COOKIE_NAME` | Nome do cookie httpOnly do refresh token |

`JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` nunca podem ser iguais, e em produção
precisam ter 32+ caracteres — a aplicação recusa subir se isso não for respeitado
(veja `apps/backend/src/config/env.validation.ts`).

### `apps/frontend/.env.local`

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API do backend (ex: `http://localhost:3001/v1`) |

Nenhum dos dois `.env*` reais é versionado — apenas os `.env.example`.
