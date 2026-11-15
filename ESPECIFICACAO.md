# Prompt para o Claude Code — Sistema de Gestão de Condomínios (multi-tenant, PWA)

> Como usar: este arquivo já está em `/home/opc/projects/condoplus/ESPECIFICACAO.md` na VPS da OCI (a mesma pasta aparece no devbox/code-server). Abra o terminal nessa pasta, rode `claude` e envie:
> **"Leia o ESPECIFICACAO.md e implemente o sistema seguindo as fases descritas. Antes de começar, me apresente o plano da Fase 1."**
>
> O ambiente de produção (VPS OCI, Caddy, portas, rede Docker) está descrito na **seção 16**. Leia-a antes de planejar a Fase 1, porque ela afeta o Dockerfile, o docker-compose e as variáveis de ambiente.

---

## 1. Contexto e objetivo

Construa uma aplicação web **multi-tenant** para gestão de condomínios residenciais de casas (exemplo de referência: um condomínio com 18 casas e 1 salão de festas). Um **Admin Master** cadastra e administra vários condomínios. Cada condomínio tem um **Síndico** e **Moradores**.

O sistema deve ser **enxuto**. O escopo é **somente**:

1. **Comunicação** (comunicados do síndico para os moradores)
2. **Reserva de espaços** (ex.: salão de festas)
3. **Documentos** (o síndico publica, os moradores consultam)
4. **Prestação de contas** (o síndico lança as despesas, os moradores consultam)

Mais o necessário para isso funcionar: autenticação, cadastro por convite, aprovação de moradores, transferência de casa e gestão de condomínios pelo Admin Master.

**Fora do escopo** (não implementar): boletos e cobrança, integração bancária, portaria/visitantes, encomendas, ocorrências, chat, enquetes, pets, controle de acesso físico e câmeras.

A aplicação deve ser um **PWA (Progressive Web App)** instalável no celular (Android e iOS) e no desktop, com interface **mobile-first** e em **português do Brasil**.

---

## 2. Stack recomendada

Use as versões estáveis mais recentes:

- **Next.js** (App Router) + **TypeScript** (strict)
- **PostgreSQL** + **Prisma** (migrations versionadas)
- **Autenticação:** **Better Auth** (preferido: suporta e-mail e senha nativamente, com sessão em banco e adapter Prisma; o provider Credentials do Auth.js desencoraja esse uso e não persiste sessão em banco). Login por **e-mail e senha** (hash com argon2 ou bcrypt) e sessão segura em cookie httpOnly
- **Rate limiting:** sem Redis. A aplicação roda em uma única instância, então use uma tabela no Postgres (ou memória do processo, se for mais simples) para limitar login, cadastro, convite e "esqueci minha senha"
- **UI:** Tailwind CSS + shadcn/ui, com ícones lucide
- **Validação:** Zod, compartilhada entre formulários e server actions/rotas
- **Arquivos (documentos):** uma camada de storage abstrata, com disco local em desenvolvimento e S3 compatível em produção. Na VPS, o padrão é **MinIO em container** (rede interna, sem porta pública); o mesmo driver S3 deve funcionar com OCI Object Storage, Cloudflare R2 ou AWS S3 apenas trocando as variáveis de ambiente
- **E-mail** (recuperação de senha e avisos opcionais): uma camada abstrata com provedor configurável por variável de ambiente (SMTP ou Resend). Em desenvolvimento, registre os e-mails no console. **A OCI bloqueia a saída pela porta 25**: em produção use SMTP na porta 587/465 de um provedor (Resend, Brevo etc.) ou a API do Resend.
- **PWA:** Web App Manifest + service worker (Serwist ou equivalente compatível com o App Router)
- **Testes:** Vitest para regras de negócio e permissões, Playwright para os fluxos principais
- **Infra local:** `docker-compose.yml` com Postgres (e MinIO, se usar S3 local), `.env.example` documentado e script de seed
- **Infra de produção:** `docker-compose.prod.yml` + `Dockerfile` multi-stage com Next.js `output: "standalone"`, rodando na VPS OCI (**ARM64/aarch64**). Toda imagem e dependência nativa precisa funcionar em `linux/arm64` (veja a seção 16)

Se alguma escolha acima estiver desatualizada ou houver uma alternativa claramente melhor, proponha a troca no plano antes de implementar.

---

## 3. Multi-tenancy

