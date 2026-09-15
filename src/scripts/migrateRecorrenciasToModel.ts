import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/prisma";

export interface MigrationResult {
  seriesProcessadas: number;
  gastosVinculados: number;
  seriesIgnoradas: number;
}

export async function migrateRecorrenciasToModel(
  prisma: PrismaClient = defaultPrisma
): Promise<MigrationResult> {
  console.log("Iniciando migracao de recorrencias para a tabela Recorrencia...");

  const gastosRecorrentes = await prisma.gasto.findMany({
    where: {
      origemLancamento: "recorrente",
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (gastosRecorrentes.length === 0) {
    console.log("Nenhum gasto recorrente encontrado para migracao.");
    return { seriesProcessadas: 0, gastosVinculados: 0, seriesIgnoradas: 0 };
  }

  // Agrupa os gastos por serie (recorrenciaPaiId ou o proprio id da raiz)
  const seriesMap = new Map<string, typeof gastosRecorrentes>();

  for (const gasto of gastosRecorrentes) {
    const serieKey = gasto.recorrenciaPaiId || gasto.id;
    if (!seriesMap.has(serieKey)) {
      seriesMap.set(serieKey, []);
    }
    seriesMap.get(serieKey)!.push(gasto);
  }

  let seriesProcessadas = 0;
  let gastosVinculados = 0;
  let seriesIgnoradas = 0;

  for (const [serieKey, gastosDaSerie] of seriesMap.entries()) {
    // Verifica se ja foi migrado anteriormente
    const jaMigrado = gastosDaSerie.find((g) => g.recorrenciaId !== null);
    if (jaMigrado && jaMigrado.recorrenciaId) {
      console.log(`Serie ${serieKey} ja possui recorrenciaId (${jaMigrado.recorrenciaId}). Pulando...`);
      seriesIgnoradas++;
      continue;
    }

    // Identifica o gasto raiz (id === serieKey ou o com menor data de vencimento/criacao)
    const gastoRaiz =
      gastosDaSerie.find((g) => g.id === serieKey) ||
      gastosDaSerie.sort(
        (a, b) =>
          (a.dataVencimento?.getTime() ?? 0) - (b.dataVencimento?.getTime() ?? 0)
      )[0];

    const dataVencimento = gastoRaiz.dataVencimento ?? new Date();
    const diaVencimento = dataVencimento.getUTCDate ? dataVencimento.getUTCDate() : dataVencimento.getDate();
    const dataInicio =
      gastoRaiz.dataInicioRecorrencia ??
      gastoRaiz.dataVencimento ??
      gastoRaiz.competencia ??
      new Date();
    const dataFim = gastoRaiz.dataFimRecorrencia ?? null;

    // Cria a entidade Recorrencia dedicada
    const recorrenciaCriada = await prisma.recorrencia.create({
      data: {
        descricao: gastoRaiz.descricao,
        tipo: gastoRaiz.tipo,
        valor: gastoRaiz.valor,
        diaVencimento,
        frequencia: "mensal",
        dataInicio,
        dataFim,
        naoCompartilhar: gastoRaiz.naoCompartilhar,
        observacao: gastoRaiz.observacao,
        categoriaId: gastoRaiz.categoriaId,
        responsavelId: gastoRaiz.responsavelId,
        cartaoCreditoId: gastoRaiz.cartaoCreditoId,
      },
    });

    // Vincula todos os gastos pertencentes a esta serie ao novo recorrenciaId
    const updateResult = await prisma.gasto.updateMany({
      where: {
        id: { in: gastosDaSerie.map((g) => g.id) },
      },
      data: {
        recorrenciaId: recorrenciaCriada.id,
      },
    });

    seriesProcessadas++;
    gastosVinculados += updateResult.count;
    console.log(
      `Serie ${serieKey} ("${gastoRaiz.descricao}") migrada com sucesso -> Recorrencia ${recorrenciaCriada.id} (${updateResult.count} lancamentos vinculados).`
    );
  }

  console.log(
    `Migracao concluida: ${seriesProcessadas} series criadas, ${gastosVinculados} lancamentos vinculados, ${seriesIgnoradas} series ignoradas (ja migradas).`
  );

  return { seriesProcessadas, gastosVinculados, seriesIgnoradas };
}

if (require.main === module) {
  migrateRecorrenciasToModel()
    .then(() => {
      console.log("Script finalizado com sucesso.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Erro ao executar script de migracao:", error);
      process.exit(1);
    });
}
