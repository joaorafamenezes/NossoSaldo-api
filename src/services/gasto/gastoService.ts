import createHttpError from "http-errors";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";
import iPagarGasto from "../../@types/gasto/iPagarGasto";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";
import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { recorrenciaRepository } from "../../repositories/recorrencia/recorrenciaRepository";
import { projecaoRecorrenciaService } from "../recorrencia/projecaoRecorrenciaService";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

class GastoService {
    private parseCalendarDate(value: string, endOfDay = false) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (!match) {
            const fallback = new Date(value);
            return Number.isNaN(fallback.getTime()) ? null : fallback;
        }

        return new Date(Date.UTC(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            endOfDay ? 23 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 59 : 0,
            endOfDay ? 999 : 0,
        ));
    }

    private getInicioMes(date: Date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }

    private getFimMes(date: Date) {
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    }

    private getMesesNoPeriodo(de: Date, ate: Date) {
        const meses: Date[] = [];
        const cursor = this.getInicioMes(de);
        const fim = this.getInicioMes(ate);

        while (cursor <= fim) {
            meses.push(new Date(cursor));
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }

        return meses;
    }

    private getCompetenciaBase(gasto: {
        competencia?: Date | null;
        dataVencimento?: Date | null;
        dataInicioRecorrencia?: Date | null;
    }) {
        const referencia = gasto.competencia ?? gasto.dataVencimento ?? gasto.dataInicioRecorrencia ?? new Date();
        return this.getInicioMes(new Date(referencia));
    }

    private getMesKey(date: Date) {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }

    private isMesmoOuDepois(primeira: Date, segunda: Date) {
        return primeira.getTime() >= segunda.getTime();
    }

    private async sincronizarSerieRecorrente(
        gastoBase: any,
        alteracoes: iAtualizarGasto,
        gastoRaiz: any,
        cartao: any,
        allSeries = false,
    ) {
        const recorrenciaPaiId = gastoRaiz.id;
        const competenciaInicial = alteracoes.targetCompetencia
            ? this.getInicioMes(new Date(alteracoes.targetCompetencia))
            : this.getCompetenciaBase(gastoBase);
        const dataInicioRecorrencia = allSeries
            ? (gastoRaiz.dataInicioRecorrencia ?? gastoBase.dataInicioRecorrencia ?? gastoBase.dataVencimento)
            : (alteracoes.targetCompetencia ? new Date(alteracoes.targetCompetencia) : (gastoRaiz.dataInicioRecorrencia ?? gastoBase.dataInicioRecorrencia ?? gastoBase.dataVencimento));
        const dataFimRecorrencia = alteracoes.dataFimRecorrencia !== undefined
            ? alteracoes.dataFimRecorrencia
            : (gastoBase.dataFimRecorrencia ?? gastoRaiz.dataFimRecorrencia ?? null);
        const dataVencimentoReferencia = alteracoes.dataVencimento !== undefined
            ? alteracoes.dataVencimento
            : gastoBase.dataVencimento;

        if (!dataVencimentoReferencia) {
            throw createHttpError(400, "A data de vencimento e obrigatoria para gastos recorrentes.");
        }

        if (dataFimRecorrencia) {
            const fimCompetencia = this.getInicioMes(new Date(dataFimRecorrencia));

            if (fimCompetencia.getTime() < competenciaInicial.getTime()) {
                throw createHttpError(400, "A data final da recorrencia nao pode ser anterior ao registro editado.");
            }
        }

        const registrosSerie = await gastoRepository.listarGastosDaSerieRecorrente(recorrenciaPaiId);
        const faturasParaRecalcular = new Set<string>();

        // Se a edicao com THIS_AND_FUTURE comeca apos a raiz, preserva o historico da raiz como registro independente
        const competenciaRaiz = this.getCompetenciaBase(gastoRaiz);
        if (!allSeries && competenciaInicial.getTime() > competenciaRaiz.getTime()) {
            const chaveMesRaiz = this.getMesKey(competenciaRaiz);
            const jaExisteHistoricoRaiz = registrosSerie.some(
                (r: any) => r.id !== gastoRaiz.id && this.getMesKey(this.getCompetenciaBase(r)) === chaveMesRaiz
            );

            if (!jaExisteHistoricoRaiz) {
                await gastoRepository.criarGastoUsuarioLogado({
                    descricao: gastoRaiz.descricao,
                    tipo: gastoRaiz.tipo,
                    status: gastoRaiz.status,
                    origemLancamento: "recorrente",
                    numeroParcelas: 1,
                    naoCompartilhar: Boolean(gastoRaiz.naoCompartilhar),
                    valor: Number(gastoRaiz.valor),
                    competencia: competenciaRaiz,
                    dataVencimento: gastoRaiz.dataVencimento,
                    dataPagamento: gastoRaiz.dataPagamento,
                    observacao: gastoRaiz.observacao ?? undefined,
                    categoriaId: gastoRaiz.categoriaId,
                    responsavelId: gastoRaiz.responsavelId,
                    cartaoCreditoId: gastoRaiz.cartaoCreditoId ?? null,
                    faturaCartaoId: gastoRaiz.faturaCartaoId ?? null,
                    recorrenciaPaiId: gastoRaiz.id,
                    dataInicioRecorrencia: gastoRaiz.dataInicioRecorrencia ?? null,
                    dataFimRecorrencia: gastoRaiz.dataFimRecorrencia ?? null,
                });
            }
        }

        const registrosSerieAtualizados = await gastoRepository.listarGastosDaSerieRecorrente(recorrenciaPaiId);
        const registrosPorMes = new Map(
            registrosSerieAtualizados.map((registro: any) => [this.getMesKey(this.getCompetenciaBase(registro)), registro]),
        );

        if (!allSeries && competenciaInicial.getTime() > competenciaRaiz.getTime()) {
            const chaveCompInicial = this.getMesKey(competenciaInicial);
            if (!registrosPorMes.has(chaveCompInicial)) {
                registrosPorMes.set(chaveCompInicial, gastoRaiz);
            }
        }

        const camposEmCascata: iAtualizarGasto = {
            descricao: alteracoes.descricao ?? gastoBase.descricao,
            tipo: alteracoes.tipo ?? gastoBase.tipo,
            naoCompartilhar: alteracoes.naoCompartilhar ?? gastoBase.naoCompartilhar,
            valor: alteracoes.valor ?? Number(gastoBase.valor),
            observacao: alteracoes.observacao !== undefined ? alteracoes.observacao : gastoBase.observacao,
            categoriaId: alteracoes.categoriaId ?? gastoBase.categoriaId,
            cartaoCreditoId: alteracoes.cartaoCreditoId !== undefined ? alteracoes.cartaoCreditoId : (gastoBase.cartaoCreditoId ?? null),
            dataInicioRecorrencia: dataInicioRecorrencia ? new Date(dataInicioRecorrencia) : null,
            dataFimRecorrencia: dataFimRecorrencia ? new Date(dataFimRecorrencia) : null,
        };
        const inicioRange = allSeries
            ? (dataInicioRecorrencia ? this.getInicioMes(new Date(dataInicioRecorrencia)) : competenciaInicial)
            : competenciaInicial;
        const mesesDesejados = dataFimRecorrencia
            ? this.getMesesNoPeriodo(inicioRange, new Date(dataFimRecorrencia))
            : [
                ...new Set([
                    this.getMesKey(competenciaInicial),
                    ...registrosSerieAtualizados.map((registro: any) => this.getMesKey(this.getCompetenciaBase(registro)))
                ])
            ]
                .map((key) => {
                    const [year, month] = key.split("-").map(Number);
                    return new Date(year, month - 1, 1);
                })
                .filter((competencia) => allSeries || this.isMesmoOuDepois(competencia, competenciaInicial));

        if (alteracoes.dataFimRecorrencia !== undefined) {
            for (const registro of registrosSerie) {
                const competenciaRegistro = this.getCompetenciaBase(registro);

                if (competenciaRegistro.getTime() < competenciaInicial.getTime()) {
                    await gastoRepository.atualizarGasto(registro.id, {
                        dataFimRecorrencia: dataFimRecorrencia ? new Date(dataFimRecorrencia) : null,
                    });
                }
            }
        }

        for (const competencia of mesesDesejados) {
            const chaveMes = this.getMesKey(competencia);
            const registroExistente = registrosPorMes.get(chaveMes);
            const dataVencimento = gastoRepository.calcularDataVencimentoRecorrente(
                new Date(dataVencimentoReferencia),
                competencia,
            );
            const fatura = cartao
                ? await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, dataVencimento)
                : null;
            const payloadBase: iAtualizarGasto = {
                ...camposEmCascata,
                competencia,
                dataVencimento,
                faturaCartaoId: fatura?.id ?? null,
            };

            if (registroExistente) {
                if (registroExistente.faturaCartaoId) {
                    faturasParaRecalcular.add(registroExistente.faturaCartaoId);
                }

                if (fatura?.id) {
                    faturasParaRecalcular.add(fatura.id);
                }

                await gastoRepository.atualizarGasto(registroExistente.id, {
                    ...payloadBase,
                    ...(registroExistente.id === gastoBase.id ? {
                        status: alteracoes.status ?? gastoBase.status,
                        dataPagamento: alteracoes.dataPagamento !== undefined
                            ? alteracoes.dataPagamento
                            : gastoBase.dataPagamento,
                    } : {}),
                });
                continue;
            }

            const novoGasto = await gastoRepository.criarGastoUsuarioLogado({
                descricao: camposEmCascata.descricao!,
                tipo: camposEmCascata.tipo!,
                status: "pendente",
                origemLancamento: "recorrente",
                numeroParcelas: 1,
                naoCompartilhar: Boolean(camposEmCascata.naoCompartilhar),
                valor: Number(camposEmCascata.valor),
                competencia,
                dataVencimento,
                observacao: camposEmCascata.observacao ?? undefined,
                categoriaId: camposEmCascata.categoriaId!,
                responsavelId: gastoBase.responsavelId,
                cartaoCreditoId: camposEmCascata.cartaoCreditoId ?? null,
                faturaCartaoId: fatura?.id ?? null,
                recorrenciaPaiId,
                dataInicioRecorrencia: camposEmCascata.dataInicioRecorrencia ?? null,
                dataFimRecorrencia: camposEmCascata.dataFimRecorrencia ?? null,
            });

            if (novoGasto && (novoGasto as any).faturaCartaoId) {
                faturasParaRecalcular.add((novoGasto as any).faturaCartaoId);
            }
        }

        if (dataFimRecorrencia) {
            const fimCompetencia = this.getInicioMes(new Date(dataFimRecorrencia));

            for (const registro of registrosSerie) {
                const competenciaRegistro = this.getCompetenciaBase(registro);

                if (
                    this.isMesmoOuDepois(competenciaRegistro, competenciaInicial)
                    && competenciaRegistro.getTime() > fimCompetencia.getTime()
                ) {
                    if ((registro as any).faturaCartaoId) {
                        faturasParaRecalcular.add((registro as any).faturaCartaoId);
                    }

                    await gastoRepository.deletarGasto(registro.id);
                }
            }
        }

        for (const faturaId of faturasParaRecalcular) {
            await faturaCartaoRepository.recalcularValorTotal(faturaId);
        }
    }

    private async listarResponsaveisAcessiveis(usuarioId: string) {
        const contasConjuntas = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioId);
        const usuariosCompartilhadosIds = contasConjuntas.map((conta) => (
            conta.usuario1Id === usuarioId ? conta.usuario2Id : conta.usuario1Id
        ));

        return Array.from(new Set([usuarioId, ...usuariosCompartilhadosIds]));
    }

    async gerarGastosRecorrentesDoMes(usuarioId: string, referencia = new Date()) {
        const inicioMes = this.getInicioMes(referencia);
        const fimMes = this.getFimMes(referencia);
        const responsaveisIds = await this.listarResponsaveisAcessiveis(usuarioId);
        const modelos = await gastoRepository.listarModelosRecorrentesAtivosPorResponsaveis(
            responsaveisIds,
            inicioMes,
            fimMes,
        );
        const faturasParaRecalcular = new Set<string>();

        for (const modelo of modelos) {
            const dataInicio = modelo.dataInicioRecorrencia ?? modelo.dataVencimento;

            if (!dataInicio || !modelo.dataVencimento) {
                continue;
            }

            const inicioRecorrenciaMes = this.getInicioMes(new Date(dataInicio));

            if (inicioRecorrenciaMes >= inicioMes) {
                continue;
            }

            const gastoJaGerado = await gastoRepository.buscarGastoGeradoPorRecorrencia(
                modelo.id,
                inicioMes,
                fimMes,
            );

            if (gastoJaGerado) {
                continue;
            }

            const dataVencimento = gastoRepository.calcularDataVencimentoRecorrente(
                new Date(modelo.dataVencimento),
                inicioMes,
            );
            const novoGasto: iCriarGasto = {
                descricao: modelo.descricao,
                tipo: modelo.tipo,
                status: "pendente",
                origemLancamento: "recorrente",
                numeroParcelas: 1,
                naoCompartilhar: modelo.naoCompartilhar,
                valor: Number(modelo.valor),
                competencia: inicioMes,
                dataVencimento,
                observacao: modelo.observacao ?? undefined,
                categoriaId: modelo.categoriaId,
                responsavelId: modelo.responsavelId,
                cartaoCreditoId: modelo.cartaoCreditoId ?? undefined,
                recorrenciaPaiId: modelo.id,
            };

            if (modelo.cartaoCreditoId) {
                const cartao = await cartaoCreditoRepository.buscarCartaoCreditoPorId(modelo.cartaoCreditoId);

                if (cartao) {
                    const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, dataVencimento);
                    novoGasto.faturaCartaoId = fatura.id;
                    faturasParaRecalcular.add(fatura.id);
                }
            }

            await gastoRepository.criarGastoUsuarioLogado(novoGasto);
        }

        for (const faturaId of faturasParaRecalcular) {
            await faturaCartaoRepository.recalcularValorTotal(faturaId);
        }
    }

    async gerarGastosRecorrentesPorPeriodo(usuarioId: string, de: Date, ate: Date) {
        const meses = this.getMesesNoPeriodo(de, ate);

        for (const mes of meses) {
            await this.gerarGastosRecorrentesDoMes(usuarioId, mes);
        }
    }

    private async validarCartaoCreditoPermitido(cartaoCreditoId: string | null | undefined, usuarioId: string) {
        if (!cartaoCreditoId) {
            return null;
        }

        const cartao = await cartaoCreditoRepository.buscarCartaoCreditoPorId(cartaoCreditoId);

        if (!cartao) {
            throw createHttpError(404, "Cartao de credito nao encontrado.");
        }

        if (cartao.usuarioId === usuarioId) {
            return cartao;
        }

        const contasConjuntas = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioId);
        const cartaoPertenceAContaConjunta = contasConjuntas.some((conta) => (
            conta.usuario1Id === cartao.usuarioId || conta.usuario2Id === cartao.usuarioId
        ));

        if (!cartaoPertenceAContaConjunta) {
            throw createHttpError(403, "Usuario nao autorizado a vincular este cartao de credito ao gasto.");
        }

        return cartao;
    }

    async criarGastoUsuarioLogado(data: iCriarGasto) {
        const { responsavelId } = data;
        data.cartaoCreditoId = data.cartaoCreditoId || null;

        if (data.origemLancamento === "recorrente" && !data.recorrenciaPaiId) {
            data.dataInicioRecorrencia = data.dataVencimento ?? data.competencia ?? new Date();
        }

        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "Usuario responsavel pelo gasto nao encontrado.");
        }

        const cartao = await this.validarCartaoCreditoPermitido(data.cartaoCreditoId, responsavelId);

        if (cartao && data.origemLancamento !== "parcelado") {
            const fatura = data.dataVencimento
                ? await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, new Date(data.dataVencimento))
                : await faturaCartaoRepository.buscarOuCriarFatura(cartao, new Date(data.competencia ?? new Date()));
            data.faturaCartaoId = fatura.id;
        }

        const gastoCriado = await gastoRepository.criarGastoUsuarioLogado(data);

        if (!gastoCriado) {
            throw createHttpError(500, "Gasto criado, mas nao foi possivel recuperar o registro.");
        }

        if (cartao && data.origemLancamento === "parcelado") {
            const parcelas = await gastoRepository.listarLancamentosBasePorGastoId(gastoCriado.id);
            const faturasIds = new Set<string>();

            for (const parcela of parcelas) {
                const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, parcela.dataVencimentoParcela);
                await gastoRepository.vincularLancamentoBaseAFatura(parcela.id, fatura.id);
                faturasIds.add(fatura.id);
            }

            for (const faturaId of faturasIds) {
                await faturaCartaoRepository.recalcularValorTotal(faturaId);
            }
        } else if (data.faturaCartaoId) {
            await faturaCartaoRepository.recalcularValorTotal(data.faturaCartaoId);
        }

        if (
            data.origemLancamento === "recorrente"
            && data.dataFimRecorrencia
            && gastoCriado.recorrenciaPaiId
        ) {
            await this.sincronizarSerieRecorrente(
                gastoCriado as any,
                {
                    descricao: gastoCriado.descricao,
                    tipo: gastoCriado.tipo,
                    naoCompartilhar: (gastoCriado as any).naoCompartilhar,
                    valor: Number(gastoCriado.valor),
                    observacao: gastoCriado.observacao,
                    categoriaId: gastoCriado.categoriaId,
                    cartaoCreditoId: (gastoCriado as any).cartaoCreditoId ?? null,
                    dataVencimento: gastoCriado.dataVencimento ?? undefined,
                    dataInicioRecorrencia: (gastoCriado as any).dataInicioRecorrencia ?? null,
                    dataFimRecorrencia: (gastoCriado as any).dataFimRecorrencia ?? null,
                },
                gastoCriado as any,
                cartao,
            );
        }

        return gastoCriado;
    }

    async listarGastosPorResponsavelId(responsavelId: string, filtros?: { competencia?: string; de?: string; ate?: string }) {
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "Usuario nao encontrado.");
        }

        const gastosFisicos = await gastoRepository.listarGastosPorResponsavelId(responsavelId, filtros);

        let de: Date | null = null;
        let ate: Date | null = null;

        if (filtros?.de && filtros?.ate) {
            de = this.parseCalendarDate(filtros.de);
            ate = this.parseCalendarDate(filtros.ate, true);
        } else if (filtros?.competencia) {
            const [ano, mes] = filtros.competencia.split("-").map(Number);
            if (ano && mes) {
                de = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0, 0));
                ate = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));
            }
        }

        if (de && ate && !Number.isNaN(de.getTime()) && !Number.isNaN(ate.getTime())) {
            const contasConjuntas = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(responsavelId);
            const usuariosCompartilhadosIds = Array.from(new Set([
                responsavelId,
                ...contasConjuntas.map((c) => (c.usuario1Id === responsavelId ? c.usuario2Id : c.usuario1Id)),
            ]));

            const recorrenciasAtivas = await recorrenciaRepository.listarRecorrenciasAtivasNoPeriodo(
                usuariosCompartilhadosIds,
                de,
                ate,
            );

            return projecaoRecorrenciaService.gerarProjecoesJIT(gastosFisicos, recorrenciasAtivas, { de, ate });
        }

        return gastosFisicos;
    }

    async buscarTotalGastoMesAtualPorResponsavelId(responsavelId: string) {
        const usuario = await usuarioRepository.listarUsuarioPorId(responsavelId);

        if (!usuario) {
            throw createHttpError(404, "Usuario nao encontrado.");
        }

        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
        const totalGastoMesAtual = await gastoRepository.buscarTotalGastoMesAtualPorResponsavelId(
            responsavelId,
            inicioMes,
            fimMes,
        );

        return {
            referencia: `${inicioMes.getFullYear()}-${String(inicioMes.getMonth() + 1).padStart(2, "0")}`,
            totalGastoMesAtual,
        };
    }

    async detalharGastoPorId(id: string, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        const gastoCompartilhavel = gasto.responsavelId !== userId && !(gasto as any).naoCompartilhar;
        const contasConjuntas = gastoCompartilhavel
            ? await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(userId)
            : [];
        const usuarioCompartilhaComResponsavel = contasConjuntas.some((conta) => (
            conta.usuario1Id === gasto.responsavelId || conta.usuario2Id === gasto.responsavelId
        ));

        if (gasto.responsavelId !== userId && !usuarioCompartilhaComResponsavel) {
            throw createHttpError(403, "Usuario nao autorizado a acessar este gasto.");
        }

        return gasto;
    }

    async atualizarGasto(id: string, data: iAtualizarGasto, userId: string) {
        if (Object.prototype.hasOwnProperty.call(data, "cartaoCreditoId")) {
            data.cartaoCreditoId = data.cartaoCreditoId || null;
        }

        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a atualizar este gasto.");
        }

        const cartaoCreditoId = data.cartaoCreditoId !== undefined ? data.cartaoCreditoId : (gasto as any).cartaoCreditoId;
        const cartao = await this.validarCartaoCreditoPermitido(cartaoCreditoId, userId);

        const novaOrigem = data.origemLancamento ?? gasto.origemLancamento;
        const faturasParaRecalcular = new Set<string>();

        if ((gasto as any).faturaCartaoId) {
            faturasParaRecalcular.add((gasto as any).faturaCartaoId);
        }

        // Caso 1: Mantem como recorrente
        if (gasto.origemLancamento === "recorrente" && novaOrigem === "recorrente") {
            const recorrenciaPaiId = (gasto as any).recorrenciaPaiId ?? gasto.id;
            const gastoRaiz = recorrenciaPaiId === gasto.id
                ? gasto
                : await gastoRepository.buscarGastoPorId(recorrenciaPaiId);

            if (!gastoRaiz) {
                throw createHttpError(404, "Modelo da recorrencia nao encontrado.");
            }

            const escopo = data.escopoEdicao ?? "THIS_AND_FUTURE";

            if (escopo === "THIS_ONLY") {
                const targetCompRaw = data.targetCompetencia ?? data.competencia ?? gasto.competencia ?? gasto.dataVencimento ?? new Date();
                const targetComp = this.getInicioMes(new Date(targetCompRaw));
                const targetKey = this.getMesKey(targetComp);

                const registrosSerie = await gastoRepository.listarGastosDaSerieRecorrente(recorrenciaPaiId);
                const registroExistente = registrosSerie.find(
                    (r: any) => this.getMesKey(this.getCompetenciaBase(r)) === targetKey
                );

                const dataVencimentoReferencia = data.dataVencimento
                    ? new Date(data.dataVencimento)
                    : (registroExistente?.dataVencimento ? new Date(registroExistente.dataVencimento) : (gastoRaiz.dataVencimento ? new Date(gastoRaiz.dataVencimento) : new Date()));

                const dataVencimento = gastoRepository.calcularDataVencimentoRecorrente(
                    dataVencimentoReferencia,
                    targetComp
                );

                const fatura = cartao
                    ? await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, dataVencimento)
                    : null;

                const payloadItem: iAtualizarGasto = {
                    descricao: data.descricao !== undefined ? data.descricao : (registroExistente?.descricao ?? gasto.descricao),
                    tipo: data.tipo !== undefined ? data.tipo : (registroExistente?.tipo ?? gasto.tipo),
                    status: data.status !== undefined ? data.status : (registroExistente?.status ?? gasto.status),
                    origemLancamento: "recorrente",
                    numeroParcelas: 1,
                    naoCompartilhar: data.naoCompartilhar !== undefined ? data.naoCompartilhar : (registroExistente?.naoCompartilhar ?? gasto.naoCompartilhar),
                    valor: data.valor !== undefined ? Number(data.valor) : Number(registroExistente?.valor ?? gasto.valor),
                    competencia: targetComp,
                    dataVencimento,
                    dataPagamento: data.dataPagamento !== undefined ? data.dataPagamento : (registroExistente?.dataPagamento ?? (data.status === "pago" ? dataVencimento : null)),
                    observacao: data.observacao !== undefined ? data.observacao : (registroExistente?.observacao ?? gasto.observacao),
                    categoriaId: data.categoriaId ?? (registroExistente?.categoriaId ?? gasto.categoriaId),
                    cartaoCreditoId: cartao?.id ?? null,
                    faturaCartaoId: fatura?.id ?? null,
                    recorrenciaPaiId: gastoRaiz.id,
                };

                if (registroExistente) {
                    if (registroExistente.faturaCartaoId) {
                        faturasParaRecalcular.add(registroExistente.faturaCartaoId);
                    }
                    if (fatura?.id) {
                        faturasParaRecalcular.add(fatura.id);
                    }

                    const atualizado = await gastoRepository.atualizarGasto(registroExistente.id, payloadItem);

                    for (const faturaId of faturasParaRecalcular) {
                        await faturaCartaoRepository.recalcularValorTotal(faturaId);
                    }

                    return atualizado;
                } else {
                    const novoGasto = await gastoRepository.criarGastoUsuarioLogado({
                        ...payloadItem,
                        responsavelId: (gasto as any).responsavelId ?? userId,
                        dataInicioRecorrencia: (gastoRaiz as any).dataInicioRecorrencia ?? null,
                        dataFimRecorrencia: (gastoRaiz as any).dataFimRecorrencia ?? null,
                    } as any);

                    if (fatura?.id) {
                        await faturaCartaoRepository.recalcularValorTotal(fatura.id);
                    }

                    return novoGasto;
                }
            }

            await this.sincronizarSerieRecorrente(gasto as any, data, gastoRaiz as any, cartao, escopo === "ALL_SERIES");

            return await gastoRepository.buscarGastoPorId(id);
        }

        // Caso 2: Transicao de Recorrente para Unico ou Parcelado
        if (gasto.origemLancamento === "recorrente" && novaOrigem !== "recorrente") {
            const recorrenciaPaiId = (gasto as any).recorrenciaPaiId ?? gasto.id;
            const registrosSerie = await gastoRepository.listarGastosDaSerieRecorrente(recorrenciaPaiId);

            for (const registro of registrosSerie) {
                if (registro.id !== id && registro.status === "pendente") {
                    if ((registro as any).faturaCartaoId) {
                        faturasParaRecalcular.add((registro as any).faturaCartaoId);
                    }
                    await gastoRepository.deletarGasto(registro.id);
                }
            }

            const updatePayload: iAtualizarGasto = {
                ...data,
                origemLancamento: novaOrigem,
                recorrenciaPaiId: null,
                dataInicioRecorrencia: null,
                dataFimRecorrencia: null,
                numeroParcelas: novaOrigem === "parcelado" ? (data.numeroParcelas || gasto.numeroParcelas || 2) : 1,
            };

            if (cartao && novaOrigem !== "parcelado") {
                const dataVenc = updatePayload.dataVencimento ?? gasto.dataVencimento ?? new Date();
                const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, new Date(dataVenc));
                updatePayload.faturaCartaoId = fatura.id;
                faturasParaRecalcular.add(fatura.id);
            } else if (!cartao) {
                updatePayload.faturaCartaoId = null;
            }

            const gastoAtualizado = await gastoRepository.atualizarGasto(id, updatePayload);

            if (cartao && novaOrigem === "parcelado") {
                const parcelas = await gastoRepository.listarLancamentosBasePorGastoId(id);
                for (const parcela of parcelas) {
                    const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, parcela.dataVencimentoParcela);
                    await gastoRepository.vincularLancamentoBaseAFatura(parcela.id, fatura.id);
                    faturasParaRecalcular.add(fatura.id);
                }
            }

            for (const faturaId of faturasParaRecalcular) {
                await faturaCartaoRepository.recalcularValorTotal(faturaId);
            }

            return gastoAtualizado;
        }

        // Caso 3: Transicao de Unico / Parcelado para Recorrente
        if (gasto.origemLancamento !== "recorrente" && novaOrigem === "recorrente") {
            const dataVenc = data.dataVencimento ?? gasto.dataVencimento ?? new Date();
            const updatePayload: iAtualizarGasto = {
                ...data,
                origemLancamento: "recorrente",
                numeroParcelas: 1,
                recorrenciaPaiId: null,
                dataInicioRecorrencia: new Date(dataVenc),
                dataFimRecorrencia: data.dataFimRecorrencia ?? null,
            };

            if (cartao) {
                const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, new Date(dataVenc));
                updatePayload.faturaCartaoId = fatura.id;
                faturasParaRecalcular.add(fatura.id);
            } else {
                updatePayload.faturaCartaoId = null;
            }

            const gastoAtualizado = await gastoRepository.atualizarGasto(id, updatePayload);

            for (const faturaId of faturasParaRecalcular) {
                await faturaCartaoRepository.recalcularValorTotal(faturaId);
            }

            return gastoAtualizado;
        }

        // Caso 4: Transicoes Unico <-> Parcelado ou Atualizacao Regular
        if (cartao && novaOrigem !== "parcelado") {
            const dataVenc = data.dataVencimento ?? gasto.dataVencimento ?? new Date();
            const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, new Date(dataVenc));
            data.faturaCartaoId = fatura.id;
            faturasParaRecalcular.add(fatura.id);
        } else if (!cartao && novaOrigem !== "parcelado") {
            data.faturaCartaoId = null;
        }

        const gastoAtualizado = await gastoRepository.atualizarGasto(id, data);

        if (cartao && novaOrigem === "parcelado") {
            const parcelas = await gastoRepository.listarLancamentosBasePorGastoId(id);
            for (const parcela of parcelas) {
                const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, parcela.dataVencimentoParcela);
                await gastoRepository.vincularLancamentoBaseAFatura(parcela.id, fatura.id);
                faturasParaRecalcular.add(fatura.id);
            }
        }

        for (const faturaId of faturasParaRecalcular) {
            await faturaCartaoRepository.recalcularValorTotal(faturaId);
        }

        return gastoAtualizado;
    }

    async pagarGasto(id: string, data: iPagarGasto, userId: string) {
        if (id.startsWith("virtual-")) {
            const parts = id.split("-");
            const recorrenciaId = parts.slice(1, 6).join("-");
            const anoMes = parts.slice(6).join("-");
            const recorrencia = await recorrenciaRepository.buscarRecorrenciaPorId(recorrenciaId);

            if (!recorrencia) {
                throw createHttpError(404, "Recorrencia nao encontrada.");
            }

            if (recorrencia.responsavelId !== userId) {
                throw createHttpError(403, "Usuario nao autorizado a pagar este gasto.");
            }

            const [ano, mes] = anoMes.split("-").map(Number);
            const dataVencimento = projecaoRecorrenciaService.calcularDataVencimentoNoMes(
                recorrencia.diaVencimento,
                new Date(Date.UTC(ano, mes - 1, 1))
            );

            let faturaCartaoId: string | null = null;
            if (recorrencia.cartaoCreditoId) {
                const cartao = await cartaoCreditoRepository.buscarCartaoCreditoPorId(recorrencia.cartaoCreditoId);
                if (cartao) {
                    const fatura = await faturaCartaoRepository.buscarOuCriarFaturaPorCompetencia(cartao, dataVencimento);
                    faturaCartaoId = fatura.id;
                }
            }

            const novoGasto = await gastoRepository.criarGastoUsuarioLogado({
                descricao: recorrencia.descricao,
                tipo: recorrencia.tipo,
                status: "pago",
                origemLancamento: "recorrente",
                numeroParcelas: 1,
                naoCompartilhar: Boolean(recorrencia.naoCompartilhar),
                valor: Number(recorrencia.valor),
                competencia: new Date(Date.UTC(ano, mes - 1, 1)),
                dataVencimento,
                dataPagamento: data.dataPagamento ?? new Date(),
                observacao: recorrencia.observacao ?? undefined,
                categoriaId: recorrencia.categoriaId,
                responsavelId: recorrencia.responsavelId,
                cartaoCreditoId: recorrencia.cartaoCreditoId ?? undefined,
                faturaCartaoId: faturaCartaoId ?? undefined,
                recorrenciaId: recorrencia.id,
                recorrenciaPaiId: recorrencia.id,
            });

            if (faturaCartaoId) {
                await faturaCartaoRepository.recalcularValorTotal(faturaCartaoId);
            }

            return novoGasto;
        }

        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.status === "pago") {
            throw createHttpError(400, "Gasto ja esta pago.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a pagar este gasto.");
        }

        if (gasto.origemLancamento === "parcelado") {
            if (data.competencia || data.pagarParcelaMesVigente) {
                const targetComp = data.competencia
                    || (data.dataPagamento ? new Date(data.dataPagamento).toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7));
                const lancamentosBase = Array.isArray((gasto as any).lancamentosBase)
                    ? (gasto as any).lancamentosBase
                    : await gastoRepository.listarLancamentosBasePorGastoId(id);

                const parcela = lancamentosBase.find((lb: any) => {
                    const compStr = lb.competencia instanceof Date ? lb.competencia.toISOString() : String(lb.competencia || "");
                    const vencStr = lb.dataVencimentoParcela instanceof Date ? lb.dataVencimentoParcela.toISOString() : String(lb.dataVencimentoParcela || "");
                    return compStr.startsWith(targetComp) || vencStr.startsWith(targetComp);
                });

                if (!parcela) {
                    throw createHttpError(404, "Parcela da competencia informada nao encontrada.");
                }

                if (parcela.status === "pago") {
                    throw createHttpError(400, "Parcela da competencia informada ja esta paga.");
                }

                const parcelaPaga = await gastoRepository.pagarLancamentoBase(parcela.id, data.dataPagamento ?? new Date());

                const todasPagas = lancamentosBase.length > 0 && lancamentosBase.every((p: any) => p.id === parcela.id || p.status === "pago");
                if (todasPagas) {
                    await gastoRepository.pagarGasto(id, data.dataPagamento ?? new Date());
                }

                return parcelaPaga;
            }

            const lancamentosBase = Array.isArray((gasto as any).lancamentosBase)
                ? (gasto as any).lancamentosBase
                : [];
            const todasParcelasPagas = lancamentosBase.length > 0
                && lancamentosBase.every((parcela: { status: string }) => parcela.status === "pago");

            if (!todasParcelasPagas) {
                throw createHttpError(400, "Gasto parcelado so pode ser quitado quando todas as parcelas estiverem pagas.");
            }
        }

        return await gastoRepository.pagarGasto(id, data.dataPagamento ?? new Date());
    }

    async reabrirGasto(id: string, userId: string) {
        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.status !== "pago") {
            throw createHttpError(400, "Somente gastos quitados podem ser reabertos.");
        }

        if ((gasto as any).cartaoCreditoId) {
            throw createHttpError(400, "Gastos de cartao de credito so podem ser reabertos pela tela de faturas.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a reabrir este gasto.");
        }

        return await gastoRepository.reabrirGasto(id);
    }

    async pagarParcela(id: string, data: iPagarGasto, userId: string) {
        const parcela = await gastoRepository.buscarLancamentoBasePorId(id);

        if (!parcela) {
            throw createHttpError(404, "Parcela nao encontrada.");
        }

        if (parcela.status === "pago") {
            throw createHttpError(400, "Parcela ja esta paga.");
        }

        if (parcela.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a pagar esta parcela.");
        }

        return await gastoRepository.pagarLancamentoBase(id, data.dataPagamento ?? new Date());
    }

    async reabrirParcela(id: string, userId: string) {
        const parcela = await gastoRepository.buscarLancamentoBasePorId(id);

        if (!parcela) {
            throw createHttpError(404, "Parcela nao encontrada.");
        }

        if (parcela.status !== "pago") {
            throw createHttpError(400, "Somente parcelas pagas podem ser reabertas.");
        }

        if (parcela.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a reabrir esta parcela.");
        }

        return await gastoRepository.reabrirLancamentoBase(id);
    }

    async deletarGasto(id: string, userId: string) {
        if (id.startsWith("virtual-")) {
            const parts = id.split("-");
            const recorrenciaId = parts.slice(1, 6).join("-");
            const recorrencia = await recorrenciaRepository.buscarRecorrenciaPorId(recorrenciaId);

            if (!recorrencia) {
                return { message: "Gasto recorrente excluido com sucesso." };
            }

            if (recorrencia.responsavelId !== userId) {
                throw createHttpError(403, "Usuario nao autorizado a excluir este gasto.");
            }

            await recorrenciaRepository.deletarRecorrencia(recorrenciaId);

            const registrosSerie = await gastoRepository.listarGastosDaSerieRecorrente(recorrenciaId);
            const faturasParaRecalcular = new Set<string>();
            for (const r of registrosSerie) {
                if ((r as any).faturaCartaoId) {
                    faturasParaRecalcular.add((r as any).faturaCartaoId);
                }
                await gastoRepository.deletarGasto(r.id);
            }
            for (const faturaId of faturasParaRecalcular) {
                await faturaCartaoRepository.recalcularValorTotal(faturaId);
            }

            return { message: "Gasto recorrente excluido com sucesso." };
        }

        const gasto = await gastoRepository.buscarGastoPorId(id);

        if (!gasto) {
            throw createHttpError(404, "Gasto nao encontrado.");
        }

        if (gasto.responsavelId !== userId) {
            throw createHttpError(403, "Usuario nao autorizado a excluir este gasto.");
        }

        const faturasParaRecalcular = new Set<string>();

        if ((gasto as any).faturaCartaoId) {
            faturasParaRecalcular.add((gasto as any).faturaCartaoId);
        }

        if (gasto.origemLancamento === "parcelado") {
            const parcelas = await gastoRepository.listarLancamentosBasePorGastoId(id);

            for (const parcela of parcelas) {
                if (parcela.faturaCartaoId) {
                    faturasParaRecalcular.add(parcela.faturaCartaoId);
                }
            }
        }

        await gastoRepository.deletarGasto(id);

        const recorrenciaId = (gasto as any).recorrenciaId || (gasto as any).recorrenciaPaiId;
        if (gasto.origemLancamento === "recorrente" && recorrenciaId) {
            try {
                await recorrenciaRepository.deletarRecorrencia(recorrenciaId);
                const registrosSerie = await gastoRepository.listarGastosDaSerieRecorrente(recorrenciaId);
                for (const r of registrosSerie) {
                    if (r.id !== id) {
                        if ((r as any).faturaCartaoId) {
                            faturasParaRecalcular.add((r as any).faturaCartaoId);
                        }
                        await gastoRepository.deletarGasto(r.id);
                    }
                }
            } catch {
                // Silencia se a regra ja foi excluida
            }
        }

        for (const faturaId of faturasParaRecalcular) {
            await faturaCartaoRepository.recalcularValorTotal(faturaId);
        }

        return { message: "Gasto marcado como excluido com sucesso." };
    }
}

export const gastoService = new GastoService();