- Modelo de **banco compartilhado com isolamento por `condominioId`**: toda tabela de dados de condomínio tem `condominioId` obrigatório e indexado.
- **Nenhuma consulta pode depender só do front-end para filtrar o tenant.** Crie uma camada de acesso a dados (ex.: `getTenantContext()` + repositórios) que sempre injeta o `condominioId` da sessão do usuário. Rotas e actions nunca confiam em um `condominioId` vindo do cliente sem validar que o usuário pertence àquele condomínio.
- O Admin Master é global (sem `condominioId`) e acessa qualquer condomínio pela área administrativa.
- Escreva **testes automatizados de isolamento**: um usuário do condomínio A não pode ler nem alterar nada do condomínio B (comunicados, reservas, documentos, despesas, arquivos, casas, usuários).
- Os arquivos no storage são organizados por prefixo `condominios/{condominioId}/...` e servidos somente por rota autenticada que valida o tenant (ou por URL assinada de curta duração), nunca públicos.

---

## 4. Papéis e permissões

| Ação | Admin Master | Síndico | Morador |
|---|---|---|---|
| Cadastrar, editar e desativar condomínios | ✅ | ❌ | ❌ |
| Cadastrar e editar as casas (unidades) do condomínio | ✅ | ❌ | ❌ |
| Ver o cadastro das casas e de quem mora em cada uma | ✅ | ✅ (do seu condomínio) | ❌ (vê apenas a própria casa) |
| Cadastrar ou trocar o síndico | ✅ (**exclusivo**) | ❌ | ❌ |
| Cadastrar, editar e remover espaços reserváveis | ✅ (**exclusivo**) | ❌ (apenas vê) | ❌ (apenas vê) |
| Gerar e revogar o link de convite do condomínio | ✅ | ✅ | ❌ |
| Aprovar ou recusar cadastros de moradores | ✅ | ✅ | ❌ |
| Aprovar ou recusar transferências de casa | ✅ | ✅ | ❌ |
| Desativar morador | ✅ | ✅ | ❌ |
| Comunicados: criar, editar, fixar e excluir | ❌ | ✅ | ❌ |
| Comunicados: ler | ✅ | ✅ | ✅ |
| Documentos: enviar, editar e excluir | ❌ | ✅ | ❌ |
| Documentos: consultar e baixar | ✅ | ✅ | ✅ |
| Prestação de contas: lançar, editar e excluir despesas | ❌ | ✅ | ❌ |
| Prestação de contas: consultar | ✅ | ✅ | ✅ |
| Reservas: ver o calendário de todas as reservas do condomínio | ✅ | ✅ | ✅ |
| Reservas: criar para **qualquer casa** do condomínio | ❌ | ✅ | ❌ |
| Reservas: criar para **a própria casa** | ❌ | ✅ (se for morador) | ✅ |
| Reservas: excluir **qualquer** reserva | ❌ | ✅ | ❌ |
| Reservas: excluir **apenas as que ele mesmo criou** | — | — | ✅ |

Regras adicionais:

- **Somente o Admin Master** cadastra ou troca o síndico. Ao trocar, o síndico anterior perde o papel de síndico imediatamente (mantém o acesso de morador apenas se estiver vinculado a uma casa ativa). O síndico **não** consegue promover ninguém.
- Um síndico pode também ser morador de uma casa do mesmo condomínio.
- Toda verificação de permissão deve ser feita **no servidor** (server actions, route handlers e camada de dados), com funções centralizadas (ex.: `can(user, action, resource)`). A interface apenas esconde o que o usuário não pode fazer.
- O Admin Master **não** cria comunicados, documentos nem despesas: essas áreas são do síndico. O master apenas visualiza, para suporte.

---

## 5. Fluxos de cadastro e acesso

### 5.1 Admin Master
- Criado via **seed** a partir de variáveis de ambiente (`MASTER_EMAIL`, `MASTER_PASSWORD`). Não existe tela pública de cadastro de master.
- Área própria (`/admin`): lista de condomínios com busca, número de casas, síndico atual, total de moradores ativos e pendências.

