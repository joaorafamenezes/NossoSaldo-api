# Guia Rápido de Commits — NossoSaldo API

Este repositório adota o padrão **Conventional Commits** para automação de releases e changelog via GitHub Actions (*Release Please*).

Para a documentação completa, consulte [docs/padrao-commits-e-versionamento.md](../docs/padrao-commits-e-versionamento.md).

---

## Formato Básico

```bash
git commit -m "<tipo>(<escopo>): <descrição no imperativo e em minúsculas>"
```

### Tipos e Efeito no Versionamento:
- `fix:` ➔ Correção de bug (Gera versão **PATCH**: `2.0.0` ➔ `2.0.1`)
- `feat:` ➔ Nova funcionalidade (Gera versão **MINOR**: `2.0.0` ➔ `2.1.0`)
- `feat!:` ou `fix!:` ➔ Quebra de contrato/API (Gera versão **MAJOR**: `2.0.0` ➔ `3.0.0`)
- `refactor:` ➔ Refatoração interna sem alterar comportamento (Sem alteração de versão)
- `test:` ➔ Criação ou atualização de testes (Sem alteração de versão)
- `docs:` ➔ Documentação ou Swagger (Sem alteração de versão)
- `chore:` ➔ Manutenção de dependências, builds, prisma (Sem alteração de versão)

### Escopos mais comuns na API:
- `(gastos)` — Rotas, repositórios e serviços de gastos e parcelamentos
- `(recorrencia)` — Motor de projeção mensal e séries recorrentes
- `(cartao)` — Faturas, cartões de crédito e conciliação
- `(categorias)` — Gestão de categorias e orçamentos
- `(auth)` — Autenticação, JWT, rotas de usuários
- `(ia)` — Integração com LLMs, prompts e insights
- `(db)` — Migrações e esquemas do Prisma

### Exemplos:
- `feat(gastos): adiciona suporte a desvincular faturas de parcelas individuais`
- `fix(cartao): recalcula valor total da fatura ao remover lancamento`
- `test(recorrencia): adiciona cenarios para escopos THIS_ONLY e ALL_SERIES`
