import { OpenAiProvider } from "./openAiProvider";

describe("OpenAiProvider", () => {
  it("envia uma consulta sem armazenar a resposta e retorna output_text", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: "Resposta segura" }),
    });
    const provider = new OpenAiProvider("test-key", "test-model", fetcher);

    await expect(provider.responder({ question: "Quanto gastei?", context: "{}" })).resolves.toBe("Resposta segura");

    expect(fetcher).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      body: expect.stringContaining('"store":false'),
    }));
  });

  it("nao permite consulta sem chave configurada", async () => {
    const provider = new OpenAiProvider(undefined, "test-model", jest.fn());

    await expect(provider.responder({ question: "Teste", context: "{}" })).rejects.toMatchObject({ statusCode: 503 });
  });

  it("informa quando a OpenAI rejeita a chave configurada", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: "invalid_api_key" } }),
    });
    const provider = new OpenAiProvider("test-key", "test-model", fetcher);

    await expect(provider.responder({ question: "Quanto gastei?", context: "{}" })).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining("chave da OpenAI foi rejeitada"),
    });
  });

  it("executa apenas a funcao autorizada pelo aplicativo e envia o resultado ao modelo", async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          output: [{ type: "function_call", name: "resumo_financeiro", call_id: "call-1", arguments: "{}" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ output_text: "Seu resumo" }),
      });
    const provider = new OpenAiProvider("test-key", "test-model", fetcher);
    const execute = jest.fn().mockResolvedValue({ despesa: 100 });

    await expect(provider.responderComFuncoes?.({
      question: "Como estou?",
      tools: [],
      execute,
    })).resolves.toBe("Seu resumo");

    expect(execute).toHaveBeenCalledWith("resumo_financeiro", "{}");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1][1].body).toContain("function_call_output");
  });

  it.each([
    [403, { error: { type: "forbidden" } }, "chave da OpenAI foi rejeitada"],
    [404, { error: { code: "model_not_found" } }, "modelo selecionado"],
    [429, { error: { type: "rate_limit" } }, "limite de uso"],
    [500, null, "rejeitou a consulta"],
  ])("mapeia erros HTTP %s do provedor", async (status, payload, message) => {
    const fetcher = jest.fn().mockResolvedValue({ ok: false, status, json: async () => payload });
    const provider = new OpenAiProvider("test-key", "test-model", fetcher);

    await expect(provider.responder({ question: "Quanto gastei?", context: "{}" })).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining(message),
    });
  });

  it("aceita texto no formato alternativo de output e remove espacos", async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output: [{ content: [{ type: "output_text", text: "  resposta alternativa  " }] }] }),
    });
    const provider = new OpenAiProvider("test-key", "test-model", fetcher);

    await expect(provider.responder({ question: "Quanto gastei?", context: "{}" })).resolves.toBe("resposta alternativa");
  });

  it("recusa resposta sem texto e consulta por funcoes sem chave", async () => {
    const provider = new OpenAiProvider("test-key", "test-model", jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await expect(provider.responder({ question: "Quanto gastei?", context: "{}" })).rejects.toMatchObject({ statusCode: 502 });

    const withoutKey = new OpenAiProvider(undefined, "test-model", jest.fn());
    await expect(withoutKey.responderComFuncoes({ question: "Quanto gastei?", tools: [], execute: jest.fn() })).rejects.toMatchObject({ statusCode: 503 });

    const functionProvider = new OpenAiProvider("test-key", "test-model", jest.fn().mockResolvedValue({ ok: true, json: async () => ({ output: [{}] }) }));
    await expect(functionProvider.responderComFuncoes({ question: "Quanto gastei?", tools: [], execute: jest.fn() })).rejects.toMatchObject({ statusCode: 502 });
  });

  it("converte falha da funcao em resultado de erro para o modelo", async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ output: [{ type: "function_call", name: "listar_gastos", call_id: "call-1", arguments: "{}" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ output_text: "Nao foi possivel consultar." }) });
    const provider = new OpenAiProvider("test-key", "test-model", fetcher);

    await expect(provider.responderComFuncoes({ question: "Liste meus gastos", tools: [], execute: jest.fn().mockRejectedValue(new Error("falha controlada")) })).resolves.toBe("Nao foi possivel consultar.");
    expect(fetcher.mock.calls[1][1].body).toContain("falha controlada");
  });

  it("rejeita chamadas de funcao incompletas e excesso de tentativas", async () => {
    const invalidCall = new OpenAiProvider("test-key", "test-model", jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output: [{ type: "function_call", name: "listar_gastos", arguments: "{}" }] }),
    }));
    await expect(invalidCall.responderComFuncoes({ question: "Liste", tools: [], execute: jest.fn() })).rejects.toMatchObject({ statusCode: 502 });

    const repeatedCalls = new OpenAiProvider("test-key", "test-model", jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output: [{ type: "function_call", name: "listar_gastos", call_id: "call-1", arguments: "{}" }] }),
    }));
    await expect(repeatedCalls.responderComFuncoes({ question: "Liste", tools: [], execute: jest.fn() })).rejects.toMatchObject({ statusCode: 502 });
  });
});