### 5.2 Cadastro de condomínio (Master)
- Campos: nome, endereço, cidade/UF, CNPJ (opcional), ativo/inativo.
- Ao criar, o master informa as casas: geração rápida por quantidade (ex.: "18 casas" → Casa 01 a Casa 18) e possibilidade de editar o identificador de cada uma (ex.: "Casa 7A").
- O master cadastra o **síndico**: nome e e-mail. O sistema cria a conta (ou vincula, se o e-mail já existir) e envia um e-mail com o link para definir a senha (token de uso único com expiração). Em desenvolvimento, o link aparece no console e na tela do master.
- O master cadastra os **espaços** do condomínio (ver seção 6.2).

### 5.3 Convite e cadastro de moradores
- O síndico (ou o master) gera um **link de convite do condomínio** (token aleatório, longo, revogável, com validade opcional). O link pode ser copiado e compartilhado (WhatsApp etc.).
- Quem abre o link vê o nome do condomínio e um formulário: nome completo, e-mail, telefone, senha e **seleção da casa** (lista das casas do condomínio).
- O cadastro fica com status **PENDENTE** até o síndico aprovar. Enquanto pendente, o usuário consegue entrar, mas vê apenas uma tela "Aguardando aprovação do síndico".
- Se o usuário já tem conta (mesmo e-mail), o link apenas cria uma nova solicitação de vínculo com aquele condomínio. **Um usuário pode pertencer a mais de um condomínio** e, nesse caso, escolhe o condomínio ativo após o login.
- O síndico vê a fila de **pendências** (com contador no menu) e aprova ou recusa; ao recusar, pode informar um motivo. O solicitante é avisado por e-mail, se configurado.
- Uma casa pode ter **vários moradores ativos** (família). O cadastro informa se o morador é o **titular** da casa ou **co-morador**.

### 5.4 Transferência de casa
- Quando alguém se cadastra em uma casa que **já tem morador titular ativo**, o formulário pergunta: "Você vai morar junto com o titular atual?" ou "Esta casa mudou de morador (venda ou locação)?".
- A segunda opção gera uma **solicitação de transferência**, que também precisa de aprovação do síndico.
- Ao aprovar a transferência: o novo cadastro vira titular ativo da casa e os vínculos anteriores daquela casa são **desativados** (não excluídos). O histórico permanece consultável pelo síndico e pelo master.
- As reservas futuras criadas pelos moradores desativados ficam listadas para o síndico decidir se mantém ou exclui.
- Um morador ativo também pode pedir para **mudar de casa** dentro do mesmo condomínio, o que segue o mesmo fluxo de aprovação.

### 5.5 Login e conta
- Login por e-mail e senha, "esqueci minha senha" (token por e-mail com expiração), troca de senha no perfil e logout.
- Proteja o login com rate limiting.
- Tela de perfil: nome, telefone, casa vinculada (somente leitura) e status do cadastro.

---

## 6. Módulos

### 6.1 Comunicação (comunicados)
- O síndico cria comunicados com título, texto (markdown simples ou rich text básico), categoria opcional (Geral, Manutenção, Assembleia, Segurança, Eventos) e anexos opcionais (PDF/imagem). Pode marcar como **importante** e **fixar no topo**.
- Os moradores veem a lista em ordem cronológica, com os fixados primeiro, e um indicador de **não lido**. Registre a leitura por usuário e mostre ao síndico quantas casas leram cada comunicado.
- Busca por texto e filtro por categoria.

### 6.2 Reserva de espaços
- **Espaços** (cadastrados apenas pelo master, por condomínio): nome (ex.: "Salão de festas"), capacidade, regras de uso (texto, exibido ao reservar), ativo/inativo e **modo de reserva**: "dia inteiro" (padrão) ou períodos nomeados (ex.: Manhã/Tarde/Noite). Opcionais: antecedência mínima e máxima em dias, limite de reservas por casa por mês e dias bloqueados.
- **Reservar é simples, sem descrição:** o morador escolhe o espaço → o dia no calendário → o período (se houver) → confirma. Não pedir motivo, título, convidados nem observações. A reserva fica **confirmada na hora**, sem fluxo de aprovação.
- A reserva registra: espaço, data, período, casa, usuário que criou e data de criação.
- **Calendário mensal** por espaço, visível a todos do condomínio, mostrando os dias ocupados e qual casa reservou. Lista "Minhas reservas" para o morador.
- **Síndico:** cria reservas em nome de **qualquer casa** (seleciona a casa) e exclui **qualquer** reserva.
- **Morador:** cria reservas apenas para a própria casa e exclui **apenas as reservas que ele mesmo criou** (as datas passadas não podem ser excluídas).
- **Conflito:** impossível haver duas reservas ativas para o mesmo espaço, data e período. Garanta isso no banco (índice único parcial em `espacoId + data + periodo` com `WHERE "excluidoEm" IS NULL`) e trate a corrida (erro de unicidade P2002) com uma mensagem amigável.
  - O Prisma **não** gera índice único parcial pelo schema: crie-o em SQL puro dentro da migration e documente isso em `docs/DECISOES.md`.
  - `periodo` deve ser **NOT NULL**: no modo "dia inteiro", grave um valor fixo (ex.: `DIA_INTEIRO`). Com `NULL`, o Postgres trata dois valores nulos como diferentes e o índice único deixaria passar reservas duplicadas.
  - O modo de reserva de um espaço não pode mudar enquanto houver reservas futuras ativas (evita misturar "dia inteiro" com períodos no mesmo dia).
