# condoplus

Gestão enxuta de condomínios residenciais de casas: **comunicados, reservas de espaços, documentos e prestação de contas**. É multi-tenant (um Admin Master administra vários condomínios), PWA, mobile-first e em pt-BR.

A especificação completa está em [`ESPECIFICACAO.md`](ESPECIFICACAO.md) e as decisões técnicas, em [`docs/DECISOES.md`](docs/DECISOES.md).

**Produção:** https://condoplus.163-176-209-227.sslip.io

## Stack

Next.js 16 (App Router, TypeScript) · Prisma 7 + PostgreSQL 17 · Better Auth · Tailwind 4 · Zod · MinIO (S3) · Vitest · Docker (linux/arm64).

## Rodando localmente

Requisitos: Node 22+ e Docker.

```bash
cp .env.example .env          # ajuste se quiser
docker compose up -d          # Postgres em 127.0.0.1:55432 e MinIO em 127.0.0.1:59000 (console :59001)
npm install                   # também roda `prisma generate`
npx prisma migrate dev        # aplica as migrations
npm run db:seed               # dados de exemplo (apaga e recria os condomínios de exemplo)
npm run dev                   # http://localhost:3000
```

### Credenciais de teste (seed)

| Papel | E-mail | Senha |
|---|---|---|
| Admin Master | `MASTER_EMAIL` do `.env` (padrão `master@condoplus.local`) | `MASTER_PASSWORD` (padrão `master123456`) |
| Síndica e moradora da Casa 01 (Residencial Exemplo) | `sindico@exemplo.com` | `senha12345` |
| Moradora (Casa 03 do Residencial Exemplo e Casa 1 da Vila Pequena) | `ana@exemplo.com` | `senha12345` |
| Moradores | `bruno@`, `carla@`, `diego@`, `elisa@exemplo.com` | `senha12345` |
| Cadastro pendente | `pendente@exemplo.com` | `senha12345` |
| Transferência pendente (Casa 05) | `transferencia@exemplo.com` | `senha12345` |
| Síndico da Vila Pequena (2º condomínio, para testar isolamento) | `sindico2@exemplo.com` | `senha12345` |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Vitest (permissões, isolamento entre tenants e regras de negócio; usa o banco `<db>_test`) |
| `npm run test:e2e` | Playwright contra um servidor local na porta 3100 (veja `playwright.config.ts`) |
| `npm run build` | build de produção (standalone) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | seed de exemplo |

## Acesso sem e-mail

Por enquanto o sistema **não envia e-mails**:

- **Síndico:** o Admin Master cadastra (Admin → condomínio → Síndico) e recebe uma **senha provisória** na tela, com um botão para copiar a mensagem pronta para enviar por WhatsApp. No primeiro acesso, o síndico é obrigado a definir uma senha nova.
- **Esqueceu a senha:** o master usa **"Redefinir senha"** (no síndico ou no morador, dentro do condomínio) e repassa a nova senha provisória.
- **Trocar a própria senha:** Perfil (síndico/morador) ou o ícone de chave no `/admin` (master).

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example). As principais:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | conexão do Postgres |
| `APP_URL`, `BETTER_AUTH_URL` | URL pública (define os cookies `Secure` quando é https) |
| `BETTER_AUTH_SECRET` | segredo de sessão (`openssl rand -base64 32`) |
| `MASTER_EMAIL`, `MASTER_PASSWORD`, `MASTER_NAME` | Admin Master, criado no start se não existir |
| `STORAGE_DRIVER`, `S3_*`, `STORAGE_LOCAL_DIR` | storage de arquivos (fase 5) |
| `UPLOAD_MAX_MB` | limite por arquivo (padrão 20) |
| `EMAIL_PROVIDER`, `EMAIL_FROM`, `SMTP_*`, `RESEND_API_KEY` | e-mail (a OCI bloqueia a porta 25) |

Na produção, o `docker-compose.prod.yml` também usa `POSTGRES_PASSWORD`, `MINIO_ROOT_USER` e `MINIO_ROOT_PASSWORD`. Ele monta `DATABASE_URL` e `S3_*` a partir delas.

## Deploy (VPS OCI)

O fluxo é o mesmo do financial-ledger:

1. Push/merge na **`main`** → workflow **CI** (lint, typecheck, testes com Postgres, build).
2. Com o CI verde → workflow **Deploy**: build `linux/arm64` (QEMU), push para `ghcr.io/lmatospereira/condoplus` (`latest`, `<sha>` e `v<VERSION>`), SSH na VPS, baixa o `docker-compose.prod.yml` daquele commit para `~/condoplus/docker-compose.yml`, `docker compose pull && up -d`, espera o healthcheck e testa `https://condoplus.163-176-209-227.sslip.io/api/health`.

A `develop` roda só o CI. Também dá para disparar o deploy pela aba **Actions → Deploy → Run workflow**.

### Segredos do repositório

`VPS_HOST`, `VPS_USER` e `VPS_SSH_KEY`. A chave é uma ed25519 dedicada (`github-actions-deploy@condoplus`), autorizada em `~opc/.ssh/authorized_keys`.

### Na VPS

```
~/condoplus/
├── .env                 # segredos de produção (chmod 600, fora do git)
├── docker-compose.yml   # cópia do docker-compose.prod.yml (gravada pelo deploy)
└── deploy.sh            # cópia de scripts/deploy.sh (deploy manual)
```

- Nenhuma porta é publicada no host. O app entra na rede `devbox_default` com o alias `condoplus-app`, e o Caddy do devbox (`/home/opc/devbox/Caddyfile`) faz o HTTPS:

  ```caddy
  condoplus.{$DOMAIN} {
  	tls {
  		issuer acme {
  			disable_http_challenge
  		}
  	}
  	encode zstd gzip
  	reverse_proxy condoplus-app:3000
  }
  ```

  Depois de editar o Caddyfile: `docker exec devbox-caddy-1 caddy validate --config /etc/caddy/Caddyfile && docker exec devbox-caddy-1 caddy reload --config /etc/caddy/Caddyfile`.
- **Atualizar a versão:** basta fazer merge na `main`. Para fazer manualmente ou voltar uma versão: `~/condoplus/deploy.sh <sha|vX.Y.Z|latest>`.
- **Logs:** `cd ~/condoplus && docker compose logs -f app` (com rotação de 10 MB × 3).
- As migrations rodam sozinhas no start do container (`prisma migrate deploy`).
- O backup diário e a restauração entram na fase 7.
