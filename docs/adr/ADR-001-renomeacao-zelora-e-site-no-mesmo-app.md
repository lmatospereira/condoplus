# ADR-001 — Renomeação para Zelora e site público no mesmo app

## Status
Accepted

## Contexto
O produto nasceu como "condoplus", nome que já existe no mercado. O usuário escolheu **Zelora** e pediu um site público com botões de acesso (síndico e morador) e o acesso do master escondido. A especificação da marca está em `docs/ZELORA-SDD.md`. A SPEC 004 pede para não presumir que site e app compartilham o mesmo backend e para que a URL de acesso ao app seja configurável.

## Decisão
- Renomear tudo: textos de interface, repositório (`lmatospereira/zelora`), imagem (`ghcr.io/lmatospereira/zelora`), projeto Docker e banco (`zelora`), pasta na VPS (`~/zelora`) e domínio (`zelora.163-176-209-227.sslip.io`). O domínio antigo passa a redirecionar (301) para o novo.
- A página pública fica **no mesmo app Next.js**, na rota `/`. O app autenticado passa a começar em `/inicio`. Não há duplicação de autenticação nem de regras de negócio (APP-005).
- A página atual é uma **entrada mínima** (proposta de valor, módulos com o estágio real e botões de acesso). O site institucional completo (SPEC 003: 11 páginas, contato, demonstração, planos e FAQ) segue o fluxo da especificação, que exige aprovação antes de implementar.

## Alternativas
- Site num projeto separado (estático): permite evoluir sem tocar no app, mas cria um segundo deploy e um segundo pipeline sem necessidade nesta fase. Pode ser revisto quando o site institucional crescer (APP-006).
- Manter o app em `/` e o site num subdomínio: mais complexo no Caddy e no certificado, sem ganho real agora.

## Consequências
- Positivas: um único deploy, um único design system e nenhuma lógica duplicada.
- Negativas: o site e o app compartilham ciclo de release. Usuários com o atalho antigo (`condoplus…`) passam pelo redirecionamento e precisam entrar de novo, porque os cookies são por domínio.

## Data
2026-11-15
