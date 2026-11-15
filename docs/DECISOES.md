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
- As tabelas `PasswordResetToken`/`SetPasswordToken` da especificação **não** foram criadas: a fase 2 passou a funcionar sem e-mail (ver abaixo).

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

## Fase 2 — Admin Master (sem e-mail)

### Cadastro manual em vez de e-mail (mudança pedida pelo usuário)
- A especificação (5.2) previa um e-mail com link para o síndico definir a senha. Por decisão do usuário, a fase 2 **não depende de e-mail**:
  - ao cadastrar um síndico com e-mail novo, o sistema cria a conta com uma **senha provisória** (3 blocos de 4 caracteres sem ambíguos, ~70 bits, ex. `k7Pq-xM3a-9vTz`), exibida **uma única vez** ao master, com um botão "Copiar mensagem" pronta para WhatsApp;
  - a senha provisória marca `User.trocarSenha = true`. Enquanto esse campo for verdadeiro, `requireUsuario`/`getTenantContext` mandam o usuário para `/trocar-senha`, e nenhuma página do app nem do admin abre antes da troca;
  - o "esqueci minha senha" por e-mail foi trocado por **"Redefinir senha"** feito pelo master (síndico e moradores ativos). A ação gera uma nova senha provisória e encerra as sessões abertas;
  - todo usuário pode trocar a própria senha no Perfil (o master, em `/admin/senha`). Isso usa `auth.api.changePassword` com `revokeOtherSessions`.
- Se o e-mail informado já tem conta, ela é **vinculada** como síndico e a senha não é alterada (não aparece senha provisória).
- A camada de e-mail continua prevista para quando houver um provedor (Resend/SMTP 587). A troca é aditiva: dá para voltar ao link por e-mail sem migrar dados.

### Regras
- Os serviços ficam em `src/server/admin.ts`. São funções que recebem o `ator`, chamam `assertCan` e são testadas em `tests/integration/admin.test.ts`. As server actions (`src/app/admin/actions.ts`) só validam o formulário (Zod em `src/lib/schemas/admin.ts`) e traduzem os erros.
- **Troca de síndico**: tudo numa transação. O vínculo SINDICO anterior vira `INATIVO` (com `desativadoEm`) e o novo é criado `ATIVO`. O índice único parcial garante no máximo um síndico ativo, mesmo com requisições concorrentes. O vínculo MORADOR do síndico anterior não é afetado.
- O master não pode ser síndico. "Remover síndico" deixa o condomínio sem síndico.
- **Casas**: "adicionar em sequência" continua a numeração a partir da maior `Casa NN` existente. Identificador duplicado gera um erro amigável (P2002). Casas são **desativadas**, nunca excluídas, para manter o histórico.
- **Espaços**: o modo de reserva não pode mudar com reservas futuras ativas (data ≥ hoje em America/Sao_Paulo), e um período com reserva futura não pode ser removido. Espaços com histórico de reservas não podem ser excluídos, só desativados. Dias bloqueados são digitados como `AAAA-MM-DD`.
- **Auditoria**: criação e edição de condomínio, casas e espaços, definição, troca e remoção de síndico e redefinição de senha (sem a senha). O detalhe do condomínio mostra as últimas 30 ações.

### Testes
- Vitest: 47 testes (permissões, isolamento, regras da fase 2, datas no fuso de SP).
- **Playwright** (`npm run test:e2e`, `tests/e2e`, perfil Pixel 7): o master cria o condomínio, renomeia uma casa, cadastra um espaço e o síndico; o síndico entra com a senha provisória e é obrigado a trocá-la; a troca de síndico tira o acesso do anterior. Roda contra um servidor local já de pé (ver `playwright.config.ts`); ainda não está no CI.

## Moradores, reservas e comunicados (v0.3)

- **Convite**: há no máximo um link ativo por condomínio (gerar um novo revoga o anterior), com validade opcional. O token tem 24 bytes aleatórios (base64url).
- **Cadastro pelo link sem e-mail**: o morador escolhe a própria senha. Se o e-mail já tem conta, é **obrigatório informar a senha dessa conta**, para que ninguém crie um pedido de vínculo em nome de outra pessoa. O cadastro tem rate limit por IP (10 a cada 10 minutos), guardado na mesma tabela `rate_limit`, com chave `app:*`.
- **A página do convite não expõe quem mora em cada casa**: mostra só se a casa já tem titular, para perguntar se a pessoa vai morar junto ou se a casa mudou de morador.
- **Transferência**: ao aprovar, todos os vínculos MORADOR ativos da casa viram INATIVO, sem exclusão. As reservas futuras criadas por ex-moradores aparecem para o síndico manter ou excluir.
- **Mudança de casa**: é um novo vínculo PENDENTE com `substituiVinculoId`. Ao aprovar, o vínculo antigo do mesmo usuário é desativado.
- **Reservas**: confirmadas na hora. Datas passadas e dias bloqueados valem para todos; antecedência e limite mensal valem só para moradores (o síndico pode ignorar). O conflito é garantido pelo índice único parcial, e o erro P2002 vira "já está reservado". Há um teste de corrida com duas reservas simultâneas.
- **Comunicados**: markdown simples renderizado como elementos React (sem HTML cru e sem dependência). A leitura é registrada ao abrir. "Lido por X de Y casas" conta as casas com morador ativo que têm ao menos um leitor. **Anexos** ficam para o módulo de Documentos (storage S3/MinIO).

## Zelora (v0.3)

- Renomeado de condoplus para **Zelora**. Ver [ADR-001](adr/ADR-001-renomeacao-zelora-e-site-no-mesmo-app.md).
- Página pública em `/` e app logado em `/inicio`. O login do master fica em URL escondida, ver [ADR-002](adr/ADR-002-login-do-master-em-url-escondida.md).
- Os tokens de cor e de raio de `docs/ZELORA-SDD.md` (SPEC 002) foram aplicados no `globals.css` como **tokens iniciais**. O documento diz que eles precisam de revisão e aprovação. O logo (telhado sobre um "Z", com versão principal e reduzida) é uma **proposta** para a SPEC 001, ainda a aprovar.
- O site institucional completo (SPEC 003) ainda **não foi implementado**: o documento exige spec, design e tasks aprovados antes de implementar.
