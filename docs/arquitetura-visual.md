# Arquitetura Visual do NossoSaldo

## Objetivo

Este documento apresenta a arquitetura do `NossoSaldo` em formato visual, usando `Markdown + Mermaid`, para facilitar leitura tecnica, onboarding e evolucao arquitetural do projeto.

Ele complementa:

- [arquitetura-software.md](C:/Projetos/NossoSaldo/docs/arquitetura-software.md)
- [arquitetura-c4-model.md](C:/Projetos/NossoSaldo/docs/arquitetura-c4-model.md)

---

## 1. Visao Geral

O `NossoSaldo` e uma plataforma web para gestao de gastos compartilhados, com frontend separado da API REST, persistencia em `PostgreSQL` e contratos versionados em `/api/v1`.

```mermaid
flowchart LR
  user["Usuario"]

  subgraph web["Frontend Web"]
    spa["React + Vite SPA"]
    apiClient["Cliente HTTP<br/>frontend/src/services/api.js"]
  end

  subgraph api["Backend API"]
    app["Express App<br/>/api/v1"]
    swagger["Swagger<br/>/api/v1/docs"]
    auth["JWT RS256"]
    rules["Regras de negocio"]
  end

  db[("PostgreSQL")]
  smtp["SMTP / E-mail"]
  openai["OpenAI API opcional"]

  user --> spa
  spa --> apiClient
  apiClient --> app
  app --> auth
  app --> rules
  app --> swagger
  rules --> db
  rules --> smtp
  rules -->|Consultas autorizadas| openai
```

---

## 2. Contexto do Sistema

Este diagrama mostra o sistema no contexto de uso.

```mermaid
flowchart TB
  casal["Casal / Usuario"]
  sistema["NossoSaldo"]
  email["Servico de E-mail"]
  banco[("PostgreSQL")]
  openai["OpenAI API opcional"]

  casal -->|"Registra e consulta gastos"| sistema
  sistema -->|"Envia recuperacao de senha e validacao de e-mail"| email
  sistema -->|"Persiste usuarios, gastos, faturas e categorias"| banco
  sistema -->|"Consultas financeiras autorizadas"| openai
```

---

## 3. Containers

O sistema esta dividido em cinco containers principais, considerando a integracao externa opcional com a OpenAI.

```mermaid
flowchart LR
  user["Usuario"]

  subgraph c1["Container 1"]
    frontend["Frontend Web<br/>React + Vite"]
  end

  subgraph c2["Container 2"]
    backend["API REST<br/>Node.js + Express + TypeScript"]
  end

  subgraph c3["Container 3"]
    postgres["Banco de Dados<br/>PostgreSQL"]
  end

  subgraph c4["Container 4"]
    mailer["Servico de E-mail<br/>SMTP"]
  end

  openai["OpenAI API opcional"]

  user -->|"HTTPS"| frontend
  frontend -->|"HTTP JSON + x-access-token"| backend
  backend -->|"Prisma"| postgres
  backend -->|"SMTP"| mailer
  backend -->|"Consultas autorizadas"| openai
```

### Resumo dos containers

- `Frontend Web`: interface, navegacao, filtros, dashboards e formularios.
- `API REST`: autenticacao, regras de negocio, persistencia e documentacao.
- `PostgreSQL`: armazenamento principal.
- `SMTP`: comunicacao por e-mail.
- `OpenAI API`: provedor opcional do assistente financeiro, acionado pelo backend com a configuracao do usuario.

---

## 4. Backend em Camadas

O backend segue um fluxo em camadas com inclinacao para arquitetura hexagonal.

```mermaid
flowchart LR
  router["Router"]
  middleware["Middlewares"]
  schema["Schemas de validacao"]
  controller["Controller"]
  service["Service / Caso de uso"]
  port["Porta outbound"]
  repository["Repository"]
  prisma["Prisma Client"]
  db[("PostgreSQL")]

  router --> middleware
  middleware --> schema
  schema --> controller
  controller --> service
  service --> port
  port --> repository
  repository --> prisma
  prisma --> db
```

### Leitura do fluxo

- `Router`: expõe a rota.
- `Middleware`: valida token, params ou payload.
- `Schema`: garante contrato de entrada.
- `Controller`: adapta HTTP para aplicação.
- `Service`: executa regra de negocio.
- `Port`: define contrato de saida.
- `Repository`: implementa acesso concreto ao banco.

---

## 5. Visao Hexagonal

O backend ja apresenta elementos fortes de `Ports and Adapters`.

