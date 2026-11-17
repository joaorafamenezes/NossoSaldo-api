# Guia de configuracao da LLM no NossoSaldo

Este guia explica como configurar uma chave de API da OpenAI para usar o assistente financeiro do NossoSaldo.

Atualmente, o NossoSaldo utiliza a OpenAI como provedor. A chave configurada pertence ao usuario e o consumo das consultas e contabilizado no projeto OpenAI associado a essa chave.

## Antes de comecar

Voce precisa de:

- Uma conta na plataforma da OpenAI.
- Acesso a um projeto da API.
- Permissao para criar uma chave nesse projeto.
- Um metodo de pagamento ou credito habilitado, conforme as regras da sua conta OpenAI.
- Acesso ao NossoSaldo com usuario autenticado.

Importante: a assinatura do ChatGPT e a API da OpenAI sao servicos separados. A chave da API nao e a senha da sua conta e nao deve ser compartilhada.

## 1. Acesse a pagina de chaves

1. Abra [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Entre com sua conta OpenAI.
3. Confirme, no seletor da plataforma, se voce esta na organizacao e no projeto corretos.

Para o NossoSaldo, recomendamos criar ou selecionar um projeto exclusivo, por exemplo `NossoSaldo AI`. Projetos permitem separar consumo, limites e acompanhamento de uso.

## 2. Crie uma nova chave

1. Na pagina de API Keys, selecione **Create new secret key**.
2. Informe um nome que identifique o uso, por exemplo `NossoSaldo - usuario Joao`.
3. Se a plataforma oferecer permissoes, prefira uma chave com o menor conjunto de permissoes necessario.
4. Confirme a criacao.
5. Copie a chave imediatamente e guarde-a em um gerenciador de senhas.

A chave completa e exibida somente no momento da criacao. Se voce fechar a tela ou perder a chave, crie outra e substitua a configuracao no NossoSaldo.

## 3. Cadastre a chave no NossoSaldo

1. Entre no NossoSaldo.
2. Abra o menu **Configuracoes**.
3. Localize o cartao **Assistente financeiro**.
4. Cole a chave no campo **Chave da API OpenAI**.
5. Escolha o modelo desejado. Para iniciar, recomendamos `GPT-4.1 mini` por equilibrar custo e capacidade.
6. Clique em **Salvar configuracao**.
7. Aguarde a mensagem de confirmacao **Configuracao da OpenAI salva com sucesso**.

O NossoSaldo nao exibe novamente a chave salva. O sistema mostra apenas se a OpenAI esta configurada e qual modelo esta selecionado.

## 4. Confirme se funcionou

Depois de salvar:

1. Verifique se o indicador mudou para **OpenAI configurada**.
2. Acesse a area de consultas financeiras.
3. Faca uma pergunta simples, como:

   > Qual foi minha maior despesa no periodo atual?

4. Confirme se a resposta considera somente os dados do usuario autenticado.

As consultas sao feitas pela API do NossoSaldo, e nao diretamente pelo navegador. O backend usa a chave configurada para consultar a OpenAI e aplica as funcoes financeiras autorizadas.

## 5. Trocar ou remover a chave

### Trocar a chave

1. Volte para **Configuracoes**.
2. Informe a nova chave no mesmo campo.
3. Clique em **Atualizar chave**.

A nova chave substitui a anterior para aquele usuario.

### Remover a chave

1. Na secao **Assistente financeiro**, clique em **Remover configuracao**.
2. Confirme a operacao.

Depois da remocao, as consultas ficam desativadas ate que uma nova chave seja cadastrada.

## Seguranca obrigatoria

- Nunca envie sua chave por e-mail, chat, chamado ou captura de tela.
- Nunca cole a chave em codigo-fonte, README, planilha ou repositorio Git.
- Nao use a mesma chave em varios sistemas sem necessidade.
- Monitore o uso e defina limites de gasto no projeto OpenAI.
- Se suspeitar que a chave vazou, revogue-a na plataforma OpenAI e crie outra imediatamente.
- Nao use uma chave de producao em ambiente de testes quando puder separar os projetos.

## Problemas comuns

### "A chave da OpenAI parece invalida"

Confira se a chave foi copiada inteira, sem espacos no inicio ou no fim, e se pertence a uma chave de API da plataforma OpenAI.

### "Provedor de IA nao configurado"

A configuracao nao foi salva para o usuario atual ou foi removida. Volte para **Configuracoes** e cadastre uma chave valida.

### "Nao foi possivel consultar o provedor"

Verifique se a chave ainda esta ativa, se o projeto possui acesso ao modelo selecionado, se existe credito disponível e se os limites do projeto nao foram atingidos.

### Perdi minha chave

Por seguranca, a chave completa nao pode ser recuperada pela plataforma. Revogue a chave antiga, crie uma nova e atualize o NossoSaldo.

## Referencias oficiais

- [Where do I find my OpenAI API Key?](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)
- [Managing projects in the API platform](https://help.openai.com/en/articles/9186755-managing-your-work-in-the-api-platform-with-projects)
- [Best practices for API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

