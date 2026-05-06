import createHttpError from "http-errors";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";

class ContaConjuntaService {
  async criarContaConjunta(data: iCriarContaConjunta, usuarioPayload: string) {
    const nomeConta = data.nomeConta;
    const usuarioConjunto = data.usuarioConjunto;
    const usuarioLogado = usuarioPayload;
    const contasAtivasDoUsuarioLogado = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioLogado);

    if (contasAtivasDoUsuarioLogado.length > 0) {
      throw createHttpError(409, "Usuario ja possui uma conta conjunta ativa.");
    }

    const usuarioConjuntoValidado = usuarioConjunto.includes("@")
      ? await usuarioRepository.buscarUsuarioPorEmail(usuarioConjunto)
      : await usuarioRepository.listarUsuarioPorId(usuarioConjunto);
    const usuarioLogadoValidado = await usuarioRepository.listarUsuarioPorId(usuarioLogado);

    if (!usuarioConjuntoValidado) {
      throw createHttpError(404, "A conta informada nao foi localizada em nossa base de dados.");
    }

    if (!usuarioLogadoValidado) {
      throw createHttpError(404, "Usuario logado nao foi localizado.");
    }

    if (usuarioConjuntoValidado.id === usuarioLogadoValidado.id) {
      throw createHttpError(400, "Nao e possivel criar uma conta conjunta com o proprio usuario.");
    }

    const contasAtivasDoUsuarioConjunto = await contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioConjuntoValidado.id);

    if (contasAtivasDoUsuarioConjunto.length > 0) {
      throw createHttpError(409, "Usuario informado ja possui uma conta conjunta ativa.");
    }

    const contaConjuntaAtivaExistente = await contaConjuntaRepository.listarContaConjuntaPorIds(
      usuarioConjuntoValidado.id,
      usuarioLogadoValidado.id,
    );

    if (contaConjuntaAtivaExistente) {
      throw createHttpError(409, "A conta conjunta ja esta ativa para esses usuarios.");
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

  async desvincularContaConjunta(id: string, usuarioId: string) {
    const usuario = await usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    const contaConjunta = await contaConjuntaRepository.buscarContaConjuntaPorId(id);

    if (!contaConjunta) {
      throw createHttpError(404, "Conta conjunta nao encontrada.");
    }

    const usuarioParticipaDaConta = contaConjunta.usuario1Id === usuarioId || contaConjunta.usuario2Id === usuarioId;

    if (!usuarioParticipaDaConta) {
      throw createHttpError(403, "Usuario nao autorizado a desvincular esta conta conjunta.");
    }

    const contaConjuntaRemovida = await contaConjuntaRepository.desvincularContaConjunta(id) as {
      deletedAt: Date | null;
    };

    return {
      message: "Conta conjunta desvinculada com sucesso.",
      deletedAt: contaConjuntaRemovida.deletedAt,
    };
  }
}

export const contaConjuntaService = new ContaConjuntaService();
