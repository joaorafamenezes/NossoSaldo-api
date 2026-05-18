import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class RelatorioRepository{
    
    async gerarRelatorioEvolucaoMensal(de: Date, ate: Date, userId: string){ 
        const relatorio = await prisma.$queryRaw`
            SELECT 
                DATE_FORMAT(g.competencia, '%Y-%m') AS referencia,
                SUM(g.valor) AS total_gasto
            FROM gasto g
            WHERE g.competencia IS NOT NULL
              AND g.competencia >= ${de}
              AND g.competencia <= ${ate}
              AND g.responsavelId = ${userId}
              AND g.deletedAt IS NULL
              AND g.tipo = 'despesa'
            GROUP BY DATE_FORMAT(g.competencia, '%Y-%m')
            ORDER BY referencia
        `;

        return relatorio;
    }

    async gerarRelatorioComparativoMensal(mesAtual: Date, mesAnterior: Date, userId: string){
        const relatorio = await prisma.$queryRaw`
            SELECT 
                DATE_FORMAT(g.competencia, '%Y-%m') AS referencia,
                SUM(CASE WHEN g.tipo = 'despesa' THEN g.valor ELSE 0 END) AS total_despesa,
                SUM(CASE WHEN g.tipo = 'receita' THEN g.valor ELSE 0 END) AS total_receita
            FROM gasto g
            WHERE g.competencia IS NOT NULL
              AND g.competencia >= ${mesAnterior}
              AND g.competencia <= ${mesAtual}
              AND g.responsavelId = ${userId}
              AND g.deletedAt IS NULL
            GROUP BY DATE_FORMAT(g.competencia, '%Y-%m')
            ORDER BY referencia
        `;

        return relatorio;
    }

    async gerarRelatorioTopCategoria(de: Date, ate: Date, userId: string){
        const relatorio = await prisma.$queryRaw`
            SELECT 
                c.descricao AS categoria,
                SUM(g.valor) AS total_gasto
            FROM gasto g
            JOIN categoria c ON g.categoriaId = c.id
            WHERE g.competencia IS NOT NULL
              AND g.competencia >= ${de}
              AND g.competencia <= ${ate}
              AND g.responsavelId = ${userId}
              AND g.deletedAt IS NULL
              AND g.tipo = 'despesa'
            GROUP BY c.descricao
            ORDER BY total_gasto DESC
            LIMIT 5
        `;

        return relatorio;
    }

    async gerarRelatorioQuemGastaMais(
        de: Date,
        ate: Date,
        usuarioLogadoId: string,
        usuario1Id: string,
        usuario2Id: string,
    ) {
        const relatorio = await prisma.$queryRaw`
            SELECT
                g.responsavelId AS usuario_id,
                SUM(g.valor) AS total_gasto
            FROM gasto g
            WHERE g.competencia IS NOT NULL
              AND g.competencia >= ${de}
              AND g.competencia <= ${ate}
              AND g.deletedAt IS NULL
              AND g.tipo = 'despesa'
              AND g.responsavelId IN (${usuario1Id}, ${usuario2Id})
              AND (
                g.responsavelId = ${usuarioLogadoId}
                OR (g.responsavelId <> ${usuarioLogadoId} AND g.naoCompartilhar = false)
              )
            GROUP BY g.responsavelId
        `;

        return relatorio;
    }
}


export const relatorioRepository = new RelatorioRepository();
