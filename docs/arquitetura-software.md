# Arquitetura de Software do NossoSaldo (v2.0.0)

## 1. Visao geral

### Resumo executivo da arquitetura (Versão 2.0.0)

O `NossoSaldo v2.0.0` é uma plataforma financeira moderna para controle pessoal e compartilhado entre casais. A versão 2.0.0 consolida um salto estrutural na experiência do usuário, no motor de Inteligência Artificial operacional e na gestão modular de contas conjuntas:

- `frontend (v2.0.0)`: Aplicação SPA em React 18, TypeScript, Tailwind CSS e Zustand, com suporte nativo a temas Claro/Escuro, filtros de casal em tempo real, cálculo dinâmico de limites de cartões e interface interativa do Copilot IA.
- `api (v2.0.0)`: API REST em Node.js/Express/TypeScript com arquitetura hexagonal e portas de saída (`ports/outbound`), persistência em PostgreSQL via Prisma, criptografia AES-256-GCM para chaves de IA, e integração operacional avançada com OpenAI Function Calling.

Principais inovações da v2.0.0:
1. **Copilot IA Operacional com Diálogo Contínuo:** Capacidade da IA de consultar e executar ações financeiras reais (criar/editar gastos, pagar faturas, gerenciar categorias) e manter conversação contínua com histórico persistente no banco (`IaConversa`).
2. **Conta Conjunta Inteligente:** Separação estrita de gastos privados (`naoCompartilhar: true`) e comuns (`naoCompartilhar: false`), cálculo automático de acertos de contas (PIX) com divisão proporcional (50/50) e filtro dinâmico de responsável nas buscas.
3. **Acompanhamento Dinâmico de Cartões e Faturas:** Limites disponíveis e faturas ativas recalculados em tempo real com base nos lançamentos do período.
4. **Design System Adaptativo 2.0:** Suporte unificado aos temas Claro e Escuro, alto contraste e identidade visual premium com logotipo oficial.

### Objetivo tecnico do sistema

O objetivo tecnico do sistema e oferecer uma base confiavel e segura para:

- autenticacao segura com JWT e isolamento estrito entre sessoes;
- cadastro e gestao de gastos individuais e compartilhados;
- controle de gastos recorrentes, unicos e parcelados;
- gestao de cartoes de credito, limites dinamicos e faturas;
- assistente financeiro IA com execucao de operacoes e auditoria de consultas;
- compartilhamento seletivo e acertos de contas entre parceiros de conta conjunta;
- geracao de relatorios e insights de gastos.

### Estilo arquitetural predominante

O estilo arquitetural predominante e:

- `monolito modular` no backend;
- `SPA` no frontend;
- `arquitetura em camadas` com elementos de `hexagonal / ports and adapters` no backend.

Diagnostico atual:

`uma arquitetura em camadas com forte inclinacao para hexagonal`.

### Estado operacional atual

O projeto e mantido em repositorios separados para frontend e API. A entrega atual segue este fluxo:

```text
Commit na master -> GitHub Actions (lint, testes e build) -> Vercel (frontend) / Render (API) -> Supabase PostgreSQL
```

O Render tambem concentra as integracoes de e-mail e da OpenAI. O CI valida o artefato; a publicacao efetiva e realizada pelos provedores de hospedagem configurados para a `master`.

## 2. Estrutura do sistema

### Principais diretorios, modulos e responsabilidades

#### Backend

- `api/src/app.ts`: bootstrap da aplicacao Express, middlewares globais, Swagger e prefixo da API.
- `api/src/config/apiVersion.ts`: definicao central do versionamento da API.
- `api/src/routers`: exposicao dos endpoints HTTP.
- `api/src/controllers`: traducao entre HTTP e casos de uso.
- `api/src/services`: regras de negocio e orquestracao dos fluxos.
- `api/src/ports/outbound`: contratos de dependencia externa.
- `api/src/repositories`: implementacoes concretas de persistencia.
- `api/src/lib`: infraestrutura compartilhada, como Prisma, logger e mailer.
- `api/src/secure`: autenticacao, autorizacao e assinatura de tokens.
- `api/src/schemas`: validacao de entrada.
- `api/prisma/schema.prisma`: modelagem de dados.
- `api/src/docs`: documentacao tecnica e OpenAPI.

#### Frontend

- `frontend/src/App.jsx`: componente principal da aplicacao, com estado, navegacao e composicao de telas.
- `frontend/src/services/api.js`: cliente HTTP central para consumo da API.
- `frontend/src/config/appMeta.js`: metadados da aplicacao, como nome e versao.
- `frontend/src/App.css`: estilo principal da interface.

