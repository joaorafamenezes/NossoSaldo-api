import { projecaoRecorrenciaService } from "./projecaoRecorrenciaService";

describe("ProjecaoRecorrenciaService (Motor JIT)", () => {
  const de = new Date("2026-09-01T00:00:00Z");
  const ate = new Date("2026-11-30T23:59:59Z");

  const recorrenciaBase = {
    id: "rec-1",
    descricao: "Assinatura Netflix",
    tipo: "despesa",
    valor: 55.9,
    diaVencimento: 10,
    frequencia: "mensal",
    dataInicio: new Date("2026-08-10T12:00:00Z"),
    dataFim: null,
    pausado: false,
    dataPausaInicio: null,
    dataPausaFim: null,
    naoCompartilhar: false,
    observacao: "Plano Premium",
    categoriaId: "cat-1",
    categoria: { id: "cat-1", descricao: "Streaming", iconName: "tv", cor: "#e50914" },
    responsavelId: "user-1",
    responsavel: { id: "user-1", nome: "Usuario Teste" },
    cartaoCreditoId: null,
    createdAt: new Date("2026-08-10T12:00:00Z"),
    updatedAt: new Date("2026-08-10T12:00:00Z"),
  };

  it("deve projetar virtualmente ocorrencias para todos os meses do intervalo sem gastos fisicos", () => {
    const gastosFisicos: any[] = [];
    const recorrenciasAtivas = [recorrenciaBase];

    const resultado = projecaoRecorrenciaService.gerarProjecoesJIT(
      gastosFisicos,
      recorrenciasAtivas,
      { de, ate }
    );

    expect(resultado).toHaveLength(3); // Setembro, Outubro, Novembro

    const descricoes = resultado.map((g) => g.descricao);
    expect(descricoes).toEqual([
      "Assinatura Netflix",
      "Assinatura Netflix",
      "Assinatura Netflix",
    ]);

    const vencimentos = resultado.map((g) => g.dataVencimento.toISOString().slice(0, 10));
    expect(vencimentos).toEqual(["2026-11-10", "2026-10-10", "2026-09-10"]);

    expect(resultado.every((g) => g.isVirtual === true)).toBe(true);
  });

  it("deve dar precedencia ao gasto fisico e nao duplicar projecao virtual quando o mes ja possui registro fisico", () => {
    const gastoFisicoSetembro = {
      id: "gasto-fisico-setembro",
      descricao: "Assinatura Netflix Setembro Pago",
      tipo: "despesa",
      status: "pago",
      origemLancamento: "recorrente",
      valor: 55.9,
      competencia: new Date("2026-09-01T00:00:00Z"),
      dataVencimento: new Date("2026-09-10T12:00:00Z"),
      categoriaId: "cat-1",
      responsavelId: "user-1",
      recorrenciaId: "rec-1",
      isVirtual: false,
    };

    const gastosFisicos = [gastoFisicoSetembro];
    const recorrenciasAtivas = [recorrenciaBase];

    const resultado = projecaoRecorrenciaService.gerarProjecoesJIT(
      gastosFisicos,
      recorrenciasAtivas,
      { de, ate }
    );

    expect(resultado).toHaveLength(3); // 1 fisico (Set) + 2 virtuais (Out, Nov)

    const setItem = resultado.find((g) => g.id === "gasto-fisico-setembro");
    expect(setItem).toBeDefined();
    expect(setItem?.isVirtual).toBe(false);
    expect(setItem?.status).toBe("pago");

    const virtuais = resultado.filter((g) => g.isVirtual);
    expect(virtuais).toHaveLength(2);
    expect(virtuais.map((v) => v.id)).toEqual([
      "virtual-rec-1-2026-11",
      "virtual-rec-1-2026-10",
    ]);
  });

  it("nao deve projetar nenhuma ocorrencia quando a recorrencia estiver pausada indefinidamente", () => {
    const recorrenciaPausada = {
      ...recorrenciaBase,
      pausado: true,
      dataPausaInicio: null,
      dataPausaFim: null,
    };

    const resultado = projecaoRecorrenciaService.gerarProjecoesJIT(
      [],
      [recorrenciaPausada],
      { de, ate }
    );

    expect(resultado).toHaveLength(0);
  });

  it("deve ignorar apenas os meses dentro da janela de pausa temporaria", () => {
    // Pausada especificamente em Outubro/2026 (de 01/10/2026 a 31/10/2026)
    const recorrenciaPausadaOutubro = {
      ...recorrenciaBase,
      pausado: true,
      dataPausaInicio: new Date("2026-10-01T00:00:00Z"),
      dataPausaFim: new Date("2026-10-31T23:59:59Z"),
    };

    const resultado = projecaoRecorrenciaService.gerarProjecoesJIT(
      [],
      [recorrenciaPausadaOutubro],
      { de, ate }
    );

    expect(resultado).toHaveLength(2); // Setembro e Novembro (Outubro pulado)

    const meses = resultado.map((g) => g.dataVencimento.toISOString().slice(0, 7));
    expect(meses).toEqual(["2026-11", "2026-09"]);
  });

  it("deve ajustar corretamente o dia de vencimento para o ultimo dia do mes em meses com menos dias", () => {
    const recorrenciaDia31 = {
      ...recorrenciaBase,
      dataInicio: new Date("2026-01-01T00:00:00Z"),
      diaVencimento: 31,
    };

    const deFev = new Date("2026-02-01T00:00:00Z");
    const ateFev = new Date("2026-02-28T23:59:59Z");

    const resultado = projecaoRecorrenciaService.gerarProjecoesJIT(
      [],
      [recorrenciaDia31],
      { de: deFev, ate: ateFev }
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0].dataVencimento.getUTCDate()).toBe(28); // Fevereiro 2026 tem 28 dias
  });
});
