import createHttpError from "http-errors";
import {
  iCriarRecorrencia,
  iAtualizarRecorrencia,
  iPausarRecorrencia,
  iFiltroRecorrencias,
} from "../../@types/recorrencia/iRecorrencia";
import { recorrenciaRepository } from "../../repositories/recorrencia/recorrenciaRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { categoriaRepository } from "../../repositories/categoria/categoriaRepository";
import { cartaoCreditoRepository } from "../../repositories/cartaoCredito/cartaoCreditoRepository";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";

export class RecorrenciaService {
  async criarRecorrencia(data: iCriarRecorrencia, userId: string) {
    const usuario = await usuarioRepository.listarUsuarioPorId(userId);
    if (!usuario) {
      throw createHttpError(404, "Usuario responsavel nao encontrado.");
    }

    const categoria = await categoriaRepository.buscarCategoriaPorId(data.categoriaId);
    if (!categoria) {
      throw createHttpError(404, "Categoria nao encontrada.");
    }

    if (data.cartaoCreditoId) {
      const cartao = await cartaoCreditoRepository.buscarCartaoCreditoPorId(data.cartaoCreditoId);
      if (!cartao) {
        throw createHttpError(404, "Cartao de credito nao encontrado.");
      }
    }

    if (data.diaVencimento < 1 || data.diaVencimento > 31) {
      throw createHttpError(400, "Dia de vencimento deve estar entre 1 e 31.");
    }

    return await recorrenciaRepository.criarRecorrencia({
      ...data,
      responsavelId: userId,
    });
  }

  async buscarRecorrenciaPorId(id: string, userId: string) {
    const recorrencia = await recorrenciaRepository.buscarRecorrenciaPorId(id);
    if (!recorrencia) {
      throw createHttpError(404, "Recorrencia nao encontrada.");
    }

    const ehResponsavel = recorrencia.responsavelId === userId;
    const podeCompartilhar = !recorrencia.naoCompartilhar;

    if (!ehResponsavel) {
      const contasConjuntas = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(userId);
      const usuarioCompartilha = contasConjuntas.some(
        (c) => c.usuario1Id === recorrencia.responsavelId || c.usuario2Id === recorrencia.responsavelId
      );

      if (!podeCompartilhar || !usuarioCompartilha) {
        throw createHttpError(403, "Usuario nao autorizado a acessar esta recorrencia.");
      }
    }

    return recorrencia;
  }

  async listarRecorrenciasPorUsuario(userId: string, filtros?: iFiltroRecorrencias) {
    const usuario = await usuarioRepository.listarUsuarioPorId(userId);
    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    return await recorrenciaRepository.listarRecorrenciasPorUsuario(userId, filtros);
  }

  async atualizarRecorrencia(id: string, data: iAtualizarRecorrencia, userId: string) {
    await this.buscarRecorrenciaPorId(id, userId);

    if (data.categoriaId) {
      const categoria = await categoriaRepository.buscarCategoriaPorId(data.categoriaId);
      if (!categoria) {
        throw createHttpError(404, "Categoria nao encontrada.");
      }
    }

    if (data.diaVencimento && (data.diaVencimento < 1 || data.diaVencimento > 31)) {
      throw createHttpError(400, "Dia de vencimento deve estar entre 1 e 31.");
    }

    return await recorrenciaRepository.atualizarRecorrencia(id, data);
  }

  async pausarRecorrencia(id: string, data: iPausarRecorrencia, userId: string) {
    const recorrencia = await this.buscarRecorrenciaPorId(id, userId);

    if (recorrencia.pausado && !data.dataPausaInicio && !data.dataPausaFim) {
      throw createHttpError(400, "Esta recorrencia ja se encontra pausada.");
    }

    if (data.dataPausaInicio && data.dataPausaFim) {
      if (new Date(data.dataPausaFim).getTime() < new Date(data.dataPausaInicio).getTime()) {
        throw createHttpError(400, "Data de fim da pausa nao pode ser anterior a data de inicio.");
      }
    }

    return await recorrenciaRepository.pausarRecorrencia(id, data);
  }

  async retomarRecorrencia(id: string, userId: string) {
    const recorrencia = await this.buscarRecorrenciaPorId(id, userId);

    if (!recorrencia.pausado) {
      throw createHttpError(400, "Esta recorrencia nao esta pausada.");
    }

    return await recorrenciaRepository.retomarRecorrencia(id);
  }

  async deletarRecorrencia(id: string, userId: string) {
    await this.buscarRecorrenciaPorId(id, userId);
    await recorrenciaRepository.deletarRecorrencia(id);
    return { message: "Recorrencia cancelada e encerrada com sucesso." };
  }
}

export const recorrenciaService = new RecorrenciaService();