- `data` é uma data sem horário (`@db.Date`). Todas as regras de "hoje", "datas passadas" e antecedência usam o fuso **America/Sao_Paulo**, independentemente do fuso do servidor (a VPS roda em UTC).
- Não é permitido reservar datas passadas. Valide no servidor as regras de antecedência e de limite mensal, se configuradas. O síndico pode ignorar essas regras.
- Excluir reserva = exclusão lógica (soft delete) com registro de quem excluiu, para auditoria.

### 6.3 Documentos
- O síndico envia arquivos (PDF, imagens, DOCX/XLSX) com título, categoria (Convenção, Regimento interno, Atas de assembleia, Prestação de contas, Contratos, Outros) e data de referência. Pode editar os metadados, substituir o arquivo e excluir.
- Os moradores listam, filtram por categoria, buscam por título, visualizam (PDF/imagem inline) e baixam.
- Limite de tamanho por arquivo configurável (padrão 20 MB). Valide o tipo MIME no servidor.

### 6.4 Prestação de contas (despesas)
- O síndico lança **despesas**: data, categoria (Água, Energia, Limpeza, Jardinagem, Manutenção, Segurança, Administração, Seguro, Obras, Material, Impostos/Taxas, Outros), descrição curta, valor em R$ e **comprovante opcional** (anexo). Pode editar e excluir.
- Tela de prestação de contas (síndico e moradores):
  - seletor de mês/ano e de período (mês, trimestre, ano);
  - total do período, total por categoria (gráfico de barras ou pizza) e comparação com o período anterior;
  - lista de lançamentos com acesso ao comprovante.
- Exportação do período em **PDF e CSV** (útil para assembleias).
- Valores monetários em centavos (inteiro) no banco, formatados em BRL na interface.

---

## 7. Auditoria

Registre um log de auditoria (quem, quando, ação, entidade, condomínio) para: aprovações e recusas de cadastro, transferências, troca de síndico, criação e exclusão de reservas, alterações em despesas e exclusão de documentos ou comunicados. O master e o síndico podem consultar o log do condomínio.

---

## 8. PWA (app web instalável)

- `manifest.webmanifest` com `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color` e ícones 192/512 (incluindo **maskable**). Gere os ícones a partir de um SVG simples.
- Meta tags para iOS: `apple-touch-icon`, `apple-mobile-web-app-capable` e `apple-mobile-web-app-status-bar-style`.
- Service worker:
  - cache do *app shell* e dos assets estáticos;
  - **página offline** amigável;
  - estratégia *network-first* para dados, com fallback para o último conteúdo visto de comunicados, documentos (metadados) e calendário de reservas;
  - **não** armazenar em cache respostas autenticadas sensíveis de outro usuário/tenant: limpe o cache no logout e na troca de condomínio.
  - O fallback offline só guarda as listas citadas acima (nunca arquivos de documentos, comprovantes, dados de moradores nem a fila de pendências), em um cache com nome que inclui o usuário e o condomínio ativo.
- O service worker só funciona em HTTPS. Em produção, o HTTPS vem do Caddy (seção 16); em desenvolvimento, `localhost` é suficiente.
- Botão/banner "Instalar app" quando o navegador oferecer (`beforeinstallprompt`) e instruções para iOS ("Compartilhar → Adicionar à Tela de Início").
- Layout mobile-first com navegação inferior (tab bar) no celular e menu lateral no desktop, áreas de toque ≥ 44px e suporte a `safe-area-inset`.
- Meta: aprovar nos critérios de instalabilidade do Lighthouse e ter boa nota de acessibilidade (≥ 90).
- **Opcional (última fase):** notificações push (Web Push com VAPID) para novo comunicado e para cadastro aprovado.