### Separacao entre frontend, backend, dominio, infraestrutura e persistencia

- `frontend`: experiencia do usuario, estado de tela e integracao HTTP.
- `backend/presentacao`: routers, middlewares, controllers, schemas.
- `backend/aplicacao`: services.
- `backend/infraestrutura`: Prisma, logger, mailer, JWT, Swagger.
- `backend/persistencia`: repositories + PostgreSQL.

Observacao:

A camada de dominio ainda nao aparece como um pacote independente com entidades, agregados ou casos de uso formalizados fora dos services. Hoje ela esta embutida principalmente em `services`.

### Fluxo geral entre camadas

```text
Frontend -> API Client -> Router -> Middleware/Schema -> Controller -> Service -> Port -> Repository -> Prisma -> PostgreSQL
```

## 3. Componentes e responsabilidades

### Componentes principais

- `React/Vite Frontend`
- `Express API`
- `Servicos de negocio`
- `Repositorios Prisma`
- `PostgreSQL`
- `Mailer SMTP`
- `JWT RS256`
- `Swagger/OpenAPI`
- `Assistente financeiro com provedor OpenAI por usuario`

### Responsabilidade de cada componente

#### Frontend

- renderizar telas;
- controlar estado do usuario autenticado;
- montar formularios, filtros e dashboards;
- consumir a API REST versionada.

#### Routers

- publicar rotas HTTP;
- aplicar middlewares de autenticacao e validacao;
- encaminhar requisicoes para controllers.

#### Controllers

- traduzir requisicoes HTTP em chamadas para services;
- montar respostas com codigos HTTP e envelope padronizado.

#### Services

- aplicar regras de negocio;
- validar autorizacao funcional;
- orquestrar interacao entre repositorios e infraestrutura.

#### Ports

- definir contratos que abstraem detalhes de persistencia e integracoes externas.

#### Repositories

- executar comandos e consultas no banco;
- encapsular transacoes e detalhes do Prisma;
- mapear erros tecnicos para erros de repositorio.

#### Infraestrutura

- prover autenticacao, logging, e-mail, documentacao e acesso ao banco.

#### Assistente financeiro

- recebe consultas pela rota `/api/v1/ia/consultas`;
- consulta somente o contexto financeiro autorizado do usuario autenticado;
- usa a chave OpenAI configurada pelo proprio usuario;
- mantém a chave cifrada no backend e nao a expõe ao frontend;
- deve rejeitar perguntas fora do contexto financeiro do NossoSaldo.

Referencias:

- [api/src/services/ia/iaService.ts](C:/Projetos/NossoSaldo/api/src/services/ia/iaService.ts)
- [api/src/adapters/outbound/openai/openAiProvider.ts](C:/Projetos/NossoSaldo/api/src/adapters/outbound/openai/openAiProvider.ts)

### Relacoes entre eles

- frontend depende da API para persistencia e operacao;
- controllers dependem de services;
- services dependem de contratos e, na pratica atual, tambem de implementacoes concretas montadas no mesmo modulo;
- repositories dependem de Prisma;
- Prisma depende do PostgreSQL.

## 4. Arquitetura por camadas

### Camada de apresentacao

No backend:

- `routers`
- `controllers`
- `middlewares`
- `schemas`

No frontend:

- `App.jsx`
- componentes visuais embutidos no fluxo principal da SPA

### Camada de aplicacao

Concentrada em:

- `api/src/services`

Essa camada coordena os principais casos de uso, como:

- login;
- criacao e atualizacao de usuarios;
- criacao, pagamento, reabertura e exclusao de gastos;
- gerenciamento de faturas e cartoes;
- relatorios e insights.

### Camada de dominio

Atualmente nao existe uma camada de dominio formal separada. O dominio esta distribuido entre:

- `services`;
- `@types`;
- `schemas`;
- algumas convencoes presentes na modelagem de dados.

Isso significa que a regra de negocio existe, mas ainda nao esta encapsulada como um nucleo de dominio independente.

### Camada de infraestrutura

Representada por:

- `lib/prisma.ts`
- `lib/mailer.ts`
- `lib/logger.ts`
- `secure/autentication.ts`
- `secure/authorization.ts`
- `docs/openapi.ts`

### Camada de persistencia

Representada por:

- `repositories`
- `prisma/schema.prisma`
- `PostgreSQL`

### Como essas camadas interagem

- a camada de apresentacao recebe a requisicao;
- a camada de aplicacao interpreta a regra de negocio;
- a camada de persistencia materializa os dados;
- a infraestrutura oferece mecanismos tecnicos transversais.

