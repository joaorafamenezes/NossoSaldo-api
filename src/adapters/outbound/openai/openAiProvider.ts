import createHttpError from "http-errors";
import { LlmFunctionRequest, LlmProviderPort, LlmRequest } from "../../../ports/outbound/llmProviderPort";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    name?: string;
    arguments?: string;
    call_id?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

type OpenAiErrorResponse = {
  error?: {
    code?: string;
    type?: string;
  };
};

async function throwProviderError(response: Response): Promise<never> {
  const payload = await response.json().catch(() => null) as OpenAiErrorResponse | null;
  const code = payload?.error?.code ?? payload?.error?.type;

  if (response.status === 401 || response.status === 403 || code === "invalid_api_key") {
    throw createHttpError(502, "A chave da OpenAI foi rejeitada. Verifique se ela esta ativa e pertence ao projeto correto.");
  }

  if (response.status === 429) {
    throw createHttpError(502, "A OpenAI informou que o limite de uso ou os creditos do projeto foram excedidos.");
  }

  if (response.status === 404) {
    throw createHttpError(502, "O modelo selecionado nao esta disponivel para esta chave da OpenAI.");
  }

  throw createHttpError(502, "A OpenAI rejeitou a consulta. Verifique a configuracao do provedor e tente novamente.");
}

const systemInstructions = [
  "Voce e o assistente financeiro inteligente e operacional do NossoSaldo.",
  "Responda em portugues do Brasil, de forma objetiva, amigavel, clara e didatica.",
  "Voce tem total permissao para consultar e executar acoes operacionais financeiras solicitadas pelo usuario.",
  "Quando o usuario pedir para cadastrar, registrar ou adicionar um gasto ou receita (ex: 'comprei 50 no mercado', 'cadastre despesa'), execute a ferramenta criar_gasto.",
  "Quando pedir para alterar, editar ou atualizar um gasto (ex: 'mude o valor da farmacia para 80'), execute alterar_gasto.",
  "Quando pedir para pagar, quitar ou dar baixa em um gasto (ex: 'pague a conta de luz'), execute pagar_gasto.",
  "Quando pedir para desfazer pagamento ou reabrir um gasto (ex: 'desfaca o pagamento da internet'), execute desfazer_pagamento_gasto.",
  "Quando pedir para excluir ou remover um gasto, execute excluir_gasto.",
  "Quando pedir informacoes ou gerenciamento de categorias, execute listar_categorias, criar_categoria ou alterar_categoria.",
  "Quando pedir informacoes sobre cartoes de credito, limites ou dias de fechamento/vencimento, execute consultar_cartoes.",
  "Quando pedir informacoes sobre faturas ou valores de faturas, execute consultar_faturas_cartao ou consultar_gastos_fatura.",
  "Quando pedir para pagar a fatura de um cartao, execute pagar_fatura_cartao.",
  "Quando pedir para reabrir uma fatura de cartao, execute reabrir_fatura_cartao.",
  "Para perguntas de listagem de compras, registros ou parcelas, use listar_gastos antes de responder.",
  "Para perguntas de totais e somas, use resumo_financeiro; para distribuicao por categoria, use top_categorias.",
  "Em contas conjuntas, voce tem acesso aos lancamentos de ambos os membros do casal (o campo 'responsavel' indica quem realizou ou a quem pertence o lancamento). Para perguntas comparativas ou sobre gastos de um parceiro especifico (ex: 'gastos da Cinthia', 'gastos do Joao', 'quem gastou mais'), use as ferramentas filtrando pelo parametro responsavel.",
  "Nunca invente valores, IDs ou registros que nao foram retornados pelas ferramentas.",
  "Apos executar qualquer acao, confirme claramente ao usuario o que foi realizado com os detalhes principais (nome, valor, data, status).",
  "Para qualquer assunto completamente externo sem relacao com financas ou com o NossoSaldo, recuse educadamente.",
].join(" ");

function buildSystemInstructions() {
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
  }).format(new Date());

  return `${systemInstructions} A data atual do NossoSaldo e ${hoje}. Quando o usuario disser hoje, ontem, amanha, atual, este mes ou este ano, use essa data como referencia.`;
}

export class OpenAiProvider implements LlmProviderPort {
  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async responder(request: LlmRequest): Promise<string> {
    if (!this.apiKey) {
      throw createHttpError(503, "O provedor de inteligencia artificial nao esta configurado.");
    }

    const response = await this.fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        instructions: buildSystemInstructions(),
        input: `Pergunta do usuario:\n${request.question}\n\nDados financeiros autorizados:\n${request.context}`,
      }),
    });

    if (!response.ok) await throwProviderError(response);

    const payload = (await response.json()) as OpenAiResponse;
    const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;

    if (!outputText) {
      throw createHttpError(502, "O provedor de inteligencia artificial nao retornou uma resposta valida.");
    }

    return outputText.trim();
  }

  async responderComFuncoes(request: LlmFunctionRequest): Promise<string> {
    if (!this.apiKey) {
      throw createHttpError(503, "O provedor de inteligencia artificial nao esta configurado.");
    }

    const input: unknown[] = [
      ...(request.history ?? []).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: request.question,
      },
    ];

    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      const response = await this.fetcher("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          store: false,
          instructions: buildSystemInstructions(),
          tools: request.tools,
          tool_choice: "auto",
          parallel_tool_calls: false,
          input,
        }),
      });

      if (!response.ok) await throwProviderError(response);

      const payload = (await response.json()) as OpenAiResponse;
      const functionCalls = (payload.output ?? []).filter((item) => item.type === "function_call");

      if (functionCalls.length === 0) {
        const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text")?.text;

        if (!outputText) {
          throw createHttpError(502, "O provedor de inteligencia artificial nao retornou uma resposta valida.");
        }

        return outputText.trim();
      }

      input.push(...(payload.output ?? []));

      for (const functionCall of functionCalls) {
        if (!functionCall.name || !functionCall.call_id || !functionCall.arguments) {
          throw createHttpError(502, "O provedor de inteligencia artificial retornou uma funcao invalida.");
        }

        let result: unknown;
        try {
          result = await request.execute(functionCall.name, functionCall.arguments);
        } catch (error) {
          result = { erro: error instanceof Error ? error.message : "Nao foi possivel executar a consulta." };
        }

        input.push({
          type: "function_call_output",
          call_id: functionCall.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    throw createHttpError(502, "A consulta excedeu o limite de funcoes permitidas.");
  }
}

export const openAiProvider = new OpenAiProvider();