---

## 9. Interface (telas)

**Admin Master (`/admin`):** dashboard de condomínios → detalhe do condomínio (dados, casas e moradores por casa, síndico atual com botão "Trocar síndico", espaços, link de convite, log de auditoria).

**Síndico:** Início (pendências de aprovação, próximos eventos do calendário, últimos comunicados) · Comunicados · Reservas · Documentos · Prestação de contas · Moradores (casas, moradores ativos, pendências, transferências e link de convite) · Perfil.

**Morador:** Início · Comunicados · Reservas · Documentos · Prestação de contas · Perfil.

Diretrizes de UI: visual limpo e profissional, textos em pt-BR, datas no formato `dd/mm/aaaa`, moeda BRL, estados vazios explicativos, confirmação antes de excluir, toasts de sucesso e erro, *skeletons* de carregamento e tema claro (escuro opcional).

---

## 10. Modelo de dados (ponto de partida — ajuste se necessário)

- `User` (id, nome, email único, telefone, senhaHash, isMaster, createdAt)
- `Condominio` (id, nome, endereco, cidade, uf, cnpj?, ativo)
- `Unidade` (id, condominioId, identificador ex. "Casa 01", ativo) — único por (condominioId, identificador)
- `Vinculo` (id, userId, condominioId, unidadeId?, papel: SINDICO | MORADOR, tipo?: TITULAR | COMORADOR, status: PENDENTE | ATIVO | RECUSADO | INATIVO, ehTransferencia, aprovadoPorId?, aprovadoEm?, motivoRecusa?)
  - Um síndico que também mora no condomínio tem **dois vínculos**: um `SINDICO` (sem `unidadeId` e sem `tipo`) e um `MORADOR` (com `unidadeId` e `tipo`). Trocar o síndico inativa só o vínculo `SINDICO`.
  - Garanta no banco que exista no máximo **um vínculo SINDICO ativo por condomínio** (índice único parcial, também em SQL puro na migration).
- `Convite` (id, condominioId, token único, criadoPorId, expiraEm?, revogadoEm?)
- `Comunicado` (id, condominioId, titulo, conteudo, categoria, importante, fixado, autorId, timestamps) + `ComunicadoAnexo` + `ComunicadoLeitura` (comunicadoId, userId, lidoEm)
- `Espaco` (id, condominioId, nome, capacidade, regras, ativo, periodos[], antecedenciaMinDias?, antecedenciaMaxDias?, limiteMensalPorUnidade?)
- `Reserva` (id, condominioId, espacoId, unidadeId, data (`@db.Date`), periodo (NOT NULL, `DIA_INTEIRO` no modo dia inteiro), criadoPorId, createdAt, excluidoEm?, excluidoPorId?) — índice único parcial para reservas ativas
- `Documento` (id, condominioId, titulo, categoria, dataReferencia, arquivoKey, mime, tamanho, enviadoPorId, timestamps)
- `Despesa` (id, condominioId, data, categoria, descricao, valorCentavos, comprovanteKey?, lancadoPorId, timestamps)
- `AuditLog` (id, condominioId?, userId, acao, entidade, entidadeId, dados JSON, createdAt)
- Tokens: `PasswordResetToken`, `SetPasswordToken`

---

## 11. Segurança e LGPD

- Senhas com hash forte; nunca registrar senhas nem tokens em logs.
- Proteção CSRF (nativa do framework), cabeçalhos de segurança (CSP, HSTS em produção) e rate limiting em login, cadastro e convites.
- Upload: validar MIME e tamanho, gerar nomes aleatórios e nunca executar ou servir arquivos com o tipo informado pelo cliente.
- Coletar apenas os dados necessários (nome, e-mail, telefone, casa). Os moradores não veem o telefone e o e-mail de outros moradores. Os moradores inativos mantêm apenas o histórico necessário.
- Página simples de termos e privacidade (texto placeholder editável).

---

## 12. Seed de desenvolvimento