```mermaid
flowchart LR
  user["Usuario / Frontend"]

  subgraph inAdapters["Adaptadores de entrada"]
    routers["Routers"]
    middlewares["Middlewares"]
    controllers["Controllers"]
    schemas["Schemas"]
  end

  subgraph core["Nucleo da aplicacao"]
    services["Services / Casos de uso"]
    ports["Ports Outbound"]
  end

  subgraph outAdapters["Adaptadores de saida"]
    repositories["Repositories Prisma"]
    security["JWT / Seguranca"]
    email["Mailer"]
  end

  db[("PostgreSQL")]
  smtp["SMTP"]

  user --> routers
  routers --> middlewares
  middlewares --> schemas
  schemas --> controllers
  controllers --> services
  services --> ports
  ports --> repositories
  services --> security
  services --> email
  repositories --> db
  email --> smtp
```

### Diagnostico visual

- A arquitetura ja se aproxima de hexagonal no backend.
- O dominio ainda nao esta separado como camada propria.
- Os `services` ainda concentram boa parte da orquestracao.

---

## 6. Modulos Principais da API

Os principais modulos de negocio do backend hoje sao:

```mermaid
flowchart TB
  api["API NossoSaldo"]

  usuario["Usuarios / Auth"]
  categoria["Categorias"]
  conta["Conta Conjunta"]
  gasto["Gastos"]
  cartao["Cartoes de Credito"]
  fatura["Faturas"]
  relatorio["Relatorios"]
  insights["Insights"]
  ia["Assistente IA"]

  api --> usuario
  api --> categoria
  api --> conta
  api --> gasto
  api --> cartao
  api --> fatura
  api --> relatorio
  api --> insights
  api --> ia
```

### Papel de cada modulo

- `Usuarios / Auth`: login, cadastro, senha, validacao de e-mail.
- `Categorias`: agrupamento semantico dos lancamentos.
- `Conta Conjunta`: compartilhamento entre usuarios.
- `Gastos`: modulo central do dominio financeiro.
- `Cartoes`: cadastro e administracao de cartoes.
- `Faturas`: consolidacao de gastos de cartao.
- `Relatorios`: visoes analiticas.
- `Insights`: analise orientada a gargalos.
- `Assistente IA`: consultas financeiras controladas por funcoes, usando a chave configurada pelo usuario.

---

## 7. Entrega, testes e operacao

```mermaid
flowchart LR
  commit["Commit na master"] --> github["GitHub Actions"]
  github --> front["Frontend CI\nESLint + Vitest + build"]
  github --> backend["API CI\nESLint + Jest + Prisma + build"]
  front --> vercel["Vercel"]
  backend --> render["Render"]
  render --> supabase[("Supabase PostgreSQL")]
```

O pipeline atual possui 7 testes no frontend, 323 testes unitarios na API e 2 cenarios integrados contra PostgreSQL efemero. Os checks verdes indicam validação técnica; a publicação efetiva ocorre nos serviços Vercel e Render conectados à `master`.

---

## 8. Fluxo de Autenticacao

```mermaid
sequenceDiagram
  participant U as Usuario
  participant F as Frontend
  participant A as API
  participant S as UsuarioService
  participant R as UsuarioRepository
  participant DB as PostgreSQL

  U->>F: Informa email e senha
  F->>A: POST /api/v1/login
  A->>S: login(payload)
  S->>R: buscarUsuarioPorEmail(email)
  R->>DB: select usuario
  DB-->>R: usuario
  R-->>S: usuario
  S-->>A: token JWT
  A-->>F: accessToken
  F->>F: Salva token e usa x-access-token
```

---

## 9. Fluxo de Cadastro de Gasto

```mermaid
sequenceDiagram
  participant U as Usuario
  participant F as Frontend
  participant C as GastoController
  participant S as GastoService
  participant GR as GastoRepository
  participant FR as FaturaRepository
  participant DB as PostgreSQL

  U->>F: Preenche formulario de gasto
  F->>C: POST /api/v1/gastosUsuarioLogado
  C->>S: criarGastoUsuarioLogado(payload + responsavelId)
  S->>S: Valida regras de negocio
  S->>FR: Buscar/criar fatura (quando aplicavel)
  S->>GR: Criar gasto
  GR->>DB: insert gasto / parcelas
  DB-->>GR: registro criado
  GR-->>S: gasto criado
  S-->>C: resultado
  C-->>F: HTTP 201
```

### Regras relevantes do fluxo

- gasto pode ser `unico`, `recorrente` ou `parcelado`;
- pode estar vinculado a cartao;
- pode gerar parcelas em `LancamentoBase`;
- pode gerar ou recalcular faturas.

