# Tasks — Site institucional (SPEC 003)

Status: **aguardando aprovação da spec e das pendências de conteúdo (spec.md §10)**

## Preparação
- [x] TASK-001 Inspecionar estrutura existente (Next.js 16, route groups, design system em `globals.css`)
- [x] TASK-002 Validar dependências (nenhuma nova necessária)
- [ ] TASK-003 Confirmar especificação e conteúdo (planos, contato, administradoras, sobre, marca)

## Implementação
- [ ] TASK-004 Route group `(site)` com `SiteHeader` e `SiteFooter`; mover a home atual para ele (deps: 003) — critério: `/` igual ao atual, com a nova navegação
- [ ] TASK-005 Conteúdo tipado em `src/content/site/` (planos, FAQ, públicos, mapa de estágio dos módulos) — critério: tipos validados, nenhum texto fixo nas páginas
- [ ] TASK-006 Páginas `/plataforma`, `/funcionalidades`, `/para-sindicos`, `/para-administradoras`, `/para-moradores`, `/planos`, `/sobre` (deps: 004, 005)
- [ ] TASK-007 `/politica-de-privacidade` e `/termos-de-uso`; `/termos` redireciona (301)
- [ ] TASK-008 Tabela `SolicitacaoContato` + migration + `enviarSolicitacaoAction` (Zod, honeypot, rate limit)
- [ ] TASK-009 `/contato` com os formulários de contato e de demonstração (deps: 008)
- [ ] TASK-010 `/admin/solicitacoes` (deps: 008)
- [ ] TASK-011 Capturas reais do app a partir do seed de demonstração (Playwright, mobile) para WEB-004
- [ ] TASK-012 SEO: metadata por página, Open Graph, `sitemap.ts`, ajuste do `robots.txt`

## Validação
- [ ] TASK-013 Testes unitários (schemas, conteúdo e mapa de estágio coerente com as rotas existentes)
- [ ] TASK-014 Testes de integração (gravar a solicitação, rate limit, honeypot)
- [ ] TASK-015 E2E: navegação por todas as páginas, envio de demonstração e falha preservando os dados
- [ ] TASK-016 Responsividade (360, 768 e 1280px) e acessibilidade (Lighthouse ≥ 90, axe)
- [ ] TASK-017 Verificar que não há referência a `/acesso/` em HTML, sitemap e robots

## Finalização
- [ ] TASK-018 Atualizar README, DECISOES e ADR (se houver)
- [ ] TASK-019 Evidências: prints e resultado dos testes
