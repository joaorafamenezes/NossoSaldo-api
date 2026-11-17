# Fase 05: Entrega continua com Render e Vercel

## Estado atual

O NossoSaldo possui dois repositorios independentes:

- API: validada pelo workflow `API CI` e publicada pelo Render.
- Frontend: validado pelo workflow `Frontend CI` e publicado pela Vercel.

Render e Vercel ja fazem o deploy automatico a partir do GitHub. Por isso, esta fase nao cria um segundo deploy via GitHub Actions: isso poderia gerar deploy duplicado e concorrente.

## Fluxo recomendado

1. Alterar o repositorio correspondente.
2. Executar a validacao local.
3. Fazer commit e push.
4. Aguardar o workflow do repositorio terminar com sucesso.
5. O Render ou a Vercel iniciara o deploy automatico.
6. Conferir os logs e executar uma verificacao manual da aplicacao publicada.

Depois do deploy da API, a verificacao pode ser automatizada pelo workflow `API Post-deploy Smoke Test`, na aba **Actions** do repositorio da API. Informe a URL publicada e o workflow valida `GET /health` e `GET /api/v1/docs/openapi.json`, sem gravar dados.

API:

```bash
cd api
npm run lint
npm test -- --coverage
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Validacao manual

Os dois workflows tambem possuem `workflow_dispatch`, permitindo executar a validacao manualmente pela aba **Actions** do GitHub antes de uma publicacao planejada.

## Protecao recomendada no GitHub

Para impedir que codigo sem validacao chegue ao deploy automatico, configure no repositorio de cada aplicacao:

- branch padrao como `main` ou `master`, conforme a utilizada;
- regra de protecao da branch;
- exigencia do status check `Validate API` ou `Validate frontend`;
- bloqueio de merge enquanto o check estiver falhando;
- exigencia de branch atualizada antes do merge, quando aplicavel.

Como o ambiente atual usa uma unica instancia em Render, Vercel e Supabase, a protecao reduz o risco de publicar codigo quebrado, mas nao cria homologacao isolada. Migrations continuam sendo uma operacao separada e nunca sao executadas pelo CI.

## Fase 06: smoke test pos-deploy

A Fase 06 adiciona uma verificacao segura de disponibilidade da API publicada. Ela nao substitui testes de negocio nem uma suite end-to-end autenticada; seu objetivo e detectar rapidamente indisponibilidade, rota incorreta ou contrato OpenAPI ausente.

## Fase 07: seguranca de dependencias

A Fase 07 adiciona duas camadas de manutencao:

- Dependabot verifica semanalmente os `package-lock.json` e abre pull requests de atualizacao nos repositorios da API e do frontend.

## Fase 08: testes unitarios do frontend

A Fase 08 adiciona uma primeira camada de testes automatizados ao frontend, que antes dependia apenas de lint e build.

- O Vitest executa os testes com `npm test`.
- A suíte inicial cobre o cliente HTTP em `frontend/src/services/api.test.js`.
- Os cenários validam a URL versionada `/api/v1`, autenticação, filtros e totalização da lista de gastos, consultas financeiras da IA e transformação de erros da API.
- O workflow `frontend/.github/workflows/ci.yml` executa `lint`, `npm test` e `build` em cada push monitorado e pull request.

Esta fase cria a base para testes de componentes e fluxos de usuário. A cobertura atual é de comportamento do cliente HTTP, não representa ainda cobertura total da interface React.

## Fase 09: testes de interação do frontend

A Fase 09 amplia a validação para uma interação crítica do produto: o compositor de perguntas do assistente financeiro.

- O formulário foi extraído para `frontend/src/components/AiQuestionComposer.jsx`, mantendo o comportamento e os estilos existentes.
- `frontend/src/components/AiQuestionComposer.test.jsx` verifica envio com `Enter`, quebra de linha com `Shift+Enter` e bloqueio do botão durante consulta ou para perguntas curtas.
- A suíte agora possui 7 testes distribuídos entre o cliente HTTP e o componente React.
- O CI já executa esses cenários por meio do comando `npm test` configurado na Fase 08.

O próximo passo recomendado é ampliar gradualmente a cobertura para filtros da lista de gastos, paginação por categoria e estados de carregamento/erro das telas principais.
- Os workflows `API Dependency Audit` e `Frontend Dependency Audit` executam `npm audit --audit-level=high` semanalmente ou sob demanda.

A auditoria esta marcada como informativa nesta etapa (`continue-on-error`) porque o projeto ainda possui vulnerabilidades conhecidas que precisam ser avaliadas individualmente. Isso evita esconder o problema e, ao mesmo tempo, nao interrompe o deploy atual sem uma analise de compatibilidade.

## Proxima evolucao

Quando houver ambientes separados, o proximo passo sera adicionar aprovacao manual para producao e executar migrations controladas antes do start da API.
