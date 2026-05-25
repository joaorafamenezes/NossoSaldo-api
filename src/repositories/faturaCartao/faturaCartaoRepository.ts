import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { createRepositoryError } from "../../errors/httpError";

const prisma = new PrismaClient();

type CartaoFaturaInput = {
  id: string;
  diaFechamento: number;
  diaVencimento: number;
};

type FaturaCartaoRow = {
  id: string;
  cartaoCreditoId: string;
  cartaoDescricao?: string;
  cartaoValorLimite?: number;
  cartaoUsuarioId?: string;
  cartaoUsuarioNome?: string;
  cartaoUsuarioEmail?: string;
  origemCartao?: "proprio" | "conta_conjunta";
  competencia: string;
  dataAbertura: Date;
  dataFechamento: Date;
  dataVencimento: Date;
  valorTotal: number;
  status: "aberta" | "fechada" | "paga" | "vencida" | "cancelada";
  dataPagamento: Date | null;
  observacoes: string | null;
  totalGastos?: number;
  createdAt: Date;
  updatedAt: Date;
};

function getLastDayOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function createDateKeepingMonth(year: number, month: number, day: number) {
  const safeDay = Math.min(day, getLastDayOfMonth(year, month));
  return new Date(year, month, safeDay);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatCompetencia(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function calcularPeriodoFatura(cartao: CartaoFaturaInput, dataReferencia: Date) {
  const referencia = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate(),
  );
  const mesCompetencia = referencia.getDate() <= cartao.diaFechamento
    ? new Date(referencia.getFullYear(), referencia.getMonth(), 1)
    : addMonths(referencia, 1);

  const dataFechamento = createDateKeepingMonth(
    mesCompetencia.getFullYear(),
    mesCompetencia.getMonth(),
    cartao.diaFechamento,
  );
  const mesVencimento = cartao.diaVencimento > cartao.diaFechamento
    ? mesCompetencia
    : addMonths(mesCompetencia, 1);
  const dataVencimento = createDateKeepingMonth(
    mesVencimento.getFullYear(),
    mesVencimento.getMonth(),
    cartao.diaVencimento,
  );
  const fechamentoAnterior = createDateKeepingMonth(
    mesCompetencia.getFullYear(),
    mesCompetencia.getMonth() - 1,
    cartao.diaFechamento,
  );
  const dataAbertura = new Date(fechamentoAnterior);
  dataAbertura.setDate(dataAbertura.getDate() + 1);

  return {
    competencia: formatCompetencia(mesCompetencia),
    dataAbertura,
    dataFechamento,
    dataVencimento,
  };
}

function calcularPeriodoFaturaPorCompetencia(cartao: CartaoFaturaInput, competenciaReferencia: Date) {
  const mesCompetencia = new Date(
    competenciaReferencia.getFullYear(),
    competenciaReferencia.getMonth(),
    1,
  );

  const dataFechamento = createDateKeepingMonth(
    mesCompetencia.getFullYear(),
    mesCompetencia.getMonth(),
    cartao.diaFechamento,
  );
  const mesVencimento = cartao.diaVencimento > cartao.diaFechamento
    ? mesCompetencia
    : addMonths(mesCompetencia, 1);
  const dataVencimento = createDateKeepingMonth(
    mesVencimento.getFullYear(),
    mesVencimento.getMonth(),
    cartao.diaVencimento,
  );
  const fechamentoAnterior = createDateKeepingMonth(
    mesCompetencia.getFullYear(),
    mesCompetencia.getMonth() - 1,
    cartao.diaFechamento,
  );
  const dataAbertura = new Date(fechamentoAnterior);
  dataAbertura.setDate(dataAbertura.getDate() + 1);

  return {
    competencia: formatCompetencia(mesCompetencia),
    dataAbertura,
    dataFechamento,
    dataVencimento,
  };
}

class FaturaCartaoRepository {
  async buscarFaturaPorIdParaUsuario(faturaId: string, usuarioId: string) {
    try {
      const [fatura] = await prisma.$queryRaw<FaturaCartaoRow[]>`
        SELECT
          fatura.id,
          fatura.cartaoCreditoId,
          cartao.descricao AS cartaoDescricao,
          cartao.valorLimite AS cartaoValorLimite,
          usuario.id AS cartaoUsuarioId,
          usuario.nome AS cartaoUsuarioNome,
          usuario.email AS cartaoUsuarioEmail,
          CASE
            WHEN cartao.usuarioId = ${usuarioId} THEN 'proprio'
            ELSE 'conta_conjunta'
          END AS origemCartao,
          fatura.competencia,
          fatura.dataAbertura,
          fatura.dataFechamento,
          fatura.dataVencimento,
          fatura.valorTotal,
          fatura.status,
          fatura.dataPagamento,
          fatura.observacoes,
          fatura.createdAt,
          fatura.updatedAt
        FROM FaturaCartao fatura
        INNER JOIN CartaoCredito cartao ON cartao.id = fatura.cartaoCreditoId
        INNER JOIN Usuario usuario ON usuario.id = cartao.usuarioId
        WHERE fatura.id = ${faturaId}
          AND (
            cartao.usuarioId = ${usuarioId}
            OR cartao.usuarioId IN (
              SELECT
                CASE
                  WHEN conta.usuario1Id = ${usuarioId} THEN conta.usuario2Id
                  ELSE conta.usuario1Id
                END
              FROM ContaConjunta conta
              WHERE conta.deletedAt IS NULL
                AND (conta.usuario1Id = ${usuarioId} OR conta.usuario2Id = ${usuarioId})
            )
          )
        LIMIT 1
      `;

      return fatura ?? null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar a fatura do cartao.");
    }
  }

  async listarFaturasPorUsuario(usuarioId: string, cartaoCreditoId?: string) {
    try {
      const cartaoFilter = cartaoCreditoId
        ? prisma.$queryRaw<FaturaCartaoRow[]>`
          SELECT
            fatura.id,
            fatura.cartaoCreditoId,
            cartao.descricao AS cartaoDescricao,
            cartao.valorLimite AS cartaoValorLimite,
            usuario.id AS cartaoUsuarioId,
            usuario.nome AS cartaoUsuarioNome,
            usuario.email AS cartaoUsuarioEmail,
            CASE
              WHEN cartao.usuarioId = ${usuarioId} THEN 'proprio'
              ELSE 'conta_conjunta'
            END AS origemCartao,
            fatura.competencia,
            fatura.dataAbertura,
            fatura.dataFechamento,
            fatura.dataVencimento,
            fatura.valorTotal,
            fatura.status,
            fatura.dataPagamento,
            fatura.observacoes,
            (
              SELECT COUNT(gastoUnico.id)
              FROM Gasto gastoUnico
              WHERE gastoUnico.faturaCartaoId = fatura.id
                AND gastoUnico.deletedAt IS NULL
            ) + (
              SELECT COUNT(lancamento.id)
              FROM LancamentoBase lancamento
              INNER JOIN Gasto gastoParcelado ON gastoParcelado.id = lancamento.gastoId
              WHERE lancamento.faturaCartaoId = fatura.id
                AND gastoParcelado.deletedAt IS NULL
            ) AS totalGastos,
            fatura.createdAt,
            fatura.updatedAt
          FROM FaturaCartao fatura
          INNER JOIN CartaoCredito cartao ON cartao.id = fatura.cartaoCreditoId
          INNER JOIN Usuario usuario ON usuario.id = cartao.usuarioId
          WHERE fatura.cartaoCreditoId = ${cartaoCreditoId}
            AND (
              cartao.usuarioId = ${usuarioId}
              OR cartao.usuarioId IN (
                SELECT
                  CASE
                    WHEN conta.usuario1Id = ${usuarioId} THEN conta.usuario2Id
                    ELSE conta.usuario1Id
                  END
                FROM ContaConjunta conta
                WHERE conta.deletedAt IS NULL
                  AND (conta.usuario1Id = ${usuarioId} OR conta.usuario2Id = ${usuarioId})
              )
            )
          GROUP BY
            fatura.id,
            fatura.cartaoCreditoId,
            cartao.descricao,
            cartao.valorLimite,
            usuario.id,
            usuario.nome,
            usuario.email,
            cartao.usuarioId,
            fatura.competencia,
            fatura.dataAbertura,
            fatura.dataFechamento,
            fatura.dataVencimento,
            fatura.valorTotal,
            fatura.status,
            fatura.dataPagamento,
            fatura.observacoes,
            fatura.createdAt,
            fatura.updatedAt
          ORDER BY fatura.dataVencimento DESC
        `
        : prisma.$queryRaw<FaturaCartaoRow[]>`
          SELECT
            fatura.id,
            fatura.cartaoCreditoId,
            cartao.descricao AS cartaoDescricao,
            cartao.valorLimite AS cartaoValorLimite,
            usuario.id AS cartaoUsuarioId,
            usuario.nome AS cartaoUsuarioNome,
            usuario.email AS cartaoUsuarioEmail,
            CASE
              WHEN cartao.usuarioId = ${usuarioId} THEN 'proprio'
              ELSE 'conta_conjunta'
            END AS origemCartao,
            fatura.competencia,
            fatura.dataAbertura,
            fatura.dataFechamento,
            fatura.dataVencimento,
            fatura.valorTotal,
            fatura.status,
            fatura.dataPagamento,
            fatura.observacoes,
            (
              SELECT COUNT(gastoUnico.id)
              FROM Gasto gastoUnico
              WHERE gastoUnico.faturaCartaoId = fatura.id
                AND gastoUnico.deletedAt IS NULL
            ) + (
              SELECT COUNT(lancamento.id)
              FROM LancamentoBase lancamento
              INNER JOIN Gasto gastoParcelado ON gastoParcelado.id = lancamento.gastoId
              WHERE lancamento.faturaCartaoId = fatura.id
                AND gastoParcelado.deletedAt IS NULL
            ) AS totalGastos,
            fatura.createdAt,
            fatura.updatedAt
          FROM FaturaCartao fatura
          INNER JOIN CartaoCredito cartao ON cartao.id = fatura.cartaoCreditoId
          INNER JOIN Usuario usuario ON usuario.id = cartao.usuarioId
          WHERE cartao.usuarioId = ${usuarioId}
            OR cartao.usuarioId IN (
              SELECT
                CASE
                  WHEN conta.usuario1Id = ${usuarioId} THEN conta.usuario2Id
                  ELSE conta.usuario1Id
                END
              FROM ContaConjunta conta
              WHERE conta.deletedAt IS NULL
                AND (conta.usuario1Id = ${usuarioId} OR conta.usuario2Id = ${usuarioId})
            )
          GROUP BY
            fatura.id,
            fatura.cartaoCreditoId,
            cartao.descricao,
            cartao.valorLimite,
            usuario.id,
            usuario.nome,
            usuario.email,
            cartao.usuarioId,
            fatura.competencia,
            fatura.dataAbertura,
            fatura.dataFechamento,
            fatura.dataVencimento,
            fatura.valorTotal,
            fatura.status,
            fatura.dataPagamento,
            fatura.observacoes,
            fatura.createdAt,
            fatura.updatedAt
          ORDER BY fatura.dataVencimento DESC
        `;

      const faturas = await cartaoFilter;

      return faturas.map((fatura) => ({
        ...fatura,
        totalGastos: Number(fatura.totalGastos ?? 0),
      }));
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar as faturas do cartao.");
    }
  }

  async buscarOuCriarFatura(cartao: CartaoFaturaInput, dataReferencia: Date) {
    try {
      const periodo = calcularPeriodoFatura(cartao, dataReferencia);
      return await this.buscarOuCriarFaturaPorPeriodo(cartao, periodo);
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar ou criar a fatura do cartao.");
    }
  }

  async buscarOuCriarFaturaPorCompetencia(cartao: CartaoFaturaInput, competenciaReferencia: Date) {
    try {
      const periodo = calcularPeriodoFaturaPorCompetencia(cartao, competenciaReferencia);
      return await this.buscarOuCriarFaturaPorPeriodo(cartao, periodo);
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar ou criar a fatura do cartao.");
    }
  }

  private async buscarOuCriarFaturaPorPeriodo(
    cartao: CartaoFaturaInput,
    periodo: ReturnType<typeof calcularPeriodoFatura>,
  ) {
    try {
      const id = randomUUID();

      await prisma.$executeRaw`
        INSERT IGNORE INTO FaturaCartao (
          id,
          cartaoCreditoId,
          competencia,
          dataAbertura,
          dataFechamento,
          dataVencimento,
          valorTotal,
          status,
          createdAt,
          updatedAt
        )
        VALUES (
          ${id},
          ${cartao.id},
          ${periodo.competencia},
          ${periodo.dataAbertura},
          ${periodo.dataFechamento},
          ${periodo.dataVencimento},
          0.00,
          'aberta',
          CURRENT_TIMESTAMP(3),
          CURRENT_TIMESTAMP(3)
        )
      `;

      const [fatura] = await prisma.$queryRaw<FaturaCartaoRow[]>`
        SELECT
          id,
          cartaoCreditoId,
          competencia,
          dataAbertura,
          dataFechamento,
          dataVencimento,
          valorTotal,
          status,
          dataPagamento,
          observacoes,
          createdAt,
          updatedAt
        FROM FaturaCartao
        WHERE cartaoCreditoId = ${cartao.id}
          AND competencia = ${periodo.competencia}
        LIMIT 1
      `;

      return fatura;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar ou criar a fatura do cartao.");
    }
  }

  async recalcularValorTotal(faturaCartaoId: string) {
    try {
      await prisma.$executeRaw`
        UPDATE FaturaCartao fatura
        SET
          valorTotal = (
            SELECT
              COALESCE((
                SELECT SUM(gasto.valor)
                FROM Gasto gasto
                WHERE gasto.faturaCartaoId = ${faturaCartaoId}
                  AND gasto.deletedAt IS NULL
                  AND gasto.tipo = 'despesa'
                  AND gasto.status <> 'cancelado'
                  AND gasto.origemLancamento <> 'parcelado'
              ), 0)
              +
              COALESCE((
                SELECT SUM(lancamento.valorParcela)
                FROM LancamentoBase lancamento
                INNER JOIN Gasto gastoParcelado ON gastoParcelado.id = lancamento.gastoId
                WHERE lancamento.faturaCartaoId = ${faturaCartaoId}
                  AND gastoParcelado.deletedAt IS NULL
                  AND gastoParcelado.tipo = 'despesa'
                  AND gastoParcelado.status <> 'cancelado'
              ), 0)
          ),
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE fatura.id = ${faturaCartaoId}
      `;

      const [fatura] = await prisma.$queryRaw<FaturaCartaoRow[]>`
        SELECT
          id,
          cartaoCreditoId,
          competencia,
          dataAbertura,
          dataFechamento,
          dataVencimento,
          valorTotal,
          status,
          dataPagamento,
          observacoes,
          createdAt,
          updatedAt
        FROM FaturaCartao
        WHERE id = ${faturaCartaoId}
        LIMIT 1
      `;

      return fatura;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel recalcular o valor total da fatura.");
    }
  }

  async pagarFatura(faturaCartaoId: string, dataPagamento: Date) {
    try {
      await prisma.$executeRaw`
        UPDATE FaturaCartao
        SET
          status = 'paga',
          dataPagamento = ${dataPagamento},
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ${faturaCartaoId}
      `;

      await prisma.$executeRaw`
        UPDATE Gasto
        SET
          status = 'pago',
          dataPagamento = ${dataPagamento},
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE faturaCartaoId = ${faturaCartaoId}
          AND deletedAt IS NULL
          AND status <> 'cancelado'
          AND origemLancamento <> 'parcelado'
      `;

      await prisma.$executeRaw`
        UPDATE LancamentoBase lancamento
        INNER JOIN Gasto gasto ON gasto.id = lancamento.gastoId
        SET
          lancamento.status = 'pago',
          lancamento.dataPagamentoParcela = ${dataPagamento},
          lancamento.updatedAt = CURRENT_TIMESTAMP(3)
        WHERE lancamento.faturaCartaoId = ${faturaCartaoId}
          AND gasto.deletedAt IS NULL
          AND gasto.status <> 'cancelado'
      `;

      await prisma.$executeRaw`
        UPDATE Gasto gasto
        SET
          gasto.status = 'pago',
          gasto.dataPagamento = COALESCE(gasto.dataPagamento, ${dataPagamento}),
          gasto.updatedAt = CURRENT_TIMESTAMP(3)
        WHERE gasto.origemLancamento = 'parcelado'
          AND gasto.deletedAt IS NULL
          AND gasto.status <> 'cancelado'
          AND gasto.id IN (
            SELECT parcela.gastoId
            FROM LancamentoBase parcela
            GROUP BY parcela.gastoId
            HAVING SUM(CASE WHEN parcela.status <> 'pago' THEN 1 ELSE 0 END) = 0
          )
      `;

      const [fatura] = await prisma.$queryRaw<FaturaCartaoRow[]>`
        SELECT
          id,
          cartaoCreditoId,
          competencia,
          dataAbertura,
          dataFechamento,
          dataVencimento,
          valorTotal,
          status,
          dataPagamento,
          observacoes,
          createdAt,
          updatedAt
        FROM FaturaCartao
        WHERE id = ${faturaCartaoId}
        LIMIT 1
      `;

      return fatura;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel pagar a fatura do cartao.");
    }
  }

  async reabrirFatura(faturaCartaoId: string) {
    try {
      await prisma.$executeRaw`
        UPDATE FaturaCartao
        SET
          status = 'aberta',
          dataPagamento = NULL,
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ${faturaCartaoId}
      `;

      await prisma.$executeRaw`
        UPDATE Gasto
        SET
          status = 'pendente',
          dataPagamento = NULL,
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE faturaCartaoId = ${faturaCartaoId}
          AND deletedAt IS NULL
          AND status <> 'cancelado'
          AND origemLancamento <> 'parcelado'
      `;

      await prisma.$executeRaw`
        UPDATE LancamentoBase lancamento
        INNER JOIN Gasto gasto ON gasto.id = lancamento.gastoId
        SET
          lancamento.status = 'pendente',
          lancamento.dataPagamentoParcela = NULL,
          lancamento.updatedAt = CURRENT_TIMESTAMP(3)
        WHERE lancamento.faturaCartaoId = ${faturaCartaoId}
          AND gasto.deletedAt IS NULL
          AND gasto.status <> 'cancelado'
      `;

      await prisma.$executeRaw`
        UPDATE Gasto gasto
        SET
          gasto.status = 'pendente',
          gasto.dataPagamento = NULL,
          gasto.updatedAt = CURRENT_TIMESTAMP(3)
        WHERE gasto.origemLancamento = 'parcelado'
          AND gasto.deletedAt IS NULL
          AND gasto.status <> 'cancelado'
          AND gasto.id IN (
            SELECT parcela.gastoId
            FROM LancamentoBase parcela
            WHERE parcela.faturaCartaoId = ${faturaCartaoId}
          )
      `;

      const [fatura] = await prisma.$queryRaw<FaturaCartaoRow[]>`
        SELECT
          id,
          cartaoCreditoId,
          competencia,
          dataAbertura,
          dataFechamento,
          dataVencimento,
          valorTotal,
          status,
          dataPagamento,
          observacoes,
          createdAt,
          updatedAt
        FROM FaturaCartao
        WHERE id = ${faturaCartaoId}
        LIMIT 1
      `;

      return fatura;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel reabrir a fatura do cartao.");
    }
  }
}

export const faturaCartaoRepository = new FaturaCartaoRepository();