- 1 Admin Master (via `.env`).
- 1 condomínio "Residencial Exemplo" com **18 casas** (Casa 01 a Casa 18) e o espaço **"Salão de festas"** (dia inteiro, capacidade 60).
- 1 síndico, 5 moradores ativos em casas diferentes, 1 cadastro pendente e 1 transferência pendente.
- Alguns comunicados, documentos de exemplo, despesas de 3 meses e reservas futuras.
- Um segundo condomínio pequeno, para testar o isolamento entre tenants.
- Mostre no README as credenciais de teste.

---

## 13. Fases de entrega

Trabalhe em fases. Ao fim de cada fase: rode lint, typecheck e testes, faça um commit e me mostre um resumo do que foi feito e de como testar. A pasta ainda não é um repositório git: rode `git init` no início da Fase 1 e crie um `.gitignore` que exclua `.env`, `node_modules`, `.next` e os dados locais de Postgres e MinIO.

1. **Fundação:** projeto, docker-compose, Prisma schema e migrations, autenticação, sessão com tenant ativo, camada de permissões, layout responsivo e seed básico. Inclua já o `Dockerfile` e o `docker-compose.prod.yml` da seção 16 e faça um primeiro deploy na VPS (só login e layout), para descobrir cedo qualquer problema de ARM64, rede ou HTTPS.
2. **Admin Master:** CRUD de condomínios, casas, espaços e cadastro/troca de síndico com e-mail para definir senha.
3. **Convites e moradores:** link de convite, cadastro, fila de aprovação, transferência de casa e desativação.
4. **Reservas:** calendário, criação e exclusão com as regras da seção 6.2 e testes de conflito e permissão.
5. **Comunicados e Documentos:** storage abstrato, upload e download protegidos e leitura de comunicados.
6. **Prestação de contas:** lançamentos, resumo por período, gráficos e exportação PDF/CSV.
7. **PWA e acabamento:** manifest, service worker, página offline, instalação, auditoria, acessibilidade, backup do banco e README de deploy na VPS OCI.
8. *(Opcional)* Notificações push.

---

## 14. Critérios de aceite

- [ ] Somente o master cria condomínios, casas e espaços e define ou troca o síndico.
- [ ] O síndico não consegue alterar espaços nem promover usuários (testado no servidor, não só na UI).
- [ ] O morador se cadastra pelo link, fica pendente e só acessa o conteúdo após a aprovação do síndico.
- [ ] Uma transferência aprovada desativa os vínculos anteriores da casa e mantém o histórico.
- [ ] A reserva não tem campo de descrição: espaço + dia (+ período) + confirmar.
- [ ] O síndico cria reservas para qualquer casa e exclui qualquer reserva; o morador exclui apenas as que ele criou.
- [ ] Duas reservas simultâneas para o mesmo espaço, data e período: apenas uma é gravada.
- [ ] Os moradores consultam documentos e a prestação de contas, mas não editam.
- [ ] Testes provam que nenhum dado ou arquivo vaza entre condomínios.
- [ ] O app é instalável (Lighthouse), funciona bem em tela de 360px e tem página offline.
- [ ] O README explica como rodar localmente, as variáveis de ambiente e o deploy na VPS OCI (seção 16), incluindo atualização de versão e restauração de backup.
- [ ] O app responde em `https://condoplus.163-176-209-227.sslip.io` sem quebrar os outros serviços da VPS.

---

## 15. Como trabalhar comigo

- Antes de cada fase, apresente um plano curto e as dúvidas que bloqueiam. Para o resto, decida pelo mais simples e registre a decisão em `docs/DECISOES.md`.
- Não adicione funcionalidades fora do escopo da seção 1.
- Prefira código simples e legível a abstrações prematuras.

---

## 16. Ambiente de produção — VPS Oracle Cloud (OCI)

### 16.1 O que já existe na máquina (não quebrar)
- **Oracle Linux em ARM64 (aarch64)**, cerca de 10 GB de RAM, ~14 GB livres em disco e Docker com Compose. Usuário `opc`.
- **Portas já ocupadas no host:** `80` (financial-ledger prod), `443` (Caddy do devbox), `8080` e `8081` (financial-ledger dev/hml). **Não publique portas do condoplus no host.**
- **Caddy** em `/home/opc/devbox` (container `devbox-caddy-1`) faz o HTTPS de todos os apps por subdomínio de `DOMAIN=163-176-209-227.sslip.io`. O certificado sai por **TLS-ALPN na 443** (`disable_http_challenge`), porque a 80 pertence a outro app.
- Os apps roteados pelo Caddy entram na rede Docker externa **`devbox_default`** (exemplo existente: `estudos.{$DOMAIN}` → `estudos-web:8000`).
- O devbox (code-server) monta `/home/opc/projects` no **mesmo caminho** dentro e fora do container e tem acesso ao Docker do host, então `docker compose` rodado de dentro do devbox cria containers irmãos no host com bind mounts que funcionam.

