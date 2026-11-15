# SPEC 003 — Site institucional · design.md

Status: **Rascunho — aguardando aprovação**

## Decisões arquiteturais
- O site fica no **mesmo app Next.js**, num route group `src/app/(site)/` com layout próprio (cabeçalho e rodapé do site), separado do `(app)`. Isso evita um segundo deploy e lógica duplicada (ADR-001). Se o site crescer, pode ser extraído para outro projeto (APP-006).
- Páginas **estáticas** (SSG). Só os formulários são dinâmicos, via server actions.
- O conteúdo editável (planos, FAQ, textos por público) fica em `src/content/site/*.ts`, tipado, sem CMS (P3 e sem dependências novas).
- Solicitações: tabela nova `SolicitacaoContato` (id, tipo CONTATO|DEMO, nome, email, telefone, perfil, condominio?, casas?, mensagem?, ip hash, createdAt, lidoEm?). Sem `condominioId` (dado global da plataforma), visível só para o master.

## Fluxos de navegação
`/` → (Acesso do síndico/morador → `/login`) · (Solicitar demonstração → formulário em `/contato?tipo=demo`) · (Ver planos → `/planos`)
Cabeçalho: Plataforma · Funcionalidades · Para quem (síndicos, administradoras, moradores) · Planos · Contato · **Entrar**.
Rodapé: Sobre · Política de privacidade · Termos de uso · Contato.

## Estrutura de interface e componentes
Reaproveitam o design system atual (tokens no `globals.css`, `Button`, `Card`, `Field`, `Input`, `Select`, `Textarea`, `ActionForm`, `SubmitButton`):
- `SiteHeader` (menu móvel acessível), `SiteFooter`
- `Hero`, `SecaoModulos` (lê o mapa de estágio real), `CardPublico`, `TabelaPlanos`, `Faq` (`<details>` nativo)
- `FormContato` / `FormDemo` (honeypot, ActionForm, preserva os dados em caso de erro)
- `CapturaApp` (imagem real otimizada com `next/image`)

## Contratos
- `enviarSolicitacaoAction(prev, FormData) → ResultadoAcao` (Zod; rate limit `app:contato:<ip>` 5/10min)
- `/admin/solicitacoes`: listagem paginada e "marcar como lida" (só para o master)

## Segurança
Honeypot + rate limit + validação no servidor · IP guardado só como hash · nenhuma referência a `/acesso/` · CSP atual mantida.

## Responsividade
Mobile-first a partir de 360px. Menu hamburguer abaixo de 768px. Grids de 1, 2 e 3 colunas. Áreas de toque ≥ 44px.
