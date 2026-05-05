import createHttpError from "http-errors";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";

class ContaConjuntaService {
  async criarContaConjunta(data: iCriarContaConjunta, usuarioPayload: string) {
    const nomeConta = data.nomeConta;
    const usuarioConjunto = data.usuarioConjunto;
    const usuarioLogado = usuarioPayload;
    const contasDoUsuarioLogado = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioLogado);

    if (contasDoUsuarioLogado.length > 0) {
      throw createHttpError(409, "Usuario ja possui uma conta conjunta vinculada.");
    }

    const usuarioConjuntoValidado = usuarioConjunto.includes("@")
      ? await usuarioRepository.buscarUsuarioPorEmail(usuarioConjunto)
      : await usuarioRepository.listarUsuarioPorId(usuarioConjunto);
    const usuarioLogadoValidado = await usuarioRepository.listarUsuarioPorId(usuarioLogado);

    if (!usuarioConjuntoValidado || !usuarioLogadoValidado) {
      throw createHttpError(404, "Um ou ambos os usuarios nao foram encontrados.");
    }

    if (usuarioConjuntoValidado.id === usuarioLogadoValidado.id) {
      throw createHttpError(400, "Nao e possivel criar uma conta conjunta com o proprio usuario.");
    }

    const contaConjuntaExistente = await contaConjuntaRepository.listarContaConjuntaPorIds(usuarioConjuntoValidado.id, usuarioLogadoValidado.id);

    if (contaConjuntaExistente) {
      throw createHttpError(409, "A conta conjunta ja existe para esses usuarios.");
    }

    return await contaConjuntaRepository.criarContaConjunta(
      nomeConta,
      usuarioConjuntoValidado.id,
      usuarioLogadoValidado.id,
    );
  }

  async listarContasConjuntasPorUsuarioId(usuarioId: string) {
    const usuario = await usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    return await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioId);
  }
}

export const contaConjuntaService = new ContaConjuntaService();
