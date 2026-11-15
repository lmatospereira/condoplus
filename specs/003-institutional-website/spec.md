# SPEC 003 — Site institucional · spec.md

Status: **Rascunho — aguardando aprovação** · Base: `docs/ZELORA-SDD.md` §6 · Data: 2026-11-15

## 1. Contexto
A Zelora já tem um app em produção (Next.js, mesmo repositório) com comunicados, reservas, gestão de moradores e área do Admin Master. Hoje `/` é uma **página de entrada mínima** (proposta de valor, módulos com estágio real e botões "Acesso do síndico" e "Acesso do morador"). O login do master fica em URL escondida (ADR-002).

## 2. Objetivo
Apresentar a plataforma e converter visitantes (síndicos, administradoras) em contatos comerciais, sem alterar o app (P9).

## 3. Escopo
**Dentro:** as 11 páginas obrigatórias, os formulários de contato e de demonstração com registro real das solicitações, FAQ, SEO, acessibilidade e responsividade.
**Fora:** pagamento ou assinatura online, blog, chat ao vivo, área logada nova e qualquer mudança nas regras do app.

## 4. Atores
Visitante · Potencial cliente (síndico ou administradora) · Síndico já cliente · Morador · Admin Master (lê as solicitações recebidas).

## 5. Requisitos funcionais
| ID | Requisito |
|---|---|
| WEB-001 | `/` apresenta a proposta de valor, os botões de acesso (síndico e morador) e os CTAs "Solicitar demonstração" e "Ver planos". |
| WEB-002 | `/plataforma` e `/funcionalidades` apresentam os módulos, cada um marcado como **Disponível** ou **Em breve**, conforme o código real (APP-003). |
| WEB-003 | `/para-sindicos`, `/para-administradoras` e `/para-moradores` mostram os benefícios por público. Os recursos voltados a administradoras que ainda não existem aparecem como **planejados**. |
| WEB-004 | A experiência mobile é mostrada com **capturas reais do app** (seed de demonstração), sem mockups inventados. |
| WEB-005 | `/planos` lista modalidades **configuráveis**, num arquivo de conteúdo versionado, sem preço fixo no código. |
| WEB-006 | `/contato`: formulário com nome, e-mail, telefone, perfil (síndico, administradora, morador, outro), mensagem e aceite de privacidade. |
| WEB-007 | Formulário "Solicitar demonstração": nome, e-mail, telefone, condomínio, nº de casas e perfil. |
| WEB-008 | FAQ (em `/` e `/planos`) com perguntas e respostas num arquivo de conteúdo. |
| WEB-009 | O botão "Entrar" leva ao app. A URL do app é configurável (`APP_URL`, APP-004). |
| WEB-010 | Todas as páginas funcionam bem a partir de 360px. |
| WEB-011 | Cada página tem `title`, `description`, Open Graph, `sitemap.xml` e HTML semântico (um `h1` por página). |
| WEB-012 | `/politica-de-privacidade` e `/termos-de-uso` (hoje `/termos`, que passa a redirecionar). |
| WEB-013 | As solicitações de contato e demonstração ficam gravadas no banco e aparecem para o Admin Master em `/admin/solicitacoes` (sem e-mail por enquanto). |

## 6. Requisitos não funcionais
- Lighthouse ≥ 90 em Performance, Acessibilidade, Boas práticas e SEO nas páginas públicas.
- Nenhuma dependência nova sem justificativa. Animações discretas, respeitando `prefers-reduced-motion`.
- Formulários com rate limit por IP, validação no servidor (Zod) e campo anti-spam invisível (honeypot).
- Os dados pessoais dos formulários são usados só para o contato comercial, e a política de privacidade explica isso.

## 7. Regras de negócio
- RN-01: a confirmação de envio aparece **somente** depois de a solicitação ser gravada. Se falhar, o formulário mantém os dados e mostra o erro.
- RN-02: o site nunca afirma que uma funcionalidade existe se ela não está implementada.
- RN-03: o acesso do master não aparece em nenhuma página, link, sitemap ou robots.

## 8. Critérios de aceitação (exemplos)
**Cenário: solicitação de demonstração**
Dado que um visitante abriu `/`, quando preencher o formulário de demonstração com dados válidos e enviar, então os campos são validados no servidor, a solicitação é gravada, aparece a confirmação, e o Admin Master a vê em `/admin/solicitacoes`.
**Cenário: falha no envio**
Dado que o banco está indisponível, quando o visitante enviar, então aparece uma mensagem de erro e os dados digitados continuam no formulário.
**Cenário: estágio real**
Dado que o módulo Documentos não está implementado, quando o visitante abrir `/funcionalidades`, então Documentos aparece como "Em breve".
**Cenário: master escondido**
Dado qualquer página pública, quando o HTML, o sitemap e o robots forem inspecionados, então não existe referência a `/acesso/`.

## 9. Cenários de exceção
Envio duplicado (duplo clique) · rate limit atingido · JavaScript desligado (os formulários funcionam por server action com POST) · URL de app não configurada.

## 10. Dependências e pendências de conteúdo (bloqueiam a aprovação)
1. **Planos:** quais modalidades, preços (ou "sob consulta") e limites (por nº de casas?).
2. **Contato:** além de gravar no banco, mostrar WhatsApp ou e-mail comercial? Quais?
3. **Administradoras:** o app hoje não tem recursos específicos para elas. Mostramos a página como "planejado" ou adiamos a página?
4. **Sobre:** quem está por trás da Zelora (texto, cidade, CNPJ, se houver).
5. **Marca:** aprovar o logo proposto (SPEC 001) e os tokens (SPEC 002), e definir a tipografia (hoje Inter).
