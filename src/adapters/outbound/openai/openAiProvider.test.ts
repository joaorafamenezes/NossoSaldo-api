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
});
