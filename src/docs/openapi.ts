const serverUrl = process.env.APP_URL ?? "http://localhost:3000";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NossoSaldo API",
    version: "1.0.0",
    description: "Documentacao das rotas da API do NossoSaldo.",
  },
  servers: [
    {
      url: serverUrl,
      description: "Servidor principal",
    },
  ],
  tags: [
    { name: "Health", description: "Verificacao de saude da API" },
    { name: "Auth", description: "Autenticacao e fluxos de acesso" },
    { name: "Usuarios", description: "Operacoes relacionadas a usuarios" },
    { name: "Categorias", description: "Operacoes relacionadas a categorias" },
    { name: "Contas Conjuntas", description: "Operacoes relacionadas a contas conjuntas" },
    { name: "Gastos", description: "Operacoes relacionadas a gastos" },
    { name: "Cartoes de Credito", description: "Operacoes relacionadas a cartoes de credito" },
    { name: "Faturas", description: "Operacoes relacionadas a faturas de cartao" },
    { name: "Relatorios", description: "Operacoes relacionadas a relatorios" },
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
      SuccessEnvelope: {
        type: "object",
        properties: {
          data: {},
          meta: {
            type: "object",
            additionalProperties: true,
          },
        },
        required: ["data"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "BAD_REQUEST" },
              message: { type: "string", example: "Erro na requisicao." },
              details: {
                type: "array",
                items: { type: "string" },
                nullable: true,
              },
            },
            required: ["code", "message"],
          },
          requestId: { type: "string", example: "99baf4fb-6573-47bd-9e89-c989707ac0de" },
        },
        required: ["error", "requestId"],
      },
      HealthResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "API 'NossoSaldo' funcionando corretamente.",
          },
        },
        required: ["message"],
      },
      MessageData: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operacao realizada com sucesso." },
        },
        required: ["message"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", minLength: 6, example: "senha123" },
        },
        required: ["email", "senha"],
      },
      LoginResponseData: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." },
          tokenType: { type: "string", example: "Bearer" },
          expiresIn: { type: "integer", example: 3600 },
        },
        required: ["accessToken", "tokenType", "expiresIn"],
      },
      CreateUsuarioRequest: {
        type: "object",
        properties: {
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          senha: { type: "string", minLength: 6, example: "senha123" },
        },
        required: ["nome", "email", "senha"],
      },
      UpdateUsuarioRequest: {
        type: "object",
        properties: {
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
        },
      },
      UpdateSenhaRequest: {
        type: "object",
        properties: {
          senha: { type: "string", minLength: 6, example: "novaSenha123" },
        },
        required: ["senha"],
      },
      SolicitarResetSenhaRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "joao@example.com" },
        },
        required: ["email"],
      },
      RedefinirSenhaComTokenRequest: {
        type: "object",
        properties: {
          token: { type: "string", example: "token-de-recuperacao" },
          senha: { type: "string", minLength: 6, example: "novaSenha123" },
        },
        required: ["token", "senha"],
      },
      ValidarEmailRequest: {
        type: "object",
        properties: {
          token: { type: "string", example: "token-de-validacao" },
        },
        required: ["token"],
      },
      Usuario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string", example: "Joao Silva" },
          email: { type: "string", format: "email", example: "joao@example.com" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nome", "email"],
      },
      Categoria: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          descricao: { type: "string", example: "Alimentacao" },
          iconName: { type: "string", example: "tag" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "descricao"],
      },
      CreateCategoriaRequest: {
        type: "object",
        properties: {
          descricao: { type: "string", minLength: 2, maxLength: 50, example: "Alimentacao" },
          iconName: { type: "string", example: "tag" },
        },
        required: ["descricao"],
      },
      ContaConjunta: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nomeConta: { type: "string", example: "Casa" },
          usuario1Id: { type: "string", format: "uuid" },
          usuario2Id: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nomeConta", "usuario1Id", "usuario2Id"],
      },
      CreateContaConjuntaRequest: {
        type: "object",
        properties: {
          nomeConta: { type: "string", example: "Casa" },
          usuarioConjunto: { type: "string", example: "parceiro@example.com" },
        },
        required: ["nomeConta", "usuarioConjunto"],
      },
      Gasto: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          descricao: { type: "string", example: "Netflix" },
          tipo: { type: "string", enum: ["receita", "despesa"] },
          status: { type: "string", enum: ["pendente", "pago", "atrasado", "cancelado"] },
          origemLancamento: { type: "string", enum: ["unico", "recorrente", "parcelado"] },
          numeroParcelas: { type: "integer", example: 1 },
          naoCompartilhar: { type: "boolean", example: false },
          valor: { type: "number", example: 39.9 },
          competencia: { type: "string", format: "date-time", nullable: true },
          dataVencimento: { type: "string", format: "date-time", nullable: true },
          dataPagamento: { type: "string", format: "date-time", nullable: true },
          observacao: { type: "string", nullable: true },
          categoriaId: { type: "string", format: "uuid" },
          responsavelId: { type: "string", format: "uuid" },
          cartaoCreditoId: { type: "string", format: "uuid", nullable: true },
          faturaCartaoId: { type: "string", format: "uuid", nullable: true },
          recorrenciaPaiId: { type: "string", format: "uuid", nullable: true },
          dataInicioRecorrencia: { type: "string", format: "date-time", nullable: true },
          dataFimRecorrencia: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "descricao", "tipo", "status", "origemLancamento", "valor", "categoriaId", "responsavelId"],
      },
      CreateGastoRequest: {
        type: "object",
        properties: {
          descricao: { type: "string", example: "Netflix" },
          tipo: { type: "string", enum: ["receita", "despesa"] },
          status: { type: "string", enum: ["pendente", "pago", "atrasado", "cancelado"] },
          origemLancamento: { type: "string", enum: ["unico", "recorrente", "parcelado"] },
          numeroParcelas: { type: "integer", minimum: 1, example: 1 },
          naoCompartilhar: { type: "boolean", example: false },
          valor: { type: "number", example: 39.9 },
          competencia: { type: "string", format: "date-time", nullable: true },
          dataVencimento: { type: "string", format: "date-time", nullable: true },
          dataPagamento: { type: "string", format: "date-time", nullable: true },
          observacao: { type: "string", nullable: true },
          categoriaId: { type: "string", format: "uuid" },
          cartaoCreditoId: { type: "string", format: "uuid", nullable: true },
          dataFimRecorrencia: { type: "string", format: "date-time", nullable: true },
        },
        required: ["descricao", "tipo", "status", "origemLancamento", "valor", "categoriaId"],
      },
      UpdateGastoRequest: {
        type: "object",
        properties: {
          descricao: { type: "string", example: "Mercado do mes" },
          tipo: { type: "string", enum: ["receita", "despesa"] },
          status: { type: "string", enum: ["pendente", "pago", "atrasado", "cancelado"] },
          origemLancamento: { type: "string", enum: ["unico", "recorrente", "parcelado"] },
          numeroParcelas: { type: "integer", minimum: 1, example: 3 },
          naoCompartilhar: { type: "boolean", example: false },
          valor: { type: "number", example: 250.75 },
          competencia: { type: "string", format: "date-time", nullable: true },
          dataVencimento: { type: "string", format: "date-time", nullable: true },
          dataPagamento: { type: "string", format: "date-time", nullable: true },
          observacao: { type: "string", nullable: true },
          categoriaId: { type: "string", format: "uuid" },
          cartaoCreditoId: { type: "string", format: "uuid", nullable: true },
          dataFimRecorrencia: { type: "string", format: "date-time", nullable: true },
        },
      },
      PagarRequest: {
        type: "object",
        properties: {
          dataPagamento: { type: "string", format: "date-time", nullable: true },
        },
      },
      CartaoCredito: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          descricao: { type: "string", example: "Nubank" },
          diaFechamento: { type: "integer", example: 10 },
          diaVencimento: { type: "integer", example: 17 },
          valorLimite: { type: "number", example: 5000 },
          observacoes: { type: "string", nullable: true },
          usuarioId: { type: "string", format: "uuid" },
        },
        required: ["id", "descricao", "diaFechamento", "diaVencimento", "valorLimite", "usuarioId"],
      },
      CartaoCreditoRequest: {
        type: "object",
        properties: {
          descricao: { type: "string", minLength: 2, maxLength: 80, example: "Nubank" },
          diaFechamento: { type: "integer", minimum: 1, maximum: 31, example: 10 },
          diaVencimento: { type: "integer", minimum: 1, maximum: 31, example: 17 },
          valorLimite: { type: "number", example: 5000 },
          observacoes: { type: "string", nullable: true },
        },
        required: ["descricao", "diaFechamento", "diaVencimento", "valorLimite"],
      },
      FaturaCartao: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          cartaoCreditoId: { type: "string", format: "uuid" },
          competencia: { type: "string", example: "2026-05" },
          dataAbertura: { type: "string", format: "date-time" },
          dataFechamento: { type: "string", format: "date-time" },
          dataVencimento: { type: "string", format: "date-time" },
          valorTotal: { type: "number", example: 230.9 },
          status: { type: "string", example: "aberta" },
          dataPagamento: { type: "string", format: "date-time", nullable: true },
        },
        required: ["id", "cartaoCreditoId", "competencia", "dataAbertura", "dataFechamento", "dataVencimento", "valorTotal", "status"],
      },
      EvolucaoMensalItem: {
        type: "object",
        properties: {
          referencia: { type: "string", example: "2026-05" },
          total_gasto: { type: "number", example: 1250.5 },
        },
      },
      ComparativoMensal: {
        type: "object",
        properties: {
          mesAtual: { type: "number", example: 1250.5 },
          mesAnterior: { type: "number", example: 980.3 },
          variacao: { type: "string", example: "+27.6%" },
        },
      },
      TopCategoriaItem: {
        type: "object",
        properties: {
          categoria: { type: "string", example: "Moradia" },
          total_gasto: { type: "number", example: 1800 },
        },
      },
      QuemGastaMais: {
        type: "object",
        properties: {
          usuario1: {
            type: "object",
            properties: {
              nome: { type: "string", example: "Joao" },
              total: { type: "number", example: 900 },
              percentual: { type: "integer", example: 60 },
            },
          },
          usuario2: {
            type: "object",
            properties: {
              nome: { type: "string", example: "Maria" },
              total: { type: "number", example: 600 },
              percentual: { type: "integer", example: 40 },
            },
          },
        },
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
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso",
            content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessEnvelope" }, { properties: { data: { $ref: "#/components/schemas/LoginResponseData" } } }] } } },
          },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Credenciais invalidas", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios/esqueci-senha": {
      post: {
        tags: ["Auth"],
        summary: "Solicita o email de redefinicao de senha",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SolicitarResetSenhaRequest" } } },
        },
        responses: {
          "202": { description: "Solicitacao aceita" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios/solicitarRedefinicaoSenha": {
      post: {
        tags: ["Auth"],
        summary: "Solicita o email de redefinicao de senha",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SolicitarResetSenhaRequest" } } },
        },
        responses: {
          "202": { description: "Solicitacao aceita" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios/redefinir-senha/validar": {
      get: {
        tags: ["Auth"],
        summary: "Valida token de recuperacao e redireciona",
        parameters: [
          { in: "query", name: "token", required: true, schema: { type: "string" }, description: "Token de recuperacao" },
        ],
        responses: {
          "302": { description: "Token valido e redirecionamento realizado" },
          "400": { description: "Token invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios/redefinir-senha": {
      patch: {
        tags: ["Auth"],
        summary: "Redefine a senha com token valido",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RedefinirSenhaComTokenRequest" } } },
        },
        responses: {
          "200": { description: "Senha redefinida com sucesso" },
          "400": { description: "Payload ou token invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios/validar-email": {
      patch: {
        tags: ["Auth"],
        summary: "Valida o email com token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ValidarEmailRequest" } } },
        },
        responses: {
          "200": { description: "Email validado com sucesso" },
          "400": { description: "Token invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios": {
      get: {
        tags: ["Usuarios"],
        summary: "Lista usuarios",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": { description: "Lista de usuarios" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        tags: ["Usuarios"],
        summary: "Cria um usuario",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUsuarioRequest" } } },
        },
        responses: {
          "201": { description: "Usuario criado com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Usuario ja cadastrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      patch: {
        tags: ["Usuarios"],
        summary: "Atualiza o usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUsuarioRequest" } } },
        },
        responses: {
          "200": { description: "Usuario atualizado com sucesso" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Usuario nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/usuarios/listarUsuarioPorId": {
      get: {
        tags: ["Usuarios"],
        summary: "Busca o usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": { description: "Usuario encontrado" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Usuario nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSenhaRequest" } } },
        },
        responses: {
          "200": { description: "Senha atualizada com sucesso" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Usuario nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/categorias": {
      get: {
        tags: ["Categorias"],
        summary: "Lista categorias",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": { description: "Lista de categorias" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        tags: ["Categorias"],
        summary: "Cria uma categoria",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCategoriaRequest" } } },
        },
        responses: {
          "201": { description: "Categoria criada com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateContaConjuntaRequest" } } },
        },
        responses: {
          "201": { description: "Conta conjunta criada com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "409": { description: "Conflito ao criar conta conjunta", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/contaConjunta": {
      get: {
        tags: ["Contas Conjuntas"],
        summary: "Lista contas conjuntas do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": { description: "Lista de contas conjuntas" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/contaConjunta/{id}": {
      delete: {
        tags: ["Contas Conjuntas"],
        summary: "Desvincula uma conta conjunta",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Conta conjunta desvinculada com sucesso" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Nao autorizado a desvincular", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Conta conjunta nao encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/gastos/total/mes-atual": {
      get: {
        tags: ["Gastos"],
        summary: "Retorna o total gasto no mes atual",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": { description: "Total gasto no mes atual" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Usuario nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/gastos": {
      get: {
        tags: ["Gastos"],
        summary: "Lista gastos do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "query", name: "competencia", required: false, schema: { type: "string", example: "2026-05" } },
          { in: "query", name: "de", required: false, schema: { type: "string", format: "date" } },
          { in: "query", name: "ate", required: false, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "Lista de gastos" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/gastosUsuarioLogado": {
      post: {
        tags: ["Gastos"],
        summary: "Cria um gasto para o usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateGastoRequest" } } },
        },
        responses: {
          "201": { description: "Gasto criado com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/gastos/{id}": {
      get: {
        tags: ["Gastos"],
        summary: "Detalha um gasto pelo ID",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Gasto encontrado" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Gasto nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      patch: {
        tags: ["Gastos"],
        summary: "Atualiza um gasto pelo ID",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateGastoRequest" } } },
        },
        responses: {
          "200": { description: "Gasto atualizado com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Gasto nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      delete: {
        tags: ["Gastos"],
        summary: "Exclui um gasto pelo ID",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Gasto excluido com sucesso" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Gasto nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/pagarGastos/{id}/pagamento": {
      patch: {
        tags: ["Gastos"],
        summary: "Marca um gasto como pago",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PagarRequest" } } },
        },
        responses: {
          "200": { description: "Gasto pago com sucesso" },
          "400": { description: "Operacao invalida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Gasto nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/pagarGastos/{id}/reabertura": {
      patch: {
        tags: ["Gastos"],
        summary: "Reabre um gasto pago",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Gasto reaberto com sucesso" },
          "400": { description: "Operacao invalida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Gasto nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/lancamentosBase/{id}/pagamento": {
      patch: {
        tags: ["Gastos"],
        summary: "Marca uma parcela como paga",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PagarRequest" } } },
        },
        responses: {
          "200": { description: "Parcela paga com sucesso" },
          "400": { description: "Operacao invalida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Parcela nao encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/cartoesCredito": {
      get: {
        tags: ["Cartoes de Credito"],
        summary: "Lista cartoes de credito do usuario autenticado",
        security: [{ AccessTokenAuth: [] }],
        responses: {
          "200": { description: "Lista de cartoes" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        tags: ["Cartoes de Credito"],
        summary: "Cria um cartao de credito",
        security: [{ AccessTokenAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CartaoCreditoRequest" } } },
        },
        responses: {
          "201": { description: "Cartao criado com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/cartoesCredito/{id}": {
      patch: {
        tags: ["Cartoes de Credito"],
        summary: "Atualiza um cartao de credito",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CartaoCreditoRequest" } } },
        },
        responses: {
          "200": { description: "Cartao atualizado com sucesso" },
          "400": { description: "Payload invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "403": { description: "Sem permissao", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Cartao nao encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/faturasCartao": {
      get: {
        tags: ["Faturas"],
        summary: "Lista faturas de cartao",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "query", name: "cartaoCreditoId", required: false, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Lista de faturas" },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/faturasCartao/{id}/pagamento": {
      patch: {
        tags: ["Faturas"],
        summary: "Quita uma fatura de cartao",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PagarRequest" } } },
        },
        responses: {
          "200": { description: "Fatura quitada com sucesso" },
          "400": { description: "Operacao invalida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Fatura nao encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/faturasCartao/{id}/reabertura": {
      patch: {
        tags: ["Faturas"],
        summary: "Reabre uma fatura de cartao",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Fatura reaberta com sucesso" },
          "400": { description: "Operacao invalida", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Fatura nao encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/relatorio/evolucaoMensal/{de}/{ate}": {
      get: {
        tags: ["Relatorios"],
        summary: "Gera relatorio de evolucao mensal",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "de", required: true, schema: { type: "string", format: "date" } },
          { in: "path", name: "ate", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "Relatorio gerado com sucesso" },
          "400": { description: "Periodo invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/relatorio/comparativoMensal/{mesAtual}/{mesAnterior}": {
      get: {
        tags: ["Relatorios"],
        summary: "Gera relatorio comparativo mensal",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "mesAtual", required: true, schema: { type: "string", example: "2026-05-31" } },
          { in: "path", name: "mesAnterior", required: true, schema: { type: "string", example: "2026-04-01" } },
        ],
        responses: {
          "200": { description: "Relatorio gerado com sucesso" },
          "400": { description: "Periodo invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/relatorio/topCategoria/{de}/{ate}": {
      get: {
        tags: ["Relatorios"],
        summary: "Gera relatorio de top categorias",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "de", required: true, schema: { type: "string", format: "date" } },
          { in: "path", name: "ate", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "Relatorio gerado com sucesso" },
          "400": { description: "Periodo invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/relatorio/quemGastaMais/{de}/{ate}": {
      get: {
        tags: ["Relatorios"],
        summary: "Gera relatorio de quem gasta mais",
        security: [{ AccessTokenAuth: [] }],
        parameters: [
          { in: "path", name: "de", required: true, schema: { type: "string", format: "date" } },
          { in: "path", name: "ate", required: true, schema: { type: "string", format: "date" } },
        ],
        responses: {
          "200": { description: "Relatorio gerado com sucesso" },
          "400": { description: "Periodo invalido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Nao autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Conta conjunta nao encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
  },
} as const;
