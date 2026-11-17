# Diretriz de Versões e Documentação: Context7 MCP (Backend API)

1. **Consulta Obrigatória de Dependências:**
   - Sempre consulte a documentação oficial atualizada no **Context7 MCP** (`https://context7.com/`) antes de introduzir novos padrões ou alterar implementações de bibliotecas no backend.
   - Ferramentas MCP disponíveis: `resolve-library-id` e `query-docs`.

2. **Padrões Críticos do Backend (NossoSaldo API):**
   - **Express 5:** Verifique o suporte a async errors e não introduza middlewares legados de Express 4 incompatíveis.
   - **Prisma 7:** Utilize a sintaxe correta de adaptadores de banco de dados (`@prisma/adapter-pg` e `@prisma/adapter-mariadb`).
   - **Jest 30 & TypeScript 6:** Garanta compatibilidade com as regras de tipagem estrita do projeto.
