export interface ProjecaoOptions {
  de: Date;
  ate: Date;
}

export class ProjecaoRecorrenciaService {
  getMesKey(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  getInicioMes(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  getUltimoDiaMes(year: number, monthZeroIndexed: number): number {
    return new Date(Date.UTC(year, monthZeroIndexed + 1, 0)).getUTCDate();
  }

  calcularDataVencimentoNoMes(diaVencimento: number, competencia: Date): Date {
    const year = competencia.getUTCFullYear();
    const month = competencia.getUTCMonth();
    const maxDia = this.getUltimoDiaMes(year, month);
    const diaAjustado = Math.min(diaVencimento, maxDia);
    return new Date(Date.UTC(year, month, diaAjustado, 12, 0, 0, 0));
  }

  getMesesNoPeriodo(inicio: Date, fim: Date): Date[] {
    const meses: Date[] = [];
    const atual = this.getInicioMes(inicio);
    const limite = this.getInicioMes(fim);

    while (atual.getTime() <= limite.getTime()) {
      meses.push(new Date(atual));
      atual.setUTCMonth(atual.getUTCMonth() + 1);
    }

    return meses;
  }

  isRecorrenciaPausadaNoMes(recorrencia: any, dataVencimento: Date): boolean {
    if (!recorrencia.pausado) {
      return false;
    }

    const { dataPausaInicio, dataPausaFim } = recorrencia;

    // Se pausada sem datas especificas, esta pausada indefinidamente
    if (!dataPausaInicio && !dataPausaFim) {
      return true;
    }

    const vencimentoTime = dataVencimento.getTime();

    if (dataPausaInicio && !dataPausaFim) {
      return vencimentoTime >= new Date(dataPausaInicio).getTime();
    }

    if (!dataPausaInicio && dataPausaFim) {
      return vencimentoTime <= new Date(dataPausaFim).getTime();
    }

    if (dataPausaInicio && dataPausaFim) {
      const inicio = new Date(dataPausaInicio).getTime();
      const fim = new Date(dataPausaFim).getTime();
      return vencimentoTime >= inicio && vencimentoTime <= fim;
    }

    return true;
  }

  gerarProjecoesJIT(
    gastosFisicos: any[],
    recorrenciasAtivas: any[],
    options: ProjecaoOptions
  ): any[] {
    const { de, ate } = options;

    // Mapeia chaves de ocorrencias fisicas existentes: (recorrenciaId/recorrenciaPaiId) + "_" + YYYY-MM
    const fisicosExistentes = new Set<string>();

    for (const gasto of gastosFisicos) {
      const keyId = gasto.recorrenciaId || gasto.recorrenciaPaiId;
      if (keyId) {
        const compDate = gasto.competencia ? new Date(gasto.competencia) : (gasto.dataVencimento ? new Date(gasto.dataVencimento) : null);
        if (compDate) {
          fisicosExistentes.add(`${keyId}_${this.getMesKey(compDate)}`);
        }
      }
    }

    const projecoesVirtuais: any[] = [];

    for (const recorrencia of recorrenciasAtivas) {
      const dataInicioComp = this.getInicioMes(new Date(recorrencia.dataInicio));
      const inicioRange = this.getInicioMes(de);
      const startMonth = dataInicioComp.getTime() > inicioRange.getTime() ? dataInicioComp : inicioRange;

      const fimRange = this.getInicioMes(ate);
      const dataFimComp = recorrencia.dataFim ? this.getInicioMes(new Date(recorrencia.dataFim)) : null;
      const endMonth = dataFimComp && dataFimComp.getTime() < fimRange.getTime() ? dataFimComp : fimRange;

      if (startMonth.getTime() > endMonth.getTime()) {
        continue;
      }

      const meses = this.getMesesNoPeriodo(startMonth, endMonth);

      for (const mes of meses) {
        const mesKey = this.getMesKey(mes);
        const dataVencimento = this.calcularDataVencimentoNoMes(recorrencia.diaVencimento, mes);

        // Verifica se a data de vencimento calculada cai dentro do intervalo de consulta
        if (dataVencimento.getTime() < de.getTime() || dataVencimento.getTime() > ate.getTime()) {
          continue;
        }

        // Verifica se esta pausada para esta data de vencimento
        if (this.isRecorrenciaPausadaNoMes(recorrencia, dataVencimento)) {
          continue;
        }

        // Verifica se ja existe um gasto fisico persistido no banco para este mes
        const chave = `${recorrencia.id}_${mesKey}`;
        if (fisicosExistentes.has(chave)) {
          continue;
        }

        // Cria a projecao virtual JIT
        projecoesVirtuais.push({
          id: `virtual-${recorrencia.id}-${mesKey}`,
          descricao: recorrencia.descricao,
          tipo: recorrencia.tipo,
          status: "pendente",
          origemLancamento: "recorrente",
          numeroParcelas: 1,
          naoCompartilhar: Boolean(recorrencia.naoCompartilhar),
          valor: Number(recorrencia.valor),
          competencia: mes,
          dataVencimento,
          dataPagamento: null,
          observacao: recorrencia.observacao ?? null,
          categoriaId: recorrencia.categoriaId,
          categoriaDescricao: recorrencia.categoria?.descricao ?? null,
          categoriaIconName: recorrencia.categoria?.iconName ?? "🏷️",
          categoriaCor: recorrencia.categoria?.cor ?? "#10b981",
          responsavelId: recorrencia.responsavelId,
          responsavelNome: recorrencia.responsavel?.nome ?? "Usuario",
          cartaoCreditoId: recorrencia.cartaoCreditoId ?? null,
          cartaoCreditoDescricao: recorrencia.cartaoCredito?.descricao ?? null,
          faturaCartaoId: null,
          faturaCartaoCompetencia: null,
          faturaCartaoStatus: null,
          recorrenciaId: recorrencia.id,
          recorrenciaPaiId: recorrencia.id,
          lancamentosBase: [],
          isVirtual: true,
          createdAt: recorrencia.createdAt,
          updatedAt: recorrencia.updatedAt,
        });
      }
    }

    // Combina gastos fisicos e projecoes virtuais, ordenando por dataVencimento decrescente
    return [...gastosFisicos, ...projecoesVirtuais].sort((a, b) => {
      const dataA = a.dataVencimento ? new Date(a.dataVencimento).getTime() : 0;
      const dataB = b.dataVencimento ? new Date(b.dataVencimento).getTime() : 0;
      return dataB - dataA;
    });
  }
}

export const projecaoRecorrenciaService = new ProjecaoRecorrenciaService();