---

## 10. Fluxo de Conta Conjunta e Compartilhamento

```mermaid
flowchart LR
  request["Usuario autenticado consulta gastos"]
  service["GastoService"]
  conta["Conta conjunta ativa?"]
  filtro["Filtrar gastos compartilhaveis"]
  resposta["Retornar gastos proprios + compartilhados"]

  request --> service
  service --> conta
  conta --> filtro
  filtro --> resposta
```

### Comportamento observado

- o usuario sempre enxerga seus proprios gastos;
- gastos do parceiro aparecem quando ha conta conjunta ativa;
- o campo `naoCompartilhar` restringe visualizacao.

---

## 11. Modelo de Dados Principal

Este diagrama resume as entidades mais relevantes para o dominio.

```mermaid
erDiagram
  USUARIO ||--o{ GASTO : responsavel
  USUARIO ||--o{ CARTAO_CREDITO : possui
  USUARIO ||--o{ CONTA_CONJUNTA : participa
  CATEGORIA ||--o{ GASTO : classifica
  CARTAO_CREDITO ||--o{ FATURA_CARTAO : possui
  CARTAO_CREDITO ||--o{ GASTO : vincula
  FATURA_CARTAO ||--o{ GASTO : consolida
  GASTO ||--o{ LANCAMENTO_BASE : gera
  FATURA_CARTAO ||--o{ LANCAMENTO_BASE : consolida

  USUARIO {
    uuid id
    string nome
    string email
  }

  CONTA_CONJUNTA {
    uuid id
    string nomeConta
  }

  CATEGORIA {
    uuid id
    string descricao
  }

  GASTO {
    uuid id
    string descricao
    string tipo
    string status
    string origemLancamento
    decimal valor
  }

  LANCAMENTO_BASE {
    uuid id
    int numeroParcela
    decimal valorParcela
    date dataVencimentoParcela
    string status
  }

  CARTAO_CREDITO {
    uuid id
    string descricao
    int diaFechamento
    int diaVencimento
  }

  FATURA_CARTAO {
    uuid id
    string competencia
    decimal valorTotal
    string status
  }
```

---

## 12. Versionamento da API

O projeto ja possui versionamento explicito da API.

```mermaid
flowchart LR
  client["Frontend / Cliente"]
  api["API Express"]
  version["Prefixo /api/v1"]
  docs["Swagger /api/v1/docs"]

  client --> version
  version --> api
  api --> docs
```

### Implicacao arquitetural

- o contrato externo esta versionado;
- a implementacao interna dos routers permanece desacoplada do prefixo;
- isso facilita futura coexistencia de `v1` e `v2`.

---

## 13. Pontos Fortes

```mermaid
mindmap
  root((Pontos Fortes))
    Backend bem organizado
    API versionada
    Swagger publicado
    PostgreSQL com Prisma
    Modulos de relatorio e insights separados
    Uso de ports outbound
    Boa base de testes no backend
```

---

## 14. Pontos de Atencao

```mermaid
mindmap
  root((Pontos de Atencao))
    Frontend concentrado em App.jsx
    Services muito grandes
    Dominio ainda nao explicito
    Forte acoplamento entre gasto parcela e fatura
    Necessidade de evoluir testes integrados
```

---

## 15. Roadmap Arquitetural Sugerido

```mermaid
flowchart LR
  atual["Estado Atual"]
  passo1["Modularizar Frontend"]
  passo2["Criar Composition Root"]
  passo3["Explicitar Casos de Uso"]
  passo4["Isolar Dominio"]
  passo5["Fortalecer Seguranca e Observabilidade"]

  atual --> passo1
  passo1 --> passo2
  passo2 --> passo3
  passo3 --> passo4
  passo4 --> passo5
```

### Prioridades recomendadas

- `Alta`: modularizacao do frontend.
- `Alta`: endurecimento arquitetural do backend.
- `Media`: testes e2e e observabilidade.
- `Media`: evolucao da documentacao e governanca arquitetural.

---

## 16. Conclusao

O `NossoSaldo` ja possui uma arquitetura suficientemente estruturada para documentacao visual eficaz. O backend esta em um bom caminho para consolidar uma arquitetura hexagonal pragmatica, enquanto o frontend ainda precisa amadurecer em modularidade.

Este documento deve ser tratado como artefato vivo e atualizado conforme avancarmos em:

- modularizacao;
- mitigacao de vulnerabilidades;
- evolucao de contratos;
- amadurecimento da arquitetura.