## 5. Hexagonal / Ports and Adapters

### Portas de entrada e saida

#### Portas de saida identificadas

Presentes em:

- `api/src/ports/outbound/usuarioRepositoryPort.ts`
- `api/src/ports/outbound/gastoRepositoryPort.ts`
- `api/src/ports/outbound/relatorioRepositoryPort.ts`
- `api/src/ports/outbound/faturaCartaoRepositoryPort.ts`
- `api/src/ports/outbound/cartaoCreditoRepositoryPort.ts`
- `api/src/ports/outbound/categoriaRepositoryPort.ts`
- `api/src/ports/outbound/contaConjuntaRepositoryPort.ts`
- `api/src/ports/outbound/passwordResetTokenRepositoryPort.ts`
- `api/src/ports/outbound/emailVerificationTokenRepositoryPort.ts`
- `api/src/ports/outbound/insightsRepositoryPort.ts`

#### Portas de entrada

Nao existem portas de entrada formalizadas como interfaces de caso de uso. Na pratica, os `controllers` chamam os `services` diretamente.

### Adaptadores identificados

#### Adaptadores de entrada

- `routers`
- `controllers`
- `middlewares`
- `schemas`

#### Adaptadores de saida

- `repositories`
- `mailer`
- `authorization`
- `autentication`

### Protecao da regra de negocio contra infraestrutura

Parcialmente protegida.

Pontos positivos:

- os services nao dependem diretamente de Express;
- existe separacao de contratos outbound;
- repositories encapsulam Prisma.

Desvios:

- alguns services importam dependencias concretas diretamente e exportam singletons montados;
- nao existe composition root separado;
- a camada de dominio ainda nao e independente da camada de aplicacao.

### Aderencia e desvios

#### Aderencia

- uso de portas outbound;
- uso de adaptadores claros;
- separacao de responsabilidades HTTP x negocio x persistencia;
- testes de services com mocks.

#### Desvios

- composicao distribuida;
- ausencia de inbound ports;
- services muito orquestradores;
- frontend fora desse mesmo padrao arquitetural.

## 6. Fluxos principais

### 6.1 Autenticacao

Fluxo observado:

1. frontend envia credenciais para `POST /api/v1/login`;
2. controller aciona `usuarioService.login`;
3. service consulta repositorio de usuario;
4. senha e validada;
5. token JWT RS256 e gerado;
6. frontend armazena token e passa a usar `x-access-token`.

Arquivos principais:

- [frontend/src/services/api.js](C:/Projetos/NossoSaldo/frontend/src/services/api.js)
- [api/src/controllers/usuario/usuarioController.ts](C:/Projetos/NossoSaldo/api/src/controllers/usuario/usuarioController.ts)
- [api/src/services/usuario/usuarioService.ts](C:/Projetos/NossoSaldo/api/src/services/usuario/usuarioService.ts)
- [api/src/secure/authorization.ts](C:/Projetos/NossoSaldo/api/src/secure/authorization.ts)

### 6.2 Criacao e manutencao de gastos

Fluxo observado:

1. frontend monta payload do gasto;
2. `gastoController` injeta o `responsavelId` do token;
3. `gastoService` aplica regras de negocio:
   - validacao de cartao;
   - competencia;
   - recorrencia;
   - parcelamento;
   - compartilhamento;
   - vinculacao a fatura;
4. `gastoRepository` persiste no banco.

Arquivos principais:

- [api/src/controllers/gasto/gastoController.ts](C:/Projetos/NossoSaldo/api/src/controllers/gasto/gastoController.ts)
- [api/src/services/gasto/gastoService.ts](C:/Projetos/NossoSaldo/api/src/services/gasto/gastoService.ts)
- [api/src/repositories/gasto/gastoRepository.ts](C:/Projetos/NossoSaldo/api/src/repositories/gasto/gastoRepository.ts)

### 6.3 Conta conjunta

Fluxo funcional:

- usuarios podem se vincular em uma conta compartilhada;
- gastos podem ser visiveis ao outro usuario conforme `naoCompartilhar`;
- consultas de gastos usam o contexto da conta conjunta para consolidar registros acessiveis.

### 6.4 Relatorios

Fluxo observado:

- relatorios possuem controllers e services especificos;
- repositorio de relatorio consolida movimentos pagos;
- a analise e orientada ao periodo consultado.

### 6.5 Insights

Fluxo observado:

- modulo proprio de `insights`;
- rota dedicada;
- service e repository separados do modulo de relatorio, o que indica boa separacao funcional.

