# ZELORA — SPECIFICATION DRIVEN DEVELOPMENT

**Produto:** Zelora  
**Categoria:** SaaS de Gestão Condominial  
**Slogan:** Gestão que cuida de cada detalhe.  
**Metodologia:** Specification-Driven Development (SDD)  
**Versão:** 1.0

---

# 1. PRODUCT CONSTITUTION

Arquivo: `.specify/memory/constitution.md`

## 1.1. Visão do produto

A Zelora é um ecossistema digital de gestão condominial que conecta administradoras, síndicos, moradores e funcionários.

O produto deve oferecer uma experiência unificada para administração, comunicação, controle financeiro e operação condominial.

## 1.2. Princípios fundamentais

### P1 — Specification First
Nenhuma funcionalidade deve ser desenvolvida sem especificação funcional e técnica.

### P2 — Design System First
Toda interface deverá utilizar o Design System oficial da Zelora.

Não criar estilos isolados ou componentes visuais sem necessidade justificada.

### P3 — Reusabilidade
Priorizar componentes, serviços, padrões e estruturas reutilizáveis.

### P4 — Segurança
A arquitetura deverá considerar autenticação, autorização, isolamento de dados, auditoria e proteção de informações.

### P5 — Multi-Tenancy
A plataforma deverá ser preparada para atender múltiplos clientes e condomínios.

Um usuário poderá possuir diferentes vínculos e permissões, conforme seu contexto de acesso.

### P6 — Mobile First
A experiência deverá funcionar adequadamente em smartphones, tablets e desktops.

### P7 — Evolução incremental
O desenvolvimento deverá ocorrer por funcionalidades independentes, com validação progressiva.

### P8 — Não presumir funcionalidades
A IA não poderá considerar uma funcionalidade existente sem verificar sua implementação.

### P9 — Preservar o aplicativo existente
O desenvolvimento do site não deverá sobrescrever, duplicar ou alterar funcionalidades do aplicativo sem autorização.

### P10 — Rastreabilidade
Todo requisito deverá possuir identificador e critérios de aceitação verificáveis.

---

# 2. REGRAS DE DESENVOLVIMENTO

Arquivo: `AGENTS.md`

Você atuará como engenheiro de software responsável pelo desenvolvimento da plataforma Zelora.

Antes de qualquer implementação:

1. Leia a Constituição do produto.
2. Analise as especificações existentes.
3. Inspecione o código-fonte.
4. Identifique tecnologias e dependências.
5. Identifique funcionalidades existentes.
6. Identifique possíveis conflitos arquiteturais.
7. Apresente um plano de execução.

## Regras obrigatórias

- Não modificar funcionalidades existentes sem necessidade.
- Não duplicar componentes.
- Não instalar dependências sem justificativa.
- Não implementar funcionalidades fora do escopo aprovado.
- Não utilizar dados fictícios em integrações reais.
- Não criar botões sem comportamento.
- Não ignorar estados de erro e carregamento.
- Não utilizar CSS improvisado quando existir token correspondente.
- Não misturar regras de negócio com apresentação.
- Não considerar testes inexistentes como aprovados.

## Fluxo de desenvolvimento

SPECIFICATION → REVIEW → APPROVAL → DESIGN → TASKS → IMPLEMENTATION → TESTS → VALIDATION

A implementação somente poderá começar após a especificação estar completa e aprovada.

---

# 3. PADRÃO DAS ESPECIFICAÇÕES

Cada funcionalidade deverá possuir três documentos.

## 3.1. spec.md

Contém:

- Contexto.
- Objetivo.
- Escopo.
- Atores.
- Requisitos funcionais.
- Requisitos não funcionais.
- Regras de negócio.
- Critérios de aceitação.
- Cenários de exceção.
- Dependências.

## 3.2. design.md

Contém:

- Decisões arquiteturais.
- Fluxos de navegação.
- Estrutura de interface.
- Componentes.
- Integrações.
- Contratos.
- Segurança.
- Responsividade.

## 3.3. tasks.md

Contém tarefas pequenas e verificáveis.

Cada tarefa deverá possuir:
- Identificador.
- Descrição.
- Dependências.
- Arquivos afetados, quando conhecidos.
- Critério de conclusão.
- Testes necessários.

---

# 4. SPEC 001 — BRAND IDENTITY

Diretório: `specs/001-brand-identity/`

## Objetivo

Definir a identidade oficial da Zelora.

## Requisitos funcionais

**BR-001:** O sistema deverá apresentar a marca Zelora de maneira consistente.

**BR-002:** A identidade deverá utilizar o slogan oficial.

**BR-003:** Deverá existir uma versão principal e uma versão reduzida da assinatura visual.

**BR-004:** A marca deverá funcionar em fundos claros e escuros.

**BR-005:** A identidade deverá ser compatível com site, painel web e aplicativo.

## Critérios de aceitação

- Logo principal documentado.
- Versões alternativas documentadas.
- Paleta de cores aprovada.
- Tipografia definida.
- Aplicações em diferentes dispositivos validadas.

---

# 5. SPEC 002 — DESIGN SYSTEM

