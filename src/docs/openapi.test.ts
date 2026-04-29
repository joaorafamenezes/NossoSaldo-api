import request from "supertest";
import { app } from "../app";

describe("OpenAPI docs", () => {
  it("should expose the OpenAPI JSON document", async () => {
    const response = await request(app)
      .get("/docs/openapi.json")
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        openapi: "3.0.3",
        info: expect.objectContaining({
          title: "NossoSaldo API",
        }),
      }),
    );
    expect(response.body.paths).toHaveProperty("/login");
    expect(response.body.paths).toHaveProperty("/usuario");
    expect(response.body.paths["/usuario"]).toHaveProperty("patch");
    expect(response.body.paths).toHaveProperty("/atualizaSenha");
    expect(response.body.paths).toHaveProperty("/categorias");
    expect(response.body.paths).toHaveProperty("/criarContaConjunta");
    expect(response.body.paths).toHaveProperty("/conta-conjunta");
    expect(response.body.paths).toHaveProperty("/gastos/total/mes-atual");
    expect(response.body.paths).toHaveProperty("/gasto/{id}");
    expect(response.body.paths["/gasto/{id}"]).toHaveProperty("patch");
    expect(response.body.paths["/gasto/{id}"]).toHaveProperty("delete");
  });

  it("should expose the Swagger UI page", async () => {
    const response = await request(app)
      .get("/docs")
      .expect(301);

    expect(response.headers.location).toBe("/docs/");
  });
});
