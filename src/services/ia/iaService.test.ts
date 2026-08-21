import { IaService } from "./iaService";

describe("IaService", () => {
  it("envia ao provedor somente os registros do usuario autenticado", async () => {
    const gastoRepository = {
      listarGastosPorResponsavelId: jest.fn().mockResolvedValue([
        { responsavelId: "user-1", descricao: "Mercado", valor: 100, status: "pago" },
        { responsavelId: "user-2", descricao: "Outro usuario", valor: 999, status: "pago" },
      ]),
    };
    const provider = {
      responder: jest.fn(),
      responderComFuncoes: jest.fn().mockImplementation(async ({ execute }: { execute: (name: string, args: string) => Promise<unknown> }) => {
        const resultado = await execute("listar_gastos", "{}");
        expect(JSON.stringify(resultado)).toContain("Mercado");
        expect(JSON.stringify(resultado)).not.toContain("Outro usuario");
        return "Resposta";
      }),
    };
    const configuracoes = {
      buscarPorUsuarioId: jest.fn().mockResolvedValue({
        usuarioId: "user-1",
        provedor: "openai",
        modelo: "test-model",
        chaveCriptografada: "encrypted",
        iv: "iv",
        authTag: "tag",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    const cipher = { decrypt: jest.fn().mockReturnValue("sk-user-key") };
    const conversas = {
      criar: jest.fn().mockResolvedValue({ id: "history-1", createdAt: new Date() }),
      listarPorUsuarioId: jest.fn(),
      removerPorUsuarioId: jest.fn(),
    };
    const service = new IaService(gastoRepository, jest.fn().mockReturnValue(provider), configuracoes as any, cipher as any, conversas as any);

    await expect(service.consultar("Quais foram meus gastos?", "user-1")).resolves.toMatchObject({ resposta: "Resposta", provedor: "openai" });

    expect(provider.responderComFuncoes).toHaveBeenCalled();
    expect(conversas.criar).toHaveBeenCalledWith(expect.objectContaining({
      usuarioId: "user-1",
      pergunta: "Quais foram meus gastos?",
      resposta: "Resposta",
    }));
  });
});