Diretório: `specs/002-design-system/`

## Objetivo

Criar o Design System compartilhado do ecossistema Zelora.

## Requisitos funcionais

**DS-001:** Centralizar tokens de cores.

**DS-002:** Centralizar tokens tipográficos.

**DS-003:** Definir escala de espaçamento.

**DS-004:** Definir bordas, sombras e superfícies.

**DS-005:** Criar biblioteca de componentes reutilizáveis.

**DS-006:** Implementar estados dos componentes.

**DS-007:** Garantir responsividade.

**DS-008:** Documentar regras de utilização.

**DS-009:** Permitir evolução sem quebrar interfaces existentes.

## Tokens iniciais

```css
:root {
  --color-primary-900: #172C3C;
  --color-primary-800: #203D50;
  --color-primary-700: #2D5366;

  --color-accent-500: #62D5B0;
  --color-accent-600: #42B997;
  --color-accent-100: #E2F7EF;

  --color-neutral-950: #18232B;
  --color-neutral-700: #53616B;
  --color-neutral-500: #87949C;
  --color-neutral-300: #DCE3E7;
  --color-neutral-100: #F4F7F8;

  --color-white: #FFFFFF;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
}
```

Os tokens deverão ser revisados e aprovados antes da implementação definitiva.

## Critérios de aceitação

- Biblioteca de componentes funcional.
- Documentação dos tokens.
- Estados de interação implementados.
- Compatibilidade mobile e desktop.
- Testes visuais dos componentes.
- Ausência de estilos duplicados sem justificativa.

---

# 6. SPEC 003 — SITE INSTITUCIONAL

Diretório: `specs/003-institutional-website/`

## Objetivo

Construir o site institucional da Zelora, apresentando a plataforma e convertendo visitantes em potenciais clientes.

## Atores

- Visitante.
- Potencial cliente.
- Síndico.
- Administradora.
- Morador.

## Requisitos funcionais

**WEB-001 — Página inicial**

O sistema deverá apresentar a proposta de valor da Zelora.

**WEB-002 — Apresentação da plataforma**

O visitante deverá conhecer os principais módulos da plataforma.

**WEB-003 — Segmentação de público**

O site deverá apresentar os benefícios para síndicos, administradoras e moradores.

**WEB-004 — Demonstração do aplicativo**

O site deverá apresentar a experiência mobile.

**WEB-005 — Planos**

O site deverá apresentar modalidades comerciais configuráveis.

**WEB-006 — Contato**

O visitante deverá conseguir solicitar informações comerciais.

**WEB-007 — Demonstração**

O visitante deverá conseguir solicitar uma demonstração do produto.

**WEB-008 — FAQ**

O site deverá apresentar respostas para dúvidas frequentes.

**WEB-009 — Login**

O visitante deverá possuir acesso ao ambiente autenticado da plataforma.

**WEB-010 — Responsividade**

Todas as páginas deverão funcionar em dispositivos móveis e desktops.

**WEB-011 — SEO**

As páginas deverão possuir metadados e estrutura semântica.

**WEB-012 — Privacidade**

O site deverá disponibilizar política de privacidade e informações pertinentes ao tratamento de dados.

## Páginas obrigatórias

- `/`
- `/plataforma`
- `/funcionalidades`
- `/para-sindicos`
- `/para-administradoras`
- `/para-moradores`
- `/planos`
- `/sobre`
- `/contato`
- `/politica-de-privacidade`
- `/termos-de-uso`

## Requisitos de experiência

- Navegação intuitiva.
- Identidade visual consistente.
- Comunicação comercial objetiva.
- Interface responsiva.
- Animações discretas.
- Imagens e demonstrações próprias da plataforma.
- Componentes reutilizáveis.

## Critérios de aceitação

- Todas as páginas implementadas.
- Navegação funcional.
- Formulários validados.
- CTAs funcionais.
- Links externos verificados.
- SEO revisado.
- Testes responsivos aprovados.
- Acessibilidade revisada.

---

# 7. SPEC 004 — INTEGRAÇÃO COM O APLICATIVO

Diretório: `specs/004-app-integration/`

## Objetivo

Garantir consistência entre o site institucional e o aplicativo Zelora já existente.

## Requisitos funcionais

**APP-001:** O aplicativo deverá preservar sua identidade e funcionalidades existentes.

**APP-002:** O Design System deverá ser compartilhado conceitualmente.

**APP-003:** O site deverá apresentar funcionalidades reais ou planejadas, identificando corretamente seu estágio.

**APP-004:** O acesso ao aplicativo deverá utilizar URL configurável.

**APP-005:** Não deverá existir duplicação de autenticação ou regras de negócio.

**APP-006:** A arquitetura deverá permitir evolução independente do site e do aplicativo.

## Restrições

Antes de implementar integrações:

- Inspecionar a tecnologia do aplicativo.
- Inspecionar sua estrutura.
- Identificar APIs existentes.
- Identificar componentes reutilizáveis.
- Mapear diferenças entre tecnologias.
- Documentar contratos de integração.

Não presumir que site e aplicativo compartilham o mesmo backend.