## 7. Persistencia e dados

### Como o sistema acessa o banco

O acesso ao banco ocorre por meio do `Prisma Client`, configurado para `PostgreSQL`.

Referencia:

- [api/prisma/schema.prisma](C:/Projetos/NossoSaldo/api/prisma/schema.prisma)

### Estrategia de repositorios / ORM / queries

- cada modulo relevante possui um repositorio proprio;
- os repositorios utilizam Prisma e, em alguns casos, transacoes;
- erros tecnicos sao encapsulados via `createRepositoryError`.

### Como a modelagem de dados impacta a arquitetura

A modelagem esta alinhada ao problema de negocio e possui bons elementos:

- `Gasto` como entidade central;
- `LancamentoBase` para representar parcelas;
- `FaturaCartao` para representar consolidacao financeira do cartao;
- `ContaConjunta` para vinculo de compartilhamento;
- tokens especificos para seguranca.

Essa modelagem favorece:

- rastreabilidade dos lancamentos;
- flexibilidade para gastos unicos, recorrentes e parcelados;
- segregacao entre pagamento do gasto e pagamento de parcela/fatura;
- quitacao integrada da parcela do mes vigente diretamente a partir do card pai, preservando a rastreabilidade e quitação individual em `LancamentoBase`.

### Possiveis riscos ou limitacoes

- parte importante da regra financeira depende da coerencia entre `Gasto`, `LancamentoBase` e `FaturaCartao`;
- o dominio financeiro esta fortemente acoplado a logica de service/repository;
- alteracoes em parcelamento e recorrencia exigem cuidado elevado para nao quebrar consistencia.

## 8. Qualidade arquitetural

### Pontos fortes

- boa separacao entre API, servicos e persistencia;
- versionamento de API centralizado em `/api/v1`;
- Swagger/OpenAPI atualizado no backend;
- contratos outbound ja existentes;
- testes unitarios relevantes por camada;
- uso de PostgreSQL com Prisma;
- suporte a relatorios e insights como modulos separados;
- boa expressividade da modelagem relacional para o contexto do negocio.

### Fragilidades

- frontend fortemente concentrado em um unico componente;
- camada de dominio ainda nao explicita;
- composition root nao formalizado;
- services acumulam muita orquestracao;
- parte da documentacao tecnica ainda precisa ser mantida sincronizada com as evolucoes do projeto.

### Debitos tecnicos arquiteturais

- centralizacao excessiva em `frontend/src/App.jsx`;
- ausencia de modularizacao mais forte por contexto no frontend;
- mistura de regra de negocio e orquestracao em alguns services;
- dependencia de implementacoes concretas em pontos que poderiam ser totalmente resolvidos por injecao.

### Riscos de evolucao

- aumento do custo de manutencao no frontend;
- regressao em fluxos financeiros complexos;
- dificuldade maior para onboarding de novos desenvolvedores;
- aumento do acoplamento conforme o produto crescer sem modularizacao adicional.

## 9. Testabilidade

### Como a arquitetura favorece ou dificulta testes

Favorece:

- services com mocks de repositorios;
- repositories testados separadamente;
- controllers e routers com testes especificos;
- Swagger validado por teste automatizado.

Dificulta:

- frontend monolitico;
- pouca separacao funcional de componentes de tela;
- possivel custo maior para testes end-to-end e de comportamento de UI.

### Cobertura percebida por camada

Backend:

- boa cobertura unitario/contratual em services, repositories, controllers e routers;
- validacoes de OpenAPI e algumas rotas principais testadas.
- 2 cenarios integrados executam a API contra PostgreSQL real, cobrindo criacao/listagem e pagamento/reabertura;
- o CI cria um PostgreSQL efemero separado da base de desenvolvimento e de producao.

Frontend:

- 7 testes automatizados com Vitest e Testing Library, cobrindo o cliente HTTP e o compositor de perguntas da IA.

Indicadores atuais do backend:

- 323 testes unitarios automatizados e 2 cenarios integrados;
- 89,84% de statements;
- 90,20% de lines;
- 90,41% de functions;
- 75,77% de branches.

### Oportunidades de melhoria

- ampliar os testes de integracao para cartoes, faturas, categorias, relatorios e conta conjunta;
- modularizar frontend para aumentar testabilidade;
- adicionar cenarios de seguranca, autorizacao e consistencia transacional.
- manter os workflows de CI como gate antes de aceitar atualizacoes de dependencias.

## 10. Recomendacoes

### Melhorias prioritarias

