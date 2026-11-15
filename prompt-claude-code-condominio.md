# Prompt para o Claude Code — Sistema de Gestão de Condomínios (multi-tenant, PWA)

> Como usar: crie uma pasta vazia para o projeto, salve este arquivo nela como `ESPECIFICACAO.md`, abra o terminal na pasta, rode `claude` e envie:
> **"Leia o ESPECIFICACAO.md e implemente o sistema seguindo as fases descritas. Antes de começar, me apresente o plano da Fase 1."**

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
- **Autenticação:** Auth.js (NextAuth) ou Better Auth, com login por **e-mail e senha** (hash com bcrypt ou argon2) e sessão segura em cookie httpOnly
- **UI:** Tailwind CSS + shadcn/ui, com ícones lucide
- **Validação:** Zod, compartilhada entre formulários e server actions/rotas
- **Arquivos (documentos):** uma camada de storage abstrata, com disco local em desenvolvimento e S3 compatível em produção (AWS S3, Cloudflare R2 ou MinIO)
- **E-mail** (recuperação de senha e avisos opcionais): uma camada abstrata com provedor configurável por variável de ambiente (SMTP ou Resend). Em desenvolvimento, registre os e-mails no console.
- **PWA:** Web App Manifest + service worker (Serwist ou equivalente compatível com o App Router)
- **Testes:** Vitest para regras de negócio e permissões, Playwright para os fluxos principais
- **Infra local:** `docker-compose.yml` com Postgres (e MinIO, se usar S3 local), `.env.example` documentado e script de seed

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
- **Conflito:** impossível haver duas reservas ativas para o mesmo espaço, data e período. Garanta isso no banco (índice único parcial em `espacoId + data + periodo` para reservas ativas) e trate a corrida com uma mensagem amigável.
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
- `Vinculo` (id, userId, condominioId, unidadeId?, papel: SINDICO | MORADOR, tipo: TITULAR | COMORADOR, status: PENDENTE | ATIVO | RECUSADO | INATIVO, ehTransferencia, aprovadoPorId?, aprovadoEm?, motivoRecusa?)
- `Convite` (id, condominioId, token único, criadoPorId, expiraEm?, revogadoEm?)
- `Comunicado` (id, condominioId, titulo, conteudo, categoria, importante, fixado, autorId, timestamps) + `ComunicadoAnexo` + `ComunicadoLeitura` (comunicadoId, userId, lidoEm)
- `Espaco` (id, condominioId, nome, capacidade, regras, ativo, periodos[], antecedenciaMinDias?, antecedenciaMaxDias?, limiteMensalPorUnidade?)
- `Reserva` (id, condominioId, espacoId, unidadeId, data, periodo, criadoPorId, createdAt, excluidoEm?, excluidoPorId?) — índice único parcial para reservas ativas
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

Trabalhe em fases. Ao fim de cada fase: rode lint, typecheck e testes, faça um commit e me mostre um resumo do que foi feito e de como testar.

1. **Fundação:** projeto, docker-compose, Prisma schema e migrations, autenticação, sessão com tenant ativo, camada de permissões, layout responsivo e seed básico.
2. **Admin Master:** CRUD de condomínios, casas, espaços e cadastro/troca de síndico com e-mail para definir senha.
3. **Convites e moradores:** link de convite, cadastro, fila de aprovação, transferência de casa e desativação.
4. **Reservas:** calendário, criação e exclusão com as regras da seção 6.2 e testes de conflito e permissão.
5. **Comunicados e Documentos:** storage abstrato, upload e download protegidos e leitura de comunicados.
6. **Prestação de contas:** lançamentos, resumo por período, gráficos e exportação PDF/CSV.
7. **PWA e acabamento:** manifest, service worker, página offline, instalação, auditoria, acessibilidade e README de deploy.
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
- [ ] O README explica como rodar localmente, as variáveis de ambiente e o deploy (ex.: Vercel/Render + Postgres gerenciado + S3/R2).

---

## 15. Como trabalhar comigo

- Antes de cada fase, apresente um plano curto e as dúvidas que bloqueiam. Para o resto, decida pelo mais simples e registre a decisão em `docs/DECISOES.md`.
- Não adicione funcionalidades fora do escopo da seção 1.
- Prefira código simples e legível a abstrações prematuras.
