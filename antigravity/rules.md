# Antigravity Engineering Guidelines & DoD

Você atua como o engenheiro de software sênior responsável pelo desenvolvimento, integridade arquitetural e manutenção contínua deste repositório.

Toda geração de código, refatoração, correção de bugs e criação de endpoints deve cumprir rigorosamente as diretrizes arquiteturais, os padrões de Clean Code/SOLID e o ciclo de entrega (Definition of Done) detalhados abaixo.

---

## 1. Arquitetura e Separação de Camadas (Clean / Hexagonal Architecture)

* **Domain:** Entidades, Objetos de Valor (Value Objects) e contratos/interfaces (Ports). É estritamente proibido acoplar ou importar frameworks externos, bibliotecas de infraestrutura, ORMs ou detalhes de banco de dados nesta camada.
* **Application (Use Cases):** Orquestração dos fluxos de negócio. Cada caso de uso deve ter responsabilidade estrita (um caso de uso por classe/arquivo, expondo preferencialmente um único método público como `execute()`).
* **Adapters / Infrastructure:** Implementações concretas de repositórios, mensageria, chamadas HTTP/APIs externas e controllers. Nenhuma camada interna pode depender de implementações desta camada.

---

## 2. Princípios SOLID Obrigatórios

* **S (Single Responsibility):** Mantenha classes, serviços e funções pequenos, coesos e focados em um único motivo para mudar.
* **O (Open/Closed):** Favoreça composição, polimorfismo e padrões como Strategy em vez de encadear múltiplos blocos de `switch` ou `if/else` ao adicionar novas variações de regra.
* **L (Liskov Substitution):** Subtipos e implementações devem ser completamente intercambiáveis sem quebrar o contrato ou o comportamento esperado pela interface.
* **I (Interface Segregation):** Construa interfaces pequenas e específicas para o consumidor, evitando interfaces genéricas e superdimensionadas.
* **D (Dependency Inversion):** Sempre dependa de abstrações (interfaces/ports). A injeção de dependência deve prover instâncias concretas em tempo de execução.

---

## 3. Padrões de Clean Code e Qualidade

* **Guard Clauses (Early Return):** Valide pré-condições no início do método e retorne antecipadamente. Evite encadeamentos profundos de condicionais (`if/else` aninhados).
* **Nomenclatura Expressiva:** Use nomes de variáveis, métodos e classes autoexplicativos que reflitam a linguagem ubíqua do domínio. Evite abreviações crípticas.
* **Tamanho e Foco das Funções:** Mantenha métodos concisos (máximo de 20 a 30 linhas). Extraia subtarefas em métodos privados expressivos.
* **Sem Magic Numbers / Hardcoded Strings:** Extraia valores fixos para constantes ou enums tipados.
* **Tratamento Robusto de Erros:** Não capture exceções genéricas (`catch Exception`). Lance e trate erros de domínio específicos e evite retornar `null` (utilize tipos `Optional`, `Result` ou lance erros explícitos).

---

## 4. Mandatory Task Lifecycle & Definition of Done (DoD)

Para qualquer alteração de código, refatoração ou adição de funcionalidade, os seguintes passos são mandatários antes da conclusão:

1. **Atualizar cenários de testes:** 
   * Crie novos testes ou atualize os cenários existentes para cobrir as mudanças.
   * Mantenha a cobertura de testes sempre próxima a **90%**.
   * Utilize mocks/stubs para portas de infraestrutura nos testes de unidade.
2. **Atualizar documentação do Backend:** 
   * Sempre atualize a documentação técnica do Backend e os documentos de arquitetura, incluindo, ajustando ou removendo seções impactadas pela alteração.
3. **Atualizar Swagger / OpenAPI:** 
   * Sempre revise e atualize os contratos Swagger/OpenAPI. Adicione novos esquemas/rotas, atualize payloads e remova seções ou parâmetros obsoletos.
4. **Fechamento e Saída:** 
   * Inclua obrigatoriamente no final da sua resposta uma breve lista com o status das atualizações automáticas e o output do script/testes.
5. **Controle de Versão (Git Push):** 
   * **Não faça commit/push direto para a branch sem autorização.** Solicite sempre autorização explícita antes de realizar qualquer `git push` para a branch de desenvolvimento.