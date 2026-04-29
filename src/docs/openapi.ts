const serverUrl = process.env.APP_URL ?? "http://localhost:3000";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NossoSaldo API",
    version: "1.0.0",
    description: "Documentacao atualizada da API do NossoSaldo.",
  },
  servers: [
    {
      url: serverUrl,
      description: "Servidor principal",
    },
  ],
  tags: [
    { name: "Health", description: "Verificacao de saude da API" },
    { name: "Auth", description: "Autenticacao de usuarios" },
    { name: "Usuarios", description: "Operacoes relacionadas a usuarios" },
    { name: "Categorias", description: "Operacoes relacionadas a categorias" },
    { name: "Contas Conjuntas", description: "Operacoes relacionadas a contas conjuntas" },
    { name: "Gastos", description: "Operacoes relacionadas a gastos" },
  ],
  components: {
    securitySchemes: {
      AccessTokenAuth: {
        type: "apiKey",
        in: "header",
        name: "x-access-token",
        description: "Token JWT enviado no header x-access-token.",
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "API 'NossoSaldo' esta funcionando corretamente",
          },
        },
        required: ["message"],
      },
      CreateUsuarioRequest: {
        type: "object",
        properties: {
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", minLength: 6, maxLength: 50, example: "senha123" },
        },
        required: ["nome", "email", "senha"],
      },
      UpdateUsuarioRequest: {
        type: "object",
        properties: {
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
        },
        required: ["nome", "email"],
      },
      UpdateSenhaRequest: {
        type: "object",
        properties: {
          senha: { type: "string", minLength: 6, maxLength: 50, example: "novaSenha123" },
        },
        required: ["senha"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", minLength: 6, maxLength: 50, example: "senha123" },
        },
        required: ["email", "senha"],
      },
      CreateCategoriaRequest: {
        type: "object",
        properties: {
          descricao: { type: "string", minLength: 2, maxLength: 50, example: "Alimentacao" },
        },
        required: ["descricao"],
      },
      CreateContaConjuntaRequest: {
        type: "object",
        properties: {
          nomeConta: { type: "string", example: "Casa" },
          usuario1Id: { type: "string", format: "uuid", example: "9f1f0dd2-5453-4bb7-85ff-3e911b25b290" },
          usuario2Id: { type: "string", format: "uuid", example: "5fc00ffd-f4c9-4bca-8caa-a679f68f0b22" },
        },
        required: ["nomeConta", "usuario1Id", "usuario2Id"],
      },
      UpdateGastoRequest: {
        type: "object",
        properties: {
          descricao: { type: "string", example: "Mercado do mÃªs" },
          tipo: { type: "string", enum: ["receita", "despesa"] },
          status: { type: "string", enum: ["pendente", "pago", "atrasado", "cancelado"] },
          origemLancamento: { type: "string", enum: ["unico", "recorrente", "parcelado"] },
          valor: { type: "number", example: 250.75 },
          competencia: { type: "string", format: "date-time" },
          dataVencimento: { type: "string", format: "date-time" },
          dataPagamento: { type: "string", format: "date-time" },
          observacao: { type: "string", example: "Atualizado via app" },
          categoriaId: { type: "string", format: "uuid", example: "7c7f7d16-6826-4b9b-82f6-4a68ad1f20d8" },
          contaConjuntaId: { type: "string", format: "uuid", example: "ab7e9d7f-bc99-4720-9678-85d4c342afc0" },
        },
      },
      UsuarioCreatedResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "9f1f0dd2-5453-4bb7-85ff-3e911b25b290" },
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", example: "$2a$10$hash-da-senha" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nome", "email", "senha", "createdAt", "updatedAt"],
      },
      UsuarioResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "9f1f0dd2-5453-4bb7-85ff-3e911b25b290" },
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nome", "email", "createdAt", "updatedAt"],
      },
      LoginSuccessResponse: {
        type: "object",
        properties: {
          auth: { type: "boolean", example: true },
          token: { type: "string", example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." },
        },
        required: ["auth", "token"],
      },
      CategoriaResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "7c7f7d16-6826-4b9b-82f6-4a68ad1f20d8" },
          descricao: { type: "string", example: "Alimentacao" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "descricao", "createdAt", "updatedAt"],
      },
      ContaConjuntaResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "ab7e9d7f-bc99-4720-9678-85d4c342afc0" },
          nomeConta: { type: "string", example: "Casa" },
          usuario1Id: { type: "string", format: "uuid", example: "9f1f0dd2-5453-4bb7-85ff-3e911b25b290" },
          usuario2Id: { type: "string", format: "uuid", example: "5fc00ffd-f4c9-4bca-8caa-a679f68f0b22" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nomeConta", "usuario1Id", "usuario2Id", "createdAt", "updatedAt"],
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Senha atualizada com sucesso" },
        },
        required: ["message"],
      },
      TotalGastoMesAtualResponse: {
        type: "object",
        properties: {
          referencia: { type: "string", example: "2026-04" },
          totalGastoMesAtual: { type: "number", example: 1250.5 },
        },
        required: ["referencia", "totalGastoMesAtual"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Erro interno no servidor." },
          requestId: { type: "string", example: "99baf4fb-6573-47bd-9e89-c989707ac0de" },
        },
        required: ["status", "message", "requestId"],
      },
      ValidationErrorResponse: {
        allOf: [
          { $ref: "#/components/schemas/ErrorResponse" },
          {
            type: "object",
            properties: {
              details: {
                type: "array",
                items: { type: "string" },
                example: ["O email e invalido.", "A senha deve ter pelo menos 6 caracteres."],
              },
            },
            required: ["details"],
          },
        ],
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verifica se a API esta online",
        responses: {
          "200": {
            description: "API funcionando corretamente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/login": {
      post: {
        tags: ["Auth"],
        summary: "Autentica um usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Credenciais invalidas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno ao autenticar",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/usuarios/listarUsuarioPorId": {
      get: {
        tags: ["Usuarios"],
        summary: "Busca o usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Usuario encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsuarioResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuario nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Lista os usuarios cadastrados",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Lista de usuarios",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UsuarioResponse" },
                },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Cria um novo usuario",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUsuarioRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsuarioCreatedResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Usuario ja cadastrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Usuarios"],
        summary: "Atualiza os dados do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUsuarioRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Usuario atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsuarioResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuario nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/usuarios/atualizaSenha": {
      patch: {
        tags: ["Usuarios"],
        summary: "Atualiza a senha do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateSenhaRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Senha atualizada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuario nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/categoria": {
      post: {
        tags: ["Categorias"],
        summary: "Cria uma nova categoria",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCategoriaRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Categoria criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CategoriaResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/categorias": {
      get: {
        tags: ["Categorias"],
        summary: "Lista todas as categorias",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Lista de categorias",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CategoriaResponse" },
                },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/criarContaConjunta": {
      post: {
        tags: ["Contas Conjuntas"],
        summary: "Cria uma conta conjunta",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateContaConjuntaRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Conta conjunta criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContaConjuntaResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Um ou ambos os usuarios nao foram encontrados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "A conta conjunta ja existe para esses usuarios",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/conta-conjunta": {
      get: {
        tags: ["Contas Conjuntas"],
        summary: "Lista as contas conjuntas do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Lista de contas conjuntas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ContaConjuntaResponse" },
                },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuario nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/gastos/total/mes-atual": {
      get: {
        tags: ["Gastos"],
        summary: "Retorna o total gasto no mes atual do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Total gasto no mes atual",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TotalGastoMesAtualResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuario nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/gastos/{id}": {
      patch: {
        tags: ["Gastos"],
        summary: "Atualiza um gasto do usuario autenticado pelo ID",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "ID do gasto a ser atualizado",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateGastoRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Gasto atualizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          },
          "400": {
            description: "Erro de validacao no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Usuario nao autorizado a atualizar este gasto",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Gasto nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Gastos"],
        summary: "Exclui um gasto do usuario autenticado pelo ID",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "ID do gasto a ser excluido",
          },
        ],
        responses: {
          "200": {
            description: "Gasto marcado como excluido com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "403": {
            description: "Usuario nao autorizado a excluir este gasto",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Gasto nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Erro interno",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
} as const;
