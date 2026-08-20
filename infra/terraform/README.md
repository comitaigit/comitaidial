# Infraestrutura AWS (Terraform)

Padrão EC2 + Docker + Nginx — o mesmo usado em produção pelo Fechai
(`fechou-backend`): uma instância EC2 (Graviton/arm64) roda dois containers
Docker (`comitai-backend`, `comitai-frontend`) e o Nginx da própria máquina
faz proxy reverso, roteando por subdomínio. Sem ALB, sem ECS, sem NAT
Gateway — bem mais barato e simples que a alternativa com Application Load
Balancer.

Dois ambientes, isolados via **Terraform workspaces** (`dev` e `prod`) —
cada um com seu próprio state, VPC, EC2, RDS. Nunca aplique no workspace
`default`: um guard (`environments.tf`) recusa o apply se você esquecer de
selecionar `dev`/`prod`.

## Domínios

```
prod:  comitai.app           → frontend
       api.comitai.app       → backend
dev:   dev.comitai.app       → frontend
       dev.api.comitai.app   → backend
```

Frontend e API ficam em subdomínios irmãos do mesmo domínio pai
(`comitai.app`), o que permite ao cookie de refresh do backend usar
`Domain=.comitai.app` e ser compartilhado entre os dois — ver
`apps/backend/src/auth/auth.controller.ts` (`COOKIE_DOMAIN`).

O domínio está registrado na **GoDaddy** — o DNS **não** está no Route53,
então apontar os subdomínios é um passo manual lá (ver seção DNS abaixo).

## Pré-requisitos

```bash
brew install hashicorp/tap/terraform
```

Credenciais AWS configuradas via variáveis de ambiente (não commitadas —
veja o `.env` da raiz do monorepo, que já é gitignored):

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=sa-east-1
```

Um key pair EC2 por ambiente (para SSH, mesmo padrão do `fechou-ec2-key`):

```bash
aws ec2 create-key-pair --key-name comitai-dev-key --region sa-east-1 \
  --query 'KeyMaterial' --output text > ~/.ssh/comitai-dev-key.pem
chmod 400 ~/.ssh/comitai-dev-key.pem

aws ec2 create-key-pair --key-name comitai-prod-key --region sa-east-1 \
  --query 'KeyMaterial' --output text > ~/.ssh/comitai-prod-key.pem
chmod 400 ~/.ssh/comitai-prod-key.pem
```

## Escolher o ambiente

```bash
cd infra/terraform
terraform init

terraform workspace new dev    # primeira vez; depois só "select"
terraform workspace new prod   # idem

terraform workspace select dev   # ou prod
terraform workspace show         # confirma qual está ativo
```

Cada ambiente tem seu próprio arquivo de variáveis (secrets como senha do
banco e segredos JWT **não** entram aqui — são gerados automaticamente pelo
Terraform e guardados no Secrets Manager, ver `secrets.tf`):

```bash
cp dev.tfvars.example dev.tfvars     # para o workspace dev
cp prod.tfvars.example prod.tfvars   # para o workspace prod
```

## Primeiro deploy de um ambiente

### 1. Criar a infra base

```bash
terraform workspace select dev   # ou prod
terraform apply -var-file=dev.tfvars   # ou prod.tfvars
```

Isso cria VPC, RDS, ECR (2 repos), a instância EC2 (que já instala Docker +
Nginx sozinha via user-data) e os secrets no Secrets Manager. Nesta etapa
ainda não existe nenhuma imagem nos repositórios ECR, então o primeiro
deploy automático dentro da instância falha — é esperado, corrigido na
próxima etapa.

```bash
terraform output instance_public_ip
terraform output ecr_backend_repository_url
terraform output ecr_frontend_repository_url
```

### 2. Build e push das imagens

O domínio da API já é previsível a partir do ambiente (não depende de
nenhum output dinâmico), então dá pra buildar direto:

```bash
cd ../..   # volta pra raiz do monorepo

ENV=dev   # ou prod
API_DOMAIN=dev.api.comitai.app   # ou api.comitai.app para prod
ECR_BACKEND=$(cd infra/terraform && terraform output -raw ecr_backend_repository_url)
ECR_FRONTEND=$(cd infra/terraform && terraform output -raw ecr_frontend_repository_url)
REGION=sa-east-1

aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin "$(echo $ECR_BACKEND | cut -d/ -f1)"

# Graviton/arm64 — a instância é arm64, então o build precisa ser também
# (mesma exigência do Fechai).
docker build --platform linux/arm64 -f apps/backend/Dockerfile --target prod \
  -t "$ECR_BACKEND:latest" .
