# NossoSaldo API

API REST do NossoSaldo, responsavel por autenticacao, usuarios, categorias, contas conjuntas, gastos, cartoes de credito, faturas e relatorios.

## Stack

- Node.js + Express
- TypeScript
- Prisma + MySQL
- Joi para validacao de payloads
- JWT via header `x-access-token`
- Swagger/OpenAPI
- Jest + Supertest

## Scripts

```bash
npm run dev              # sobe a API em desenvolvimento
npm run build            # compila TypeScript
npm start                # executa dist/server.js
npm test                 # roda a suite Jest
npm test -- --coverage   # roda testes com cobertura
npm run db:ensure        # garante banco local configurado
npm run migrate:deploy   # aplica migrations em ambiente alvo
npm run seed:dev         # popula dados de desenvolvimento
```

## Documentacao

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs/openapi.json`
- Fonte da especificacao: `src/docs/openapi.ts`

## Regras de gastos

- `dataVencimento` e obrigatoria no cadastro de qualquer gasto.
- `competencia` representa o primeiro dia do mes do vencimento.
- Exemplo: `dataVencimento = 2026-08-17` deve usar `competencia = 2026-08-01`.
- Gastos recorrentes podem gerar lancamentos futuros ate `dataFimRecorrencia`.
- Gastos parcelados geram parcelas em `LancamentoBase`.
- Gastos com cartao sao vinculados a fatura pelo vencimento.

## Cobertura

A suite usa threshold minimo de 90% para statements, lines e functions no escopo unitario. Adaptadores de banco, mailer, rotas de wiring, scripts e entrypoints ficam fora da metrica unitaria e devem ser cobertos por testes de integracao/e2e quando essa camada for adicionada.
