import request from "supertest";
import { app } from "../app";
import { API_PREFIX, API_VERSION } from "../config/apiVersion";

describe("OpenAPI docs", () => {
  it("should expose the OpenAPI JSON document", async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/docs/openapi.json`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        openapi: "3.0.3",
        info: expect.objectContaining({
          title: "NossoSaldo API",
          version: API_VERSION,
        }),
      }),
    );
    expect(response.body.servers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: expect.stringContaining(API_PREFIX),
        }),
      ]),
    );
    expect(response.body.paths).toHaveProperty("/login");
    expect(response.body.paths).toHaveProperty("/usuarios/esqueci-senha");
    expect(response.body.paths).toHaveProperty("/usuarios/solicitarRedefinicaoSenha");
    expect(response.body.paths).toHaveProperty("/usuarios/redefinir-senha/validar");
    expect(response.body.paths).toHaveProperty("/usuarios/redefinir-senha");
    expect(response.body.paths).toHaveProperty("/usuarios/validar-email");
    expect(response.body.paths).toHaveProperty("/usuarios");
    expect(response.body.paths["/usuarios"]).toHaveProperty("get");
    expect(response.body.paths).toHaveProperty("/usuarios/listarUsuarioPorId");
    expect(response.body.paths).toHaveProperty("/usuarios/atualizaSenha");
    expect(response.body.paths).toHaveProperty("/categorias");
    expect(response.body.paths).toHaveProperty("/criarContaConjunta");
    expect(response.body.paths).toHaveProperty("/contaConjunta");
    expect(response.body.paths).toHaveProperty("/contaConjunta/{id}");
    expect(response.body.paths).toHaveProperty("/gastos");
    expect(response.body.paths).toHaveProperty("/gastos/total/mes-atual");
    expect(response.body.paths).toHaveProperty("/gastos/{id}");
    expect(response.body.paths["/gastos/{id}"]).toHaveProperty("patch");
    expect(response.body.paths["/gastos/{id}"]).toHaveProperty("delete");
    expect(response.body.paths).toHaveProperty("/pagarGastos/{id}/pagamento");
    expect(response.body.paths).toHaveProperty("/pagarGastos/{id}/reabertura");
    expect(response.body.paths).toHaveProperty("/lancamentosBase/{id}/pagamento");
    expect(response.body.paths).toHaveProperty("/lancamentosBase/{id}/reabertura");
    expect(response.body.paths).toHaveProperty("/cartoesCredito");
    expect(response.body.paths).toHaveProperty("/cartoesCredito/{id}");
    expect(response.body.paths).toHaveProperty("/faturasCartao");
    expect(response.body.paths).toHaveProperty("/faturasCartao/{id}/pagamento");
    expect(response.body.paths).toHaveProperty("/faturasCartao/{id}/reabertura");
    expect(response.body.paths).toHaveProperty("/relatorio/evolucaoMensal/{de}/{ate}");
    expect(response.body.paths).toHaveProperty("/relatorio/comparativoMensal/{mesAtual}/{mesAnterior}");
    expect(response.body.paths).toHaveProperty("/relatorio/topCategoria/{de}/{ate}");
    expect(response.body.paths).toHaveProperty("/relatorio/quemGastaMais/{de}/{ate}");
    expect(response.body.paths).toHaveProperty("/insights/gargalos/{de}/{ate}");
    expect(response.body.paths).toHaveProperty("/ia/consultas");
    expect(response.body.paths["/ia/consultas"]).toHaveProperty("post");
    expect(response.body.paths["/ia/consultas"].post.requestBody.required).toBe(true);
    expect(response.body.paths).toHaveProperty("/ia/consultas/historico");
    expect(response.body.paths["/ia/consultas/historico"]).toHaveProperty("get");
    expect(response.body.paths["/ia/consultas/historico"]).toHaveProperty("delete");
    expect(response.body.components.schemas.CreateGastoRequest.required).toContain("dataVencimento");
    expect(response.body.components.schemas.CreateGastoRequest.properties.dataVencimento.description).toContain("obrigatoria");
    expect(response.body.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Insights" }),
      ]),
    );
  });

  it("should expose the Swagger UI page", async () => {
    const response = await request(app)
      .get(`${API_PREFIX}/docs`)
      .expect(301);

    expect(response.headers.location).toBe(`${API_PREFIX}/docs/`);
  });
});