docker push "$ECR_BACKEND:latest"

# Enquanto enable_https=false, use http:// aqui; depois que o HTTPS estiver
# ativo (ver seção DNS/HTTPS abaixo), rebuilde com https://.
docker build --platform linux/arm64 -f apps/frontend/Dockerfile --target prod \
  --build-arg NEXT_PUBLIC_API_URL="http://$API_DOMAIN" \
  -t "$ECR_FRONTEND:latest" .
docker push "$ECR_FRONTEND:latest"
```

### 3. Rodar o deploy na instância

```bash
SSH_CMD=$(cd infra/terraform && terraform output -raw ssh_command)
$SSH_CMD
# dentro da instância:
./deploy.sh
```

`deploy.sh` já está na instância (escrito pelo user-data) — ele faz login no
ECR, puxa os secrets do Secrets Manager, faz `docker pull` das novas imagens
e reinicia os dois containers.

## Deploys seguintes

Repita a etapa 2 (build + push) e depois SSH + `./deploy.sh`. Não precisa
rodar `terraform apply` de novo a menos que a infra em si mude. Confira
`terraform workspace show` antes, pra não fazer deploy no ambiente errado.

## DNS (GoDaddy) e HTTPS

**1.** Aplique a infra base (etapa 1 acima) para obter o IP:

```bash
terraform output instance_public_ip
```

**2.** No painel da GoDaddy (Meu Domínio → DNS → Gerenciar DNS), crie **dois
registros A** por ambiente, ambos apontando pro mesmo IP:

Para `prod`:
| Tipo | Host | Valor | TTL |
|---|---|---|---|
| A | `@` | `<instance_public_ip>` | 1 hora |
| A | `api` | `<instance_public_ip>` | 1 hora |

Para `dev`:
| Tipo | Host | Valor | TTL |
|---|---|---|---|
| A | `dev` | `<instance_public_ip>` | 1 hora |
| A | `dev.api` | `<instance_public_ip>` | 1 hora |

**3.** Aguarde a propagação (minutos a poucas horas) — confirme com
`dig comitai.app` / `dig api.comitai.app` (ou os `dev.` correspondentes)
até verem o IP certo.

**4.** Ligue o HTTPS:

```bash
# no dev.tfvars ou prod.tfvars:
enable_https = true
```

```bash
terraform apply -var-file=dev.tfvars   # ou prod.tfvars
```

Isso não re-roda o user-data numa instância já existente — rode o certbot
manualmente por SSH:

```bash
$SSH_CMD
sudo dnf install -y python3-pip
sudo pip3 install certbot certbot-nginx
sudo certbot --nginx -d dev.comitai.app -d dev.api.comitai.app \
  --non-interactive --agree-tos -m admin@comitai.app --redirect
```

(Ajuste os domínios do comando acima para `comitai.app`/`api.comitai.app`
se estiver fazendo isso em `prod`.)

**5.** Rebuilde a imagem do frontend com `https://` no `NEXT_PUBLIC_API_URL`
(etapa 2) e rode `./deploy.sh` de novo.

## Rodar migrations do Prisma

O RDS não é publicamente acessível (só a partir da VPC/instância EC2). Como
o Dockerfile do backend já não roda migration automaticamente neste projeto
(diferente do Fechai), rode manualmente por SSH:

```bash
$SSH_CMD
docker exec -it comitai-backend sh -c "cd /app && npx prisma migrate deploy"
```

Ou considere adicionar `npx prisma migrate deploy &&` ao `CMD` do
`apps/backend/Dockerfile`, igual o Fechai faz, se preferir migration
automática no boot do container.

## Destruir um ambiente

```bash
terraform workspace select dev   # confirme o ambiente certo antes!
terraform destroy -var-file=dev.tfvars
```

`deletion_protection = true` está ativo no RDS — remova manualmente essa
proteção (`terraform apply` com a flag mudada, ou pelo console) antes do
destroy conseguir apagar o banco.

## Limitações conhecidas / próximos passos

- **State local**: `terraform.tfstate` (um por workspace) fica só nesta
  máquina. Migrar para backend S3 se mais de uma pessoa for rodar Terraform.
- **Single instance, sem HA**: uma EC2 por ambiente, sem redundância — se a
  instância cair, o app cai junto até reiniciar manualmente ou via
  Auto Scaling Group (não configurado). Aceitável neste estágio; revisar se
  uptime se tornar crítico.
- **Deploy manual via SSH**: não há pipeline de CI/CD ainda — build, push e
  `./deploy.sh` são passos manuais. Automatizar com GitHub Actions é o
  próximo passo natural.
