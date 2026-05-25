import { relatorioRepository } from "../../repositories/relatorio/relatorioRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import createHttpError from "http-errors";
import { gastoService } from "../gasto/gastoService";

type RelatorioComparativoMensalItem = {
    referencia: string;
    total_despesa: number | string;
    total_receita: number | string;
};

type RelatorioQuemGastaMaisItem = {
    usuario_id: string;
    total_gasto: number | string;
};

class RelatorioService{
    async gerarRelatorioEvolucaoMensal(de: string, ate: string, userId: string){
        const dataDe = new Date(de);
        const dataAte = new Date(ate);

        dataAte.setHours(23, 59, 59, 999)

        await gastoService.gerarGastosRecorrentesPorPeriodo(userId, dataDe, dataAte);

        return await relatorioRepository.gerarRelatorioEvolucaoMensal(dataDe, dataAte, userId);
    }

    async gerarRelatorioComparativoMensal(mesAtual: string, mesAnterior: string, userId: string){
        const dataMesAtual = new Date(mesAtual);
        const dataMesAnterior = new Date(mesAnterior);

        dataMesAtual.setHours(23, 59, 59, 999)

        await gastoService.gerarGastosRecorrentesPorPeriodo(userId, dataMesAnterior, dataMesAtual);

        const relatorio = await relatorioRepository.gerarRelatorioComparativoMensal(
            dataMesAtual,
            dataMesAnterior,
            userId
        ) as RelatorioComparativoMensalItem[];

        const referenciaMesAtual = mesAtual.slice(0, 7);
        const referenciaMesAnterior = mesAnterior.slice(0, 7);

        const registroMesAtual = relatorio.find((item: any) => item.referencia === referenciaMesAtual);
        const registroMesAnterior = relatorio.find((item: any) => item.referencia === referenciaMesAnterior);

        const totalMesAtual = Number(registroMesAtual?.total_despesa ?? 0);
        const totalMesAnterior = Number(registroMesAnterior?.total_despesa ?? 0);

        const variacaoCalculada = totalMesAnterior === 0
            ? (totalMesAtual > 0 ? 100 : 0)
            : ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100;

        const variacaoFormatada = `${variacaoCalculada >= 0 ? "+" : ""}${variacaoCalculada.toFixed(1)}%`;

        return {
            mesAtual: totalMesAtual,
            mesAnterior: totalMesAnterior,
            variacao: variacaoFormatada,
        };
    }

    async gerarRelatorioTopCategoria(de: string, ate: string, userId: string){
        const dataDe = new Date(de);
        const dataAte = new Date(ate);

        dataAte.setHours(23, 59, 59, 999)

        await gastoService.gerarGastosRecorrentesPorPeriodo(userId, dataDe, dataAte);

        return await relatorioRepository.gerarRelatorioTopCategoria(dataDe, dataAte, userId);
    }

    async gerarRelatorioQuemGastaMais(de: string, ate: string, userId: string) {
        const dataDe = new Date(de);
        const dataAte = new Date(ate);
        dataAte.setHours(23, 59, 59, 999);

        const contasConjuntas = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(userId);
        const contaConjuntaAtiva = contasConjuntas[0];

        if (!contaConjuntaAtiva) {
            throw createHttpError(404, "Usuario nao possui conta conjunta ativa.");
        }

        await gastoService.gerarGastosRecorrentesPorPeriodo(contaConjuntaAtiva.usuario1Id, dataDe, dataAte);
        await gastoService.gerarGastosRecorrentesPorPeriodo(contaConjuntaAtiva.usuario2Id, dataDe, dataAte);

        const totais = await relatorioRepository.gerarRelatorioQuemGastaMais(
            dataDe,
            dataAte,
            userId,
            contaConjuntaAtiva.usuario1Id,
            contaConjuntaAtiva.usuario2Id,
        ) as RelatorioQuemGastaMaisItem[];

        const participantes = [
            {
                nome: contaConjuntaAtiva.usuario1.nome,
                id: contaConjuntaAtiva.usuario1.id,
                total: 0,
            },
            {
                nome: contaConjuntaAtiva.usuario2.nome,
                id: contaConjuntaAtiva.usuario2.id,
                total: 0,
            },
        ].map((participante) => {
            const totalEncontrado = totais.find((item) => item.usuario_id === participante.id);

            return {
                ...participante,
                total: Number(totalEncontrado?.total_gasto ?? 0),
            };
        });

        const totalGeral = participantes.reduce((acumulador, participante) => acumulador + participante.total, 0);
        const ranking = participantes
            .map((participante) => ({
                nome: participante.nome,
                total: participante.total,
                percentual: totalGeral > 0
                    ? Math.round((participante.total / totalGeral) * 100)
                    : 0,
            }))
            .sort((primeiro, segundo) => segundo.total - primeiro.total);

        return {
            usuario1: ranking[0],
            usuario2: ranking[1],
        };
    }
}

export const relatorioService = new RelatorioService();