1. Modularizar o frontend por contexto funcional:
   - autenticacao;
   - gastos;
   - cartoes/faturas;
   - relatorios;
   - conta conjunta.
2. Criar um composition root explicito no backend.
3. Extrair partes centrais do dominio financeiro para um nucleo mais claro.

### Melhorias de medio prazo

1. Introduzir casos de uso nomeados em vez de concentrar tudo em `services`.
2. Reduzir acoplamento entre services.
3. Padronizar DTOs e mapeamentos entre entrada, aplicacao e saida.
4. Reforcar testes e2e.

### Sugestoes de refatoracao arquitetural

- separar `application`, `domain`, `infrastructure` e `adapters` no backend;
- mover composicao concreta de dependencias para um modulo unico;
- quebrar `App.jsx` em pagina, hooks, componentes e modulos de dominio visual.

### Sugestoes de padronizacao

- manter versionamento de API centralizado;
- documentar decisoes arquiteturais relevantes em ADRs;
- padronizar nomenclatura, encoding e estilo de contratos;
- revisar continuamente Swagger e README a cada evolucao do contrato.

## 11. Conclusao

### Diagnostico final da arquitetura

O `NossoSaldo` possui uma base arquitetural boa no backend, com separacao de responsabilidades, versionamento de API, contratos outbound e boa cobertura de testes. A arquitetura ja absorve varios principios importantes de hexagonal, mas ainda sem a disciplina completa de um nucleo de dominio independente.

No frontend, a aplicacao e funcional, mas a centralizacao excessiva em `App.jsx` representa o maior risco de manutencao e evolucao.

### Nivel de maturidade arquitetural

- Backend: medio
- Frontend: baixo a medio
- Arquitetura geral: media

### Proximos passos recomendados

1. Formalizar melhor a arquitetura do backend com composition root e casos de uso.
2. Modularizar o frontend.
3. Evoluir cobertura para testes integrados e de seguranca.
4. Atualizar este documento conforme ajustes de arquitetura e vulnerabilidades forem tratados.

## Resumo para lideranca

O sistema ja possui uma base tecnica consistente no backend, com boa organizacao, API versionada e testes relevantes. Isso reduz o risco operacional atual e permite evolucao com alguma seguranca.

O principal ponto de atencao esta na sustentabilidade da evolucao do produto: o frontend esta centralizado demais e o backend ainda pode amadurecer sua separacao entre aplicacao, dominio e infraestrutura. Os melhores investimentos agora sao modularizacao da interface, endurecimento arquitetural do backend e manutencao de uma trilha clara de melhoria tecnica e seguranca.

## Decisoes arquiteturais identificadas

- Separacao entre frontend e API REST.
- Uso de `React + Vite` no frontend.
- Uso de `Node.js + Express + TypeScript` no backend.
- Uso de `PostgreSQL` com `Prisma`.
- Versionamento da API em `/api/v1`.
- Uso de JWT com assinatura RS256.
- Uso de `ports/outbound` para contratos de persistencia e integracoes.
- Uso de GitHub Actions para validacao automatica, com Render e Vercel na entrega.
- Uso opcional da OpenAI com chave configurada e cifrada por usuario.
- Soft delete em entidades sensiveis.
- Separacao funcional de relatorios e insights.

## Riscos arquiteturais

- Frontend altamente concentrado em um unico arquivo principal.
- Services com acoplamento crescente e muitas responsabilidades.
- Dominio ainda nao explicito como camada propria.
- Forte dependencia semantica entre gastos, parcelas e faturas.
- Risco de inconsistencias em evolucoes financeiras sem testes integrados suficientes.

## Acoes recomendadas por prioridade

### Alta

- Quebrar `frontend/src/App.jsx` em modulos menores.
- Criar composition root para montagem do backend.
- Isolar melhor as regras centrais do dominio financeiro.

### Media

- Criar casos de uso nomeados.
- Expandir testes de integracao/e2e.
- Revisar continuamente contratos e documentacao da API.

### Baixa

- Adotar ADRs formais.
- Evoluir observabilidade com metricas, auditoria e tracing.
- Revisar e padronizar textos, encoding e convencoes tecnicas do projeto.

## Observacoes e hipoteses

- A conclusao de que o backend e "hexagonal parcial" e baseada na estrutura real dos arquivos e nas dependencias observadas.
- A conclusao de que o frontend ainda nao esta modularizado arquiteturalmente e baseada na concentracao funcional observada em `frontend/src/App.jsx`.
- Caso existam decisoes arquiteturais externas ao codigo analisado, este documento deve ser revisado para incorporar esse contexto.
