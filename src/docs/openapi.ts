const serverUrl = process.env.APP_URL ?? "http://localhost:3000";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NossoSaldo API",
    version: "1.0.0",
    description: "Documentação atualizada da API do NossoSaldo.",
  },
  servers: [
    {
      url: serverUrl,
      description: "Servidor principal",
    },
  ],
  tags: [
    { name: "Health", description: "Verificação de saúde da API" },
    { name: "Auth", description: "Autenticação de usuários" },
    { name: "Usuários", description: "Operações relacionadas a usuários" },
    { name: "Categorias", description: "Operações relacionadas a categorias" },
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
            example: "API 'NossoSaldo' está funcionando corretamente",
          },
        },
        required: ["message"],
      },
      CreateUsuarioRequest: {
        type: "object",
        properties: {
          nome: { type: "string", example: "João Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", minLength: 6, maxLength: 50, example: "senha123" },
        },
        required: ["nome", "email", "senha"],
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
          descricao: { type: "string", minLength: 2, maxLength: 50, example: "Alimentação" },
        },
        required: ["descricao"],
      },
      UsuarioCreatedResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "9f1f0dd2-5453-4bb7-85ff-3e911b25b290" },
          nome: { type: "string", example: "João Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", example: "$2a$10$hash-da-senha" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nome", "email", "senha", "createdAt", "updatedAt"],
      },
      UsuarioListItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "9f1f0dd2-5453-4bb7-85ff-3e911b25b290" },
          nome: { type: "string", example: "João Silva" },
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
          id: { type: "integer", example: 1 },
          descricao: { type: "string", example: "Alimentação" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "descricao"],
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
                example: ["O email é inválido.", "A senha deve ter pelo menos 6 caracteres."],
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
        summary: "Verifica se a API está online",
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
        summary: "Autentica um usuário",
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
            description: "Erro de validação no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Credenciais inválidas",
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
    "/usuario": {
      get: {
        tags: ["Usuários"],
        summary: "Busca o usuário autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Usuário encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsuarioListItem" },
              },
            },
          },
          "401": {
            description: "Token ausente ou inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Usuário não encontrado",
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
        tags: ["Usuários"],
        summary: "Cria um novo usuário",
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
            description: "Usuário criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsuarioCreatedResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validação no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description: "Usuário já cadastrado",
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
        tags: ["Usuários"],
        summary: "Lista os usuários cadastrados",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/UsuarioListItem" },
                },
              },
            },
          },
          "401": {
            description: "Token ausente ou inválido",
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
            description: "Erro de validação no payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Token ausente ou inválido",
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
            description: "Token ausente ou inválido",
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
