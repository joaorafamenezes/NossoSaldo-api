import createHttpError from "http-errors";
import iAtualizarGasto from "../../@types/gasto/iAtualizarGasto";
import iCriarGasto from "../../@types/gasto/iCriarGasto";
import iPagarGasto from "../../@types/gasto/iPagarGasto";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";
import { gastoRepository } from "../../repositories/gasto/gastoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";

class GastoService {
    private getInicioMes(date: Date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    private getFimMes(date: Date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }

    private getMesesNoPeriodo(de: Date, ate: Date) {
        const meses: Date[] = [];
        const cursor = this.getInicioMes(de);
        const fim = this.getInicioMes(ate);

        while (cursor <= fim) {
            meses.push(new Date(cursor));
            cursor.setMonth(cursor.getMonth() + 1);
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
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    private isMesmoOuDepois(primeira: Date, segunda: Date) {
        return primeira.getTime() >= segunda.getTime();
    }

    private async sincronizarSerieRecorrente(
        gastoBase: any,
        alteracoes: iAtualizarGasto,
        gastoRaiz: any,
        cartao: any,
    ) {
        const recorrenciaPaiId = gastoRaiz.id;
        const competenciaInicial = this.getCompetenciaBase(gastoBase);
        const dataInicioRecorrencia = gastoRaiz.dataInicioRecorrencia ?? gastoBase.dataInicioRecorrencia ?? gastoBase.dataVencimento;
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
        const registrosPorMes = new Map(
            registrosSerie.map((registro: any) => [this.getMesKey(this.getCompetenciaBase(registro)), registro]),
        );
        const faturasParaRecalcular = new Set<string>();
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
        const mesesDesejados = dataFimRecorrencia
            ? this.getMesesNoPeriodo(competenciaInicial, new Date(dataFimRecorrencia))
            : registrosSerie
                .map((registro: any) => this.getCompetenciaBase(registro))
                .filter((competencia) => this.isMesmoOuDepois(competencia, competenciaInicial));

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

        if (filtros?.competencia) {
            await this.gerarGastosRecorrentesPorPeriodo(
                responsavelId,
                new Date(`${filtros.competencia}-01T00:00:00`),
                new Date(`${filtros.competencia}-01T00:00:00`),
            );
        } else if (filtros?.de && filtros?.ate) {
            await this.gerarGastosRecorrentesPorPeriodo(
                responsavelId,
                new Date(filtros.de),
                new Date(filtros.ate),
            );
        } else {
            await this.gerarGastosRecorrentesDoMes(responsavelId);
        }

        return await gastoRepository.listarGastosPorResponsavelId(responsavelId);
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

        const cartao = await this.validarCartaoCreditoPermitido(data.cartaoCreditoId, userId);

        if (gasto.origemLancamento === "recorrente") {
            const recorrenciaPaiId = (gasto as any).recorrenciaPaiId ?? gasto.id;
            const gastoRaiz = recorrenciaPaiId === gasto.id
                ? gasto
                : await gastoRepository.buscarGastoPorId(recorrenciaPaiId);

            if (!gastoRaiz) {
                throw createHttpError(404, "Modelo da recorrencia nao encontrado.");
            }

            await this.sincronizarSerieRecorrente(gasto as any, data, gastoRaiz as any, cartao);

            return await gastoRepository.buscarGastoPorId(id);
        }

        return await gastoRepository.atualizarGasto(id, data);
    }

    async pagarGasto(id: string, data: iPagarGasto, userId: string) {
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

    async deletarGasto(id: string, userId: string) {
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

        for (const faturaId of faturasParaRecalcular) {
            await faturaCartaoRepository.recalcularValorTotal(faturaId);
        }

        return { message: "Gasto marcado como excluido com sucesso." };
    }
}

export const gastoService = new GastoService();
