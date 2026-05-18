# Arquitetura do NossoSaldo

## Visao Geral

```mermaid
flowchart LR
  usuario["Usuario<br/>Navegador"]

  subgraph frontend["Frontend - React + Vite"]
    telas["Telas<br/>Login, Dashboard, Gastos, Relatorios"]
    apiClient["Camada de chamadas HTTP<br/>src/services"]
    estado["Estado da aplicacao<br/>Token, perfil, filtros e listas"]
  end

  subgraph backend["Backend - Node.js + Express + TypeScript"]
    middlewares["Middlewares<br/>CORS, JSON, Logger, Request ID"]
    auth["Autenticacao<br/>JWT RS256"]
    routers["Routers<br/>usuarios, gastos, conta conjunta, relatorios"]
    schemas["Validacao de entrada<br/>Schemas"]
    controllers["Controllers<br/>HTTP status e resposta padronizada"]
    services["Services<br/>Regras de negocio"]
    repositories["Repositories<br/>Acesso a dados"]
    swagger["Swagger<br/>/docs"]
  end

  subgraph dados["Persistencia"]
    prisma["Prisma Client"]
    mysql[("MySQL<br/>Usuarios, Gastos, Categorias,<br/>Contas conjuntas, Tokens")]
  end

  subgraph externos["Servicos externos"]
    gmail["Gmail SMTP<br/>Envio de e-mail"]
  end

  usuario --> telas
  telas --> estado
  telas --> apiClient
  apiClient -->|HTTP JSON + x-access-token| middlewares

  middlewares --> auth
  auth --> routers
  routers --> schemas
  schemas --> controllers
  controllers --> services
  services --> repositories
  repositories --> prisma
  prisma --> mysql

  services -->|recuperacao de senha| gmail
  routers --> swagger
```

## Fluxo de Autenticacao

```mermaid
sequenceDiagram
  participant U as Usuario
  participant F as Frontend
  participant A as API
  participant S as UsuarioService
  participant D as MySQL

  U->>F: Informa e-mail e senha
  F->>A: POST /usuarios/login
  A->>S: Valida credenciais
  S->>D: Busca usuario e senha hash
  D-->>S: Usuario encontrado
  S-->>A: Gera JWT RS256
  A-->>F: accessToken, tokenType, expiresIn
  F->>F: Armazena token em estado/localStorage
  F->>A: Requisicoes autenticadas com x-access-token
```

## Fluxo de Gastos Compartilhados

```mermaid
flowchart TD
  requisicao["GET /gastos<br/>Usuario logado"]
  service["GastoService"]
  repository["GastoRepository"]
  conta["ContaConjunta ativa?<br/>deletedAt nulo"]
  filtro["Filtro de compartilhamento<br/>naoCompartilhar = false"]
  resultado["Resultado consolidado<br/>Gastos proprios + gastos compartilhados"]
  front["Dashboard<br/>Lista com origem do gasto"]

  requisicao --> service
  service --> repository
  repository --> conta
  conta --> filtro
  filtro --> resultado
  resultado --> front
```

## Padrao de Camadas

```mermaid
flowchart TB
  route["Router<br/>Define endpoint e middlewares"]
  schema["Schema<br/>Valida contrato de entrada"]
  controller["Controller<br/>Traduz HTTP para caso de uso"]
  service["Service<br/>Concentra regra de negocio"]
  repository["Repository<br/>Isola consultas e comandos no banco"]
  database[("Banco de dados")]

  route --> schema
  schema --> controller
  controller --> service
  service --> repository
  repository --> database
```

## Componentes Principais

| Camada | Responsabilidade | Exemplos |
| --- | --- | --- |
| Frontend | Interface, navegacao local, chamadas HTTP e exibicao dos dados | Login, Dashboard, relatorios, listagem de gastos |
| Routers | Exporem endpoints e aplicarem middlewares | `usuarioRouter`, `gastoRouter`, `relatorioRouter` |
| Controllers | Montarem resposta HTTP padronizada | `sendSuccess`, status codes, payloads |
| Services | Aplicarem regras de negocio | login, edicao de gasto, compartilhamento, relatorios |
| Repositories | Consultarem e persistirem dados | Prisma, queries SQL, transacoes |
| Secure | Autenticacao e autorizacao | JWT RS256, token expirado, assinatura invalida |
| Lib | Infraestrutura de apoio | logger, mailer |
| Banco | Estado persistente da aplicacao | usuarios, gastos, categorias, conta conjunta, tokens |

## Pontos Fortes da Arquitetura

- Separacao clara entre HTTP, regra de negocio e persistencia.
- Autenticacao baseada em JWT assinado com RS256.
- Soft delete em entidades sensiveis, preservando historico.
- Respostas HTTP padronizadas com `sendSuccess`.
- Documentacao Swagger exposta em `/docs`.
- Logger estruturado com request ID, facilitando rastreabilidade.
- Relatorios tratados como modulo separado, o que facilita evolucao.

## Melhorias Futuras Recomendadas

- Centralizar a instancia do Prisma para evitar multiplas conexoes.
- Padronizar todos os repositories para evitar mistura excessiva entre Prisma ORM e SQL raw.
- Criar um modulo de observabilidade com niveis de log, mascaramento de dados sensiveis e correlacao por usuario.
- Adicionar testes end-to-end cobrindo login, gastos individuais, gastos compartilhados e relatorios.
- Criar pipeline CI com lint, testes, build e validacao de migrations.
