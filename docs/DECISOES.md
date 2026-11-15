# Decisões técnicas

Registro das escolhas feitas durante a implementação (seção 15 da especificação).

## Fase 1 — Fundação

### Stack e versões
- **Next.js 16.4** (App Router, TypeScript strict, `output: "standalone"`), **React 19.3**, **Tailwind 4.3**.
- **Prisma 7.10** com o gerador `prisma-client` (cliente em TypeScript, em `src/generated/prisma`) e o driver adapter `@prisma/adapter-pg`. Não há binário de query engine, o que simplifica o ARM64. A URL do banco fica em `prisma.config.ts` (padrão do Prisma 7).
- **Better Auth 1.7** com adapter Prisma, e-mail e senha e sessão no banco (cookie httpOnly).
- `cacheComponents` (padrão do create-next-app 16.4) foi **desligado**: quase todas as páginas dependem da sessão e do tenant, e o modelo dinâmico clássico é mais simples para este app.
- **Node 22** no Docker e no CI, igual ao financial-ledger.

### Autenticação
- Hash de senha: **scrypt** (padrão do Better Auth). A especificação pede argon2 ou bcrypt; o scrypt é igualmente recomendado pela OWASP e evita uma dependência nativa (argon2) no build ARM64.
- `disableSignUp: true`: não existe cadastro aberto. As contas nascem pelo master (síndico, fase 2) ou pelo link de convite (moradores, fase 3), sempre pelo servidor.
- Campos extras do usuário: `telefone`, `isMaster`, `ativo`. O nome usa o campo padrão `name` do Better Auth.
- O login é feito por **server action** (`src/app/actions/auth.ts`), chamando `auth.api.signInEmail` com o plugin `nextCookies`. O cliente JS do Better Auth não é necessário.
- **Rate limiting**: o limitador do próprio Better Auth com `storage: "database"` (tabela `rate_limit`, sem Redis). Login: 5 por minuto por IP. Pedido e redefinição de senha também têm limite. O IP vem de `X-Forwarded-For`, que o Caddy define com o IP real do cliente.
- O Admin Master é garantido no start do servidor (`src/instrumentation.ts` → `ensureMaster`) a partir de `MASTER_EMAIL`/`MASTER_PASSWORD`. A conta é criada só na primeira vez; a senha não é sobrescrita depois.

### Multi-tenancy
- **Condomínio ativo**: cookie httpOnly `cp_condominio`, usado só como preferência. Em toda requisição, `getTenantContext()` (`src/lib/tenant.ts`) **revalida no banco** se o usuário tem vínculo ATIVO naquele condomínio (o master pode abrir qualquer um). Sem cookie e com um único condomínio, este é escolhido automaticamente.
- **`tenantDb(condominioId)`** (`src/lib/tenant-db.ts`): extensão do Prisma Client que injeta `condominioId` em todo `where` (inclusive `findUnique`, `update` e `delete`, via filtros extras em `WhereUnique`) e em todo `create` dos modelos de tenant. Um `condominioId` vindo do cliente é sobrescrito. Os testes estão em `tests/integration/tenant-isolation.test.ts`.
- Limite conhecido: a extensão não filtra **relações aninhadas** (`include`/`connect`). Ao conectar um registro por ID vindo do cliente (ex.: `espacoId` numa reserva), a regra de negócio deve buscá-lo primeiro com `tenantDb`.

### Permissões
- `can(ator, acao, recurso)` em `src/lib/permissions.ts`: funções puras, cobertas por `tests/unit/permissions.test.ts`. O "ator" é montado no servidor a partir dos vínculos ativos, nunca a partir do cliente.

### Banco
- **Índices únicos parciais** em SQL puro na migration `init`, porque o Prisma não os gera pelo schema:
  - `Reserva_ativa_espaco_data_periodo_key`: `(espacoId, data, periodo) WHERE excluidoEm IS NULL`;
  - `Vinculo_sindico_ativo_condominio_key`: `(condominioId) WHERE papel = 'SINDICO' AND status = 'ATIVO'`.
- `Reserva.periodo` é **NOT NULL** (`DIA_INTEIRO` no modo dia inteiro). Com NULL, dois nulos seriam considerados diferentes e o índice deixaria passar duplicatas.
- Datas sem horário (`@db.Date`) em reservas, documentos e despesas. As regras de "hoje" vão usar o fuso America/Sao_Paulo (fase 4).
- As tabelas `PasswordResetToken`/`SetPasswordToken` da especificação **não** foram criadas: o Better Auth já guarda tokens de redefinição de senha na tabela `verification`, e o "definir senha" do síndico (fase 2) vai usar o mesmo mecanismo.

### Storage
- **MinIO**: a imagem `minio/minio` saiu do Docker Hub (o MinIO parou de publicar imagens da edição comunitária). Foi usada a **`cgr.dev/chainguard/minio`**, compatível (mesmo binário e variáveis), com arm64 e com o `mc` para o healthcheck. O driver de storage continua S3 genérico (fase 5): dá para trocar por OCI Object Storage, R2 ou S3 só pelas variáveis de ambiente.

### Segurança
- Cabeçalhos em `next.config.ts`: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS (só em produção).
- A CSP usa `script-src 'self' 'unsafe-inline'`, porque o Next injeta scripts inline de hidratação. Para tirar o `unsafe-inline`, seria preciso usar nonce no proxy, e isso deixaria todas as páginas dinâmicas. Fica como melhoria futura.
- O `proxy.ts` (o antigo middleware) só faz a checagem otimista do cookie. A validação real acontece no servidor.

### Deploy (diferente da seção 16.2)
- A seção 16.2 previa a imagem **construída na VPS**. O deploy segue o padrão dos outros projetos (financial-ledger): **GitHub Actions** → imagem `linux/arm64` (QEMU) no **GHCR** (`ghcr.io/lmatospereira/condoplus`) → SSH na VPS → `docker compose pull && up -d` em `~/condoplus`. Isso poupa CPU e disco da VPS compartilhada.
- O `docker-compose.prod.yml` é versionado no repo, e o workflow baixa o da versão publicada para `~/condoplus/docker-compose.yml`. O `.env` com os segredos só existe na VPS (chmod 600).
- Apenas `main` → produção, por enquanto. A branch `develop` roda só o CI. Ambientes dev/hml como os do financial-ledger podem ser adicionados depois, se necessário.
- `prisma migrate deploy` roda no entrypoint do container, com uma instalação isolada da CLI do Prisma em `/app/migrate`, porque o standalone do Next não inclui a CLI.

### Testes
- Vitest com um banco separado (`<DATABASE_URL>_test`, ou `TEST_DATABASE_URL`), migrado com `prisma migrate deploy` no global setup. Cada teste cria e apaga os próprios dados. O `migrate reset` não é usado (destrutivo).