---

# 8. PADRÃO DE CRITÉRIOS DE ACEITAÇÃO

Todos os requisitos deverão possuir cenários verificáveis.

Utilizar preferencialmente o padrão:

### Cenário: Solicitação de demonstração

**Dado** que um visitante acessou o site da Zelora.

**Quando** preencher os dados do formulário de demonstração.

**E** enviar a solicitação.

**Então** o sistema deverá validar os campos obrigatórios.

**E** apresentar uma confirmação de envio somente após o processamento bem-sucedido.

**E** preservar uma mensagem de erro caso a operação falhe.

Nenhum critério deverá depender apenas de avaliação subjetiva.

---

# 9. CONTROLE DE IMPLEMENTAÇÃO

Arquivo: `tasks.md`

Cada tarefa deverá seguir o padrão:

```markdown
# Tasks — [Nome da funcionalidade]

## Preparação
- [ ] TASK-001 Inspecionar estrutura existente
- [ ] TASK-002 Validar dependências
- [ ] TASK-003 Confirmar especificação

## Implementação
- [ ] TASK-004 Criar estrutura da funcionalidade
- [ ] TASK-005 Implementar componentes
- [ ] TASK-006 Implementar comportamento
- [ ] TASK-007 Aplicar Design System

## Validação
- [ ] TASK-008 Executar testes unitários
- [ ] TASK-009 Executar testes de integração
- [ ] TASK-010 Validar responsividade
- [ ] TASK-011 Validar acessibilidade
- [ ] TASK-012 Revisar critérios de aceitação

## Finalização
- [ ] TASK-013 Atualizar documentação
- [ ] TASK-014 Registrar decisões técnicas
- [ ] TASK-015 Apresentar evidências de conclusão
```

Uma tarefa somente poderá ser marcada como concluída quando seus critérios forem verificados.

---

# 10. PADRÃO DE DECISÕES ARQUITETURAIS

Decisões relevantes deverão ser documentadas em ADRs.

Diretório:

`docs/adr/`

Formato:

```markdown
# ADR-001 — [Título]

## Status
Proposed | Accepted | Rejected | Superseded

## Contexto
Qual problema precisa ser resolvido?

## Decisão
Qual solução foi escolhida?

## Alternativas
Quais alternativas foram avaliadas?

## Consequências
Quais impactos positivos e negativos?

## Data
YYYY-MM-DD
```

Não realizar alterações arquiteturais relevantes sem registrar a decisão.

---

# 11. WORKFLOW OBRIGATÓRIO DA IA

A IA deverá trabalhar nas seguintes etapas:

## Etapa 1 — Discovery

- Inspecionar o repositório.
- Ler documentos existentes.
- Identificar tecnologias.
- Mapear funcionalidades.
- Identificar lacunas.

Entrega: relatório de descoberta.

## Etapa 2 — Specification

- Elaborar requisitos.
- Identificar atores.
- Definir regras de negócio.
- Criar cenários.
- Definir critérios de aceitação.

Entrega: `spec.md`.

## Etapa 3 — Design

- Definir arquitetura.
- Elaborar fluxos.
- Definir interfaces.
- Identificar componentes.
- Documentar decisões técnicas.

Entrega: `design.md`.

## Etapa 4 — Planning

- Dividir funcionalidades.
- Identificar dependências.
- Criar tarefas.
- Estimar complexidade.

Entrega: `tasks.md`.

## Etapa 5 — Approval

Apresentar as especificações para revisão.

Não iniciar implementação sem aprovação explícita.

## Etapa 6 — Implementation

Executar as tarefas aprovadas.

Trabalhar em pequenos incrementos.

Não implementar funcionalidades fora do escopo.

## Etapa 7 — Verification

- Executar testes.
- Validar critérios.
- Verificar regressões.
- Validar responsividade.
- Verificar acessibilidade.
- Comparar implementação com especificação.

## Etapa 8 — Delivery

Apresentar:

- Funcionalidades entregues.
- Arquivos criados ou modificados.
- Testes executados.
- Resultado dos testes.
- Requisitos atendidos.
- Pendências.
- Limitações conhecidas.

---

# 12. REGRA DE OURO

A IA não deve interpretar a especificação como uma sugestão.

A especificação é o contrato do desenvolvimento.

Se houver conflito entre código existente e especificação:

1. Identificar o conflito.
2. Documentar o impacto.
3. Apresentar alternativas.
4. Solicitar aprovação quando houver alteração de escopo ou comportamento existente.

Não corrigir inconsistências importantes silenciosamente.

---

# 13. DEFINIÇÃO DE PRONTO — DEFINITION OF DONE

Uma funcionalidade somente será considerada pronta quando:

- Os requisitos estiverem implementados.
- Os critérios de aceitação estiverem atendidos.
- Os testes aplicáveis estiverem aprovados.
- Não houver regressões conhecidas não justificadas.
- A interface estiver alinhada ao Design System.
- A documentação estiver atualizada.
- As limitações estiverem registradas.
- O resultado tiver sido revisado.

**ZELORA — Gestão que cuida de cada detalhe.**