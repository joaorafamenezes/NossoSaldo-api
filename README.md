# NossoSaldo API

API REST do NossoSaldo, responsavel por autenticacao, usuarios, categorias, contas conjuntas, gastos, cartoes de credito, faturas, relatorios e insights.

## Stack

- Node.js + Express
- TypeScript
- Prisma + MySQL ou PostgreSQL
- Joi para validacao de payloads
- JWT via header `x-access-token`
- Swagger/OpenAPI
- Jest + Supertest

## Scripts

```bash
npm run dev              # sobe a API em desenvolvimento
npm run build            # compila TypeScript
npm run lint             # valida padroes de codigo
npm start                # executa dist/server.js
npm test                 # roda a suite Jest
npm test -- --coverage   # roda testes com cobertura
npm run db:ensure:local  # garante banco local configurado
npm run migrate:dev      # cria/aplica migration no ambiente local
npm run migrate:deploy   # aplica migrations em ambiente alvo
npm run migrate:status   # mostra status das migrations
npm run seed:dev         # popula dados de desenvolvimento
```

## Ambientes

- O arquivo `.env` e apenas para desenvolvimento local e nao deve ser versionado.
- Homologacao e producao devem receber `DATABASE_URL` e demais secrets fora do Git.
- O schema Prisma e o mesmo em todos os ambientes; o que muda e somente a configuracao do ambiente.

Fluxo recomendado:

1. Em desenvolvimento local, configure `.env` com o banco local.
2. Gere migrations com `npm run migrate:dev`.
3. Versione a pasta `prisma/migrations`.
4. Em homologacao, publique a aplicacao com `DATABASE_URL` apontando para o banco HMG e rode `npm run migrate:deploy`.
5. Depois de validar, publique a mesma versao em producao com `DATABASE_URL` de PROD e rode `npm run migrate:deploy`.

Exemplo de bancos por ambiente:

- DEV: `nossosaldo-dev`
- HMG: `nossosaldo-hmg`
- PROD: `nossosaldo-prod`

## Documentacao

- Prefixo atual da API: `/api/v1`
- Swagger UI: `/api/v1/docs`
- OpenAPI JSON: `/api/v1/docs/openapi.json`
- Fonte da especificacao: `src/docs/openapi.ts`

## Versionamento

- A aplicacao pode evoluir em `MAJOR.MINOR.PATCH`, enquanto a API evolui por contrato versionado.
- Hoje o contrato publico da API esta em `v1`.
- A estrutura atual deixa preparada a coexistencia futura de novas versoes, como `v2`, sem precisar reescrever a organizacao interna das rotas.

## Regras de gastos

- `dataVencimento` e obrigatoria no cadastro de qualquer gasto.
- `competencia` representa o primeiro dia do mes do vencimento.
- Exemplo: `dataVencimento = 2026-08-17` deve usar `competencia = 2026-08-01`.
- Gastos recorrentes podem gerar lancamentos futuros ate `dataFimRecorrencia`.
- Gastos parcelados geram parcelas em `LancamentoBase`.
- Gastos com cartao sao vinculados a fatura pelo vencimento.

## Cobertura

A suite aplica thresholds minimos de 89% para statements, 90% para lines e functions e 75% para branches no escopo unitario. Adaptadores de banco, mailer, rotas de wiring, scripts e entrypoints ficam fora da metrica unitaria e devem ser cobertos por testes de integracao/e2e quando essa camada for adicionada.

## CI

O workflow `.github/workflows/ci.yml` executa automaticamente em pushes para `main`, `master` e `developer`, e em pull requests. A validacao roda em quatro etapas:

1. instala dependencias com `npm ci`;
2. executa `npm run lint`;
3. executa `npm test -- --coverage`, respeitando os thresholds de cobertura;
4. executa `npm run build`.

O CI nao executa migrations, seed ou sincronizacao de banco. Portanto, ele nao precisa de `DATABASE_URL` nem altera dados locais, do Supabase ou de producao. O relatorio de cobertura e salvo como artefato da execucao por 14 dias.

## Testes integrados

A suite integrada fica separada dos testes unitarios e exercita o fluxo HTTP completo de gastos contra um PostgreSQL real. Ela cobre criacao/listagem, pagamento e reabertura, incluindo a persistencia final no banco.

Pre-requisitos locais:

- PostgreSQL de testes separado do banco de desenvolvimento e de producao; ou Docker Desktop em execucao.
- `DATABASE_URL` e `DIRECT_URL` apontando para esse banco de testes.
- chaves JWT de teste em `keys/private.key` e `keys/public.key`.

Com as variaveis de ambiente configuradas, execute:

```bash
npm run test:integration
```

O CI sobe automaticamente um servico `postgres:16`, aplica as migrations e executa essa suite. Nenhum teste integrado usa Supabase ou dados de producao.
