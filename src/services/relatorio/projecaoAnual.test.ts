import { montarProjecaoAnual, MovimentoProjecaoAnual } from "./projecaoAnual";

function movimento(parcial: Partial<MovimentoProjecaoAnual> & Pick<MovimentoProjecaoAnual, "tipo" | "valor" | "ano" | "mes">): MovimentoProjecaoAnual {
  return {
    categoriaId: "cat-geral",
    categoriaNome: "Geral",
    responsavelId: "user-1",
    ...parcial,
  };
}

describe("montarProjecaoAnual", () => {
  it("calcula saldo de janeiro e saldo liquido do ano", () => {
    const relatorio = montarProjecaoAnual({
      ano: 2026,
      anoVigente: 2026,
      contaConjunta: null,
      movimentos: [
        movimento({ tipo: "receita", valor: 5000, ano: 2026, mes: 1, categoriaNome: "Salario", categoriaId: "cat-salario" }),
        movimento({ tipo: "despesa", valor: 3200, ano: 2026, mes: 1, categoriaNome: "Moradia", categoriaId: "cat-moradia" }),
      ],
    });

    expect(relatorio.saldo.meses[0]).toBe(1800);
    expect(relatorio.saldo.total).toBe(1800);
    expect(relatorio.totalReceitas.meses[0]).toBe(5000);
    expect(relatorio.totalDespesas.meses[0]).toBe(3200);
    expect(relatorio.despesas[0].categoria).toBe("Moradia");
    expect(relatorio.receitas[0].categoria).toBe("Salario");
  });

  it("destaca saldo negativo e soma centavos sem erro de ponto flutuante", () => {
    const relatorio = montarProjecaoAnual({
      ano: 2026,
      anoVigente: 2026,
      contaConjunta: null,
      movimentos: [
        movimento({ tipo: "receita", valor: 0.1, ano: 2026, mes: 2 }),
        movimento({ tipo: "despesa", valor: 0.2, ano: 2026, mes: 2 }),
      ],
    });

    expect(relatorio.saldo.meses[1]).toBe(-0.1);
    expect(relatorio.saldo.total).toBe(-0.1);
    expect(relatorio.totalDespesas.meses[1]).toBe(0.2);
  });

  it("omite categoria zerada, ordena pelo nome e repete categoria com receita e despesa", () => {
    const relatorio = montarProjecaoAnual({
      ano: 2026,
      anoVigente: 2026,
      contaConjunta: null,
      movimentos: [
        movimento({ tipo: "despesa", valor: 10, ano: 2026, mes: 3, categoriaId: "cat-moradia", categoriaNome: "Moradia" }),
        movimento({ tipo: "receita", valor: 4, ano: 2026, mes: 3, categoriaId: "cat-moradia", categoriaNome: "Moradia" }),
        movimento({ tipo: "despesa", valor: 2, ano: 2026, mes: 4, categoriaId: "cat-agua", categoriaNome: "Água" }),
      ],
    });

    expect(relatorio.despesas.map((linha) => linha.categoria)).toEqual(["Água", "Moradia"]);
    expect(relatorio.receitas.map((linha) => linha.categoria)).toEqual(["Moradia"]);
    expect(relatorio.saldo.meses[2]).toBe(-6);
  });

  it("inclui anos vazios entre o primeiro movimento e o ano vigente", () => {
    const relatorio = montarProjecaoAnual({
      ano: 2025,
      anoVigente: 2026,
      contaConjunta: null,
      movimentos: [
        movimento({ tipo: "despesa", valor: 10, ano: 2024, mes: 1 }),
        movimento({ tipo: "despesa", valor: 10, ano: 2026, mes: 6 }),
      ],
    });

    expect(relatorio.anosDisponiveis).toEqual([2024, 2025, 2026]);
    expect(relatorio.semMovimentacaoNoAno).toBe(true);
    expect(relatorio.semMovimentacaoNosFiltros).toBe(false);
    expect(relatorio.saldo.total).toBe(0);
    expect(relatorio.receitas).toEqual([]);
    expect(relatorio.despesas).toEqual([]);
  });

  it("filtra uma categoria e marca filtro vazio sem dizer que o ano inteiro esta vazio", () => {
    const base = {
      ano: 2026,
      anoVigente: 2026,
      contaConjunta: null,
      movimentos: [
        movimento({ tipo: "despesa", valor: 80, ano: 2026, mes: 1, categoriaId: "cat-moradia", categoriaNome: "Moradia" }),
        movimento({ tipo: "receita", valor: 20, ano: 2026, mes: 1, categoriaId: "cat-moradia", categoriaNome: "Moradia" }),
        movimento({ tipo: "despesa", valor: 5, ano: 2026, mes: 2, categoriaId: "cat-lazer", categoriaNome: "Lazer" }),
      ],
    };

    const moradia = montarProjecaoAnual({ ...base, categoriaId: "cat-moradia" });
    expect(moradia.despesas).toHaveLength(1);
    expect(moradia.receitas).toHaveLength(1);
    expect(moradia.saldo.total).toBe(-60);
    expect(moradia.categoriasDisponiveis.map((categoria) => categoria.nome)).toEqual(["Lazer", "Moradia"]);

    const inexistenteNoRecorte = montarProjecaoAnual({ ...base, categoriaId: "cat-sem-valor" });
    expect(inexistenteNoRecorte.semMovimentacaoNoAno).toBe(false);
    expect(inexistenteNoRecorte.semMovimentacaoNosFiltros).toBe(true);
    expect(inexistenteNoRecorte.saldo.total).toBe(0);
  });

  it("recalcula categorias pelo responsavel e preserva a faixa de anos", () => {
    const relatorio = montarProjecaoAnual({
      ano: 2026,
      anoVigente: 2026,
      responsavelId: "user-2",
      contaConjunta: {
        membros: [
          { id: "user-1", nome: "Joao" },
          { id: "user-2", nome: "Maria" },
        ],
      },
      movimentos: [
        movimento({ tipo: "despesa", valor: 30, ano: 2024, mes: 1, responsavelId: "user-1", categoriaId: "cat-a", categoriaNome: "Antiga" }),
        movimento({ tipo: "despesa", valor: 70, ano: 2026, mes: 8, responsavelId: "user-1", categoriaId: "cat-joao", categoriaNome: "Transporte" }),
        movimento({ tipo: "receita", valor: 100, ano: 2026, mes: 8, responsavelId: "user-2", categoriaId: "cat-maria", categoriaNome: "Salario" }),
      ],
    });

    expect(relatorio.anosDisponiveis).toEqual([2024, 2025, 2026]);
    expect(relatorio.categoriasDisponiveis).toEqual([{ id: "cat-maria", nome: "Salario" }]);
    expect(relatorio.receitas[0].total).toBe(100);
    expect(relatorio.despesas).toEqual([]);
    expect(relatorio.saldo.meses[7]).toBe(100);
  });
});