### 16.2 Como o condoplus deve subir
- Pasta do projeto: `/home/opc/projects/condoplus`.
- URL pública: **`https://condoplus.163-176-209-227.sslip.io`**.
- `docker-compose.prod.yml` com o nome de projeto `condoplus` e os serviços:
  - `app`: imagem construída na própria VPS (`linux/arm64`), Next.js standalone na porta interna `3000`, **sem `ports:`**. Ligado à rede interna do projeto e à rede externa `devbox_default`, com o alias `condoplus-app`. Na inicialização, roda `prisma migrate deploy` antes do `node server.js`. `restart: unless-stopped`.
  - `db`: `postgres:17-alpine` (tem imagem arm64), volume nomeado, **só na rede interna**.
  - `minio`: `minio/minio` com volume nomeado, só na rede interna. O app cria o bucket na inicialização, se ele não existir. Os arquivos são servidos pela rota autenticada do app (seção 3), então o MinIO nunca precisa ficar exposto.
  - Healthchecks em `db` e `minio`, com `depends_on: condition: service_healthy` no `app`.
  - Limite de memória razoável para cada serviço (ex.: app 1 GB, db 512 MB, minio 512 MB), porque a máquina é compartilhada.
- Bloco a acrescentar no `/home/opc/devbox/Caddyfile`, seguindo o padrão dos blocos existentes:

  ```caddy
  # condoplus: gestão de condomínios (PWA)
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

  Antes de editar, faça um backup (`cp Caddyfile Caddyfile.bak-$(date +%Y%m%d-%H%M%S)`). Depois, valide e recarregue sem derrubar os outros sites: `docker exec devbox-caddy-1 caddy validate --config /etc/caddy/Caddyfile` e `docker exec devbox-caddy-1 caddy reload --config /etc/caddy/Caddyfile`. **Me peça confirmação antes de mexer no Caddyfile**, porque ele atende outros serviços.
- Como o Caddy fica na frente: configure `trust proxy`/cabeçalhos `X-Forwarded-*` para o rate limiting enxergar o IP real, defina a URL base (`BETTER_AUTH_URL`/`APP_URL`) com o domínio acima e use cookies `Secure`.
- `.env` de produção fora do git, com permissão `600`, e `.env.example` documentado com todas as variáveis (banco, MinIO/S3, SMTP/Resend, URL base, segredo de sessão, `MASTER_EMAIL`, `MASTER_PASSWORD`, limite de upload).
- Cabeçalho de tamanho de upload: o Caddy não limita o corpo por padrão; o limite de 20 MB é validado no app (e configurado em `serverActions.bodySizeLimit`, se o upload usar server actions).

### 16.3 Desenvolvimento na própria VPS
- O `docker-compose.yml` de desenvolvimento sobe Postgres e MinIO com o nome de projeto `condoplus-dev`, **sem publicar portas no host** (ou apenas em `127.0.0.1` e em portas livres, ex.: `127.0.0.1:55432`), para não colidir com nada.
- O `next dev` pode ser acessado pelo proxy do code-server (`https://163-176-209-227.sslip.io/proxy/3000/`) ou por túnel SSH (`ssh -L 3000:localhost:3000 oracle-vps`). Documente no README a forma que funcionar.
- Playwright em ARM64: use os navegadores que o Playwright suporta em `linux/arm64` (Chromium) ou a imagem oficial `mcr.microsoft.com/playwright`.

### 16.4 Operação
- Script `scripts/deploy.sh`: `git pull` (quando houver remoto), `docker compose -f docker-compose.prod.yml up -d --build` e verificação de saúde em `/api/health`.
- Backup diário: `pg_dump` do banco e cópia dos dados do MinIO para `/home/opc/backups/condoplus/`, com retenção de 7 dias, via cron do usuário `opc`. Documente a restauração no README.
- Logs: `docker compose logs` com rotação (`logging: driver: json-file, max-size: 10m, max-file: 3`), porque o disco é pequeno.
- Limpe as imagens antigas após o build (`docker image prune -f`) para não encher os ~14 GB livres.
