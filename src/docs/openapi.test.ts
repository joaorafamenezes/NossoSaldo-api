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
    expect(response.body.paths).toHaveProperty("/categorias");
  });

  it("should expose the Swagger UI page", async () => {
    const response = await request(app)
      .get("/docs")
      .expect(301);

    expect(response.headers.location).toBe("/docs/");
  });
});
