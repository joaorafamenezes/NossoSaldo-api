import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { createRepositoryError } from "../../errors/httpError";
import iCriarCartaoCredito from "../../@types/cartaoCredito/iCriarCartaoCredito";

const prisma = new PrismaClient();

type CartaoCreditoRow = {
  id: string;
  descricao: string;
  diaFechamento: number;
  diaVencimento: number;
  valorLimite: number;
  observacoes: string | null;
  usuarioId: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  origemCartao?: "proprio" | "conta_conjunta";
  createdAt: Date;
  updatedAt: Date;
};

class CartaoCreditoRepository {
  async criarCartaoCredito(usuarioId: string, cartao: iCriarCartaoCredito) {
    try {
      const id = randomUUID();
      const observacoes = cartao.observacoes?.trim() || null;

      await prisma.$executeRaw`
        INSERT INTO CartaoCredito (id, descricao, diaFechamento, diaVencimento, valorLimite, observacoes, usuarioId, createdAt, updatedAt)
        VALUES (${id}, ${cartao.descricao}, ${cartao.diaFechamento}, ${cartao.diaVencimento}, ${cartao.valorLimite}, ${observacoes}, ${usuarioId}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      `;

      const [cartaoCriado] = await prisma.$queryRaw<CartaoCreditoRow[]>`
        SELECT id, descricao, diaFechamento, diaVencimento, valorLimite, observacoes, usuarioId, createdAt, updatedAt
        FROM CartaoCredito
        WHERE id = ${id}
      `;

      return cartaoCriado;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel criar o cartao de credito.");
    }
  }

  async listarCartoesCreditoPorUsuario(usuarioId: string) {
    try {
      return await prisma.$queryRaw<CartaoCreditoRow[]>`
        SELECT
          cartao.id,
          cartao.descricao,
          cartao.diaFechamento,
          cartao.diaVencimento,
          cartao.valorLimite,
          cartao.observacoes,
          cartao.usuarioId,
          usuario.nome AS usuarioNome,
          usuario.email AS usuarioEmail,
          CASE
            WHEN cartao.usuarioId = ${usuarioId} THEN 'proprio'
            ELSE 'conta_conjunta'
          END AS origemCartao,
          cartao.createdAt,
          cartao.updatedAt
        FROM CartaoCredito cartao
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
        ORDER BY origemCartao ASC, cartao.createdAt DESC
      `;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel listar os cartoes de credito.");
    }
  }

  async buscarCartaoCreditoPorId(id: string) {
    try {
      const [cartao] = await prisma.$queryRaw<CartaoCreditoRow[]>`
        SELECT id, descricao, diaFechamento, diaVencimento, valorLimite, observacoes, usuarioId, createdAt, updatedAt
        FROM CartaoCredito
        WHERE id = ${id}
        LIMIT 1
      `;

      return cartao ?? null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel buscar o cartao de credito.");
    }
  }

  async atualizarCartaoCredito(id: string, cartao: iCriarCartaoCredito) {
    try {
      const observacoes = cartao.observacoes?.trim() || null;

      await prisma.$executeRaw`
        UPDATE CartaoCredito
        SET
          descricao = ${cartao.descricao},
          diaFechamento = ${cartao.diaFechamento},
          diaVencimento = ${cartao.diaVencimento},
          valorLimite = ${cartao.valorLimite},
          observacoes = ${observacoes},
          updatedAt = CURRENT_TIMESTAMP(3)
        WHERE id = ${id}
      `;

      const [cartaoAtualizado] = await prisma.$queryRaw<CartaoCreditoRow[]>`
        SELECT id, descricao, diaFechamento, diaVencimento, valorLimite, observacoes, usuarioId, createdAt, updatedAt
        FROM CartaoCredito
        WHERE id = ${id}
        LIMIT 1
      `;

      return cartaoAtualizado ?? null;
    } catch (error) {
      throw createRepositoryError(error, "Nao foi possivel atualizar o cartao de credito.");
    }
  }
}

export const cartaoCreditoRepository = new CartaoCreditoRepository();
