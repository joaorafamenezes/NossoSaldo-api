# Padrão de Commits e Versionamento Semântico — NossoSaldo

Este documento define o padrão oficial de mensagens de commit e o fluxo de versionamento semântico automatizado adotado no **NossoSaldo** (Backend API e Frontend).

---

## 1. Por que usamos este padrão?

Seguimos a especificação mundial **[Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/)**, integrada ao **[Semantic Versioning (SemVer 2.0.0)](https://semver.org/lang/pt-BR/)**.

Com esse padrão:
- O histórico do Git torna-se autoexplicativo e auditável.
- O versionamento (`2.1.0` ➔ `2.1.1` ou `2.2.0`) é **calculado automaticamente** pelo GitHub Actions (*Release Please*).
- O arquivo `CHANGELOG.md` é gerado e categorizado sem esforço manual a cada release.

---

## 2. Estrutura de uma Mensagem de Commit

Toda mensagem de commit deve seguir a seguinte estrutura:

```text
<tipo>(<escopo opcional>): <descrição sucinta e clara>

[corpo opcional explicando o contexto, motivação ou detalhes técnicos]

[rodapé opcional para referenciar issues ou BREAKING CHANGE]
```

### Exemplo Básico:
```bash
git commit -m "feat(gastos): adiciona modal para desvincular cartao de credito de parcelas"
```

### Exemplo Completo com Corpo e Rodapé:
```text
fix(gastos): desvincula faturas ao migrar parcelas para conta corrente

Quando o usuario escolhe migrar uma parcela de cartao para conta corrente,
a fatura anterior deve ser recalculada e o campo faturaCartaoId setado como null.

Fixes #142
```

---

## 3. Tipos de Commit e Impacto na Versão (SemVer)

O prefixo (`tipo`) informa ao robô de CI/CD se ele deve subir a versão e qual dígito incrementar:

| Prefixo | Significado | Impacto no SemVer | Exemplo de Nova Versão |
| :--- | :--- | :---: | :---: |
| `fix:` | Correção de bug no sistema | **PATCH** (`+0.0.1`) | `2.0.0` ➔ `2.0.1` |
| `feat:` | Nova funcionalidade ou recurso para o usuário | **MINOR** (`+0.1.0`) | `2.0.0` ➔ `2.1.0` |
| `feat!:` ou `fix!:` | **Quebra de compatibilidade** (Breaking Change) | **MAJOR** (`+1.0.0`) | `2.0.0` ➔ `3.0.0` |
| `refactor:` | Refatoração de código (sem mudar comportamento ou corrigir bug) | *Sem bump* | Mantém versão atual |
| `perf:` | Melhoria significativa de desempenho de código/queries | *Sem bump* | Mantém versão atual |
| `test:` | Adição ou correção de suítes de testes (Jest / Vitest) | *Sem bump* | Mantém versão atual |
| `docs:` | Alteração exclusiva em documentação (.md, swagger) | *Sem bump* | Mantém versão atual |
| `chore:` | Tarefas de manutenção interna, configs, build ou tooling | *Sem bump* | Mantém versão atual |
| `style:` | Ajustes de lint, formatação, espaçamento (sem afetar lógica) | *Sem bump* | Mantém versão atual |

> [!IMPORTANT]
> **Quebras de Compatibilidade (Breaking Change)**:
> Se uma alteração quebrar contratos de API existentes (ex: renomeação de rota REST, exclusão de endpoint público, mudança de tipo incompatível), utilize a exclamação `!` logo após o tipo/escopo ou declare no rodapé:
> ```text
> feat(api)!: altera formato de retorno do resumo mensal para objeto aninhado
> 
> BREAKING CHANGE: a propriedade 'total' agora responde dentro de 'totais.geral'.
> ```

---

## 4. Escopos Recomendados para o NossoSaldo

O escopo ajuda a identificar imediatamente em qual módulo a alteração ocorreu:

| Escopo | Onde Usar | Exemplos |
| :--- | :--- | :--- |
| `(gastos)` | Lançamentos, parcelamentos, despesas e receitas | `feat(gastos): permite editar parcela individualmente` |
| `(recorrencia)`| Projeção, série mensal, periodicidade e modelos | `fix(recorrencia): corrige calculo de fim de recorrencia` |
| `(cartao)` | Cartões de crédito, limites, faturas e conciliação | `feat(cartao): adiciona simulador de limite disponivel` |
| `(categorias)` | Categorias, tetos de orçamento e distribuição | `fix(categorias): corrige ordenacao alfabetica no seletor` |
| `(auth)` | Login, tokens JWT, recuperação de senha, permissões | `feat(auth): adiciona expiracao de sessao por inatividade` |
| `(ia)` | Copilot IA, auditoria de gastos, insights e prompts | `feat(ia): integra historico de conversas do copilot` |
| `(ui)` | Componentes visuais genéricos, layout, temas e badges | `style(ui): melhora contraste do badge de status` |
| `(deps)` | Atualização de pacotes no package.json | `chore(deps): atualiza vitest para versao 4.2` |

---

## 5. Boas Práticas e Regras de Ouro

1. **Use o verbo no imperativo / presente:**
   - ✅ `feat(gastos): adiciona filtro por responsavel`
   - ❌ `feat(gastos): adicionando filtro...` ou `adicionei filtro...`
2. **Comece com letra minúscula após os dois pontos:**
   - ✅ `fix(cartao): corrige data de fechamento`
   - ❌ `fix(cartao): Corrige data de fechamento`
3. **Não finalize a linha de título com ponto final:**
   - ✅ `feat: implementa exportacao para excel`
   - ❌ `feat: implementa exportacao para excel.`
4. **Seja específico e evite mensagens vagas:**
   - ❌ `ajuste na forma de pagamento` *(Não sabemos se foi feature, fix, nem onde foi)*
   - ✅ `fix(gastos): corrige desvinculacao de cartao de credito em gastos parcelados`
5. **Commits atômicos:**
   - Prefira fazer commits pequenos e focados em uma única responsabilidade em vez de um único commit gigante misturando telas, banco e testes.

---

## 6. Exemplos Reais (Antes vs Depois)

| ❌ Antes (Não recomendado) | ✅ Depois (Padrão Conventional Commits) | Efeito no Versionamento |
| :--- | :--- | :---: |
| `ajuste na forma de pagamento` | `fix(gastos): corrige desvinculacao de fatura em parcelas` | Sobe **PATCH** (`2.0.1`) |
| `novo modal de cartao` | `feat(cartao): adiciona modal de selecao rapida de cartao` | Sobe **MINOR** (`2.1.0`) |
| `arrumando testes` | `test(gastos): adiciona testes unitarios para ct001 e ct002` | Não altera versão |
| `atualizando documentacao` | `docs: adiciona guia de commits e versionamento` | Não altera versão |
| `correcao de imports e tipos` | `fix(types): corrige import de CartaoCredito para build` | Sobe **PATCH** (`2.0.1`) |

---

## 7. Como funciona o Fluxo com o GitHub Actions (Passo a Passo)

1. **No dia a dia (`branch: dev`)**:
   Você desenvolve e commita normalmente seguindo esta convenção.
2. **Ao concluir uma entrega (`dev ➔ main`)**:
   Você abre o Pull Request da `dev` para a `main` e realiza o merge.
3. **Automação do Release Please**:
   O GitHub Action analisa todo o histórico de commits desde a última versão:
   - Se houver ao menos um `fix:` ➔ sugere incremento de **Patch**.
   - Se houver ao menos um `feat:` ➔ sugere incremento de **Minor**.
   - Se houver `BREAKING CHANGE:` ➔ sugere incremento de **Major**.
   - O robô abre um PR automático com o `CHANGELOG.md` gerado.
4. **Publicação da Release**:
   Ao mergear o PR de Release na `main`, a Tag correspondente (ex: `v2.1.0`) é publicada automaticamente!
