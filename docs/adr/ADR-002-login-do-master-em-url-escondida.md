# ADR-002 — Login do Admin Master em URL escondida

## Status
Accepted

## Contexto
O usuário pediu que o acesso do master não apareça no site e fique numa URL própria.

## Decisão
- O master entra **somente** por `/acesso/<MASTER_LOGIN_PATH>` (variável de ambiente, valor aleatório em produção). Com a chave errada a rota responde 404, como se não existisse. A página não é indexada e não aparece no `robots.txt`.
- O `/login` comum **recusa contas master**, e a URL escondida **recusa contas que não são master**. Nos dois casos a mensagem é a mesma genérica ("E-mail ou senha incorretos."), para não revelar quais e-mails são de master.
- A comparação da chave usa `timingSafeEqual` num módulo só de servidor (`src/lib/master-login.ts`), que não é exposto como server action.
- Sem `MASTER_LOGIN_PATH`, o login de master fica desligado.

## Alternativas
- Só esconder o link (o master continuaria entrando pelo `/login`): segurança por obscuridade, sem efeito real.
- Allowlist de IP para o master: frágil com IP dinâmico.

## Consequências
- A URL escondida é um segredo operacional: deve ficar guardada (está no `.env` da VPS). Se vazar, basta trocar a variável e reiniciar o app.
- A proteção real continua sendo a senha mais o rate limit. A URL escondida reduz a superfície exposta.

## Data
2026-11-15
