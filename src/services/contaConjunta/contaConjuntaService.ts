import createHttpError from "http-errors";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { ContaConjuntaRepositoryPort } from "../../ports/outbound/contaConjuntaRepositoryPort";
import { UsuarioRepositoryPort } from "../../ports/outbound/usuarioRepositoryPort";

export class ContaConjuntaService {
  constructor(
    private readonly usuarioRepository: UsuarioRepositoryPort,
    private readonly contaConjuntaRepository: ContaConjuntaRepositoryPort,
  ) {}

  async criarContaConjunta(data: iCriarContaConjunta, usuarioPayload: string) {
    const contasAtivasDoUsuarioLogado = await this.contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioPayload);

    if (contasAtivasDoUsuarioLogado.length > 0) {
      throw createHttpError(409, "Usuario ja possui uma conta conjunta ativa.");
    }

    const usuarioConjuntoValidado = data.usuarioConjunto.includes("@")
      ? await this.usuarioRepository.buscarUsuarioPorEmail(data.usuarioConjunto)
      : await this.usuarioRepository.listarUsuarioPorId(data.usuarioConjunto);
    const usuarioLogadoValidado = await this.usuarioRepository.listarUsuarioPorId(usuarioPayload);

    if (!usuarioConjuntoValidado) {
      throw createHttpError(404, "A conta informada nao foi localizada em nossa base de dados.");
    }

    if (!usuarioLogadoValidado) {
      throw createHttpError(404, "Usuario logado nao foi localizado.");
    }

    if (usuarioConjuntoValidado.id === usuarioLogadoValidado.id) {
      throw createHttpError(400, "Nao e possivel criar uma conta conjunta com o proprio usuario.");
    }

    const contasAtivasDoUsuarioConjunto = await this.contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioConjuntoValidado.id);

    if (contasAtivasDoUsuarioConjunto.length > 0) {
      throw createHttpError(409, "Usuario informado ja possui uma conta conjunta ativa.");
    }

    const contaConjuntaAtivaExistente = await this.contaConjuntaRepository.listarContaConjuntaPorIds(
      usuarioConjuntoValidado.id,
      usuarioLogadoValidado.id,
    );

    if (contaConjuntaAtivaExistente) {
      throw createHttpError(409, "A conta conjunta ja esta ativa para esses usuarios.");
    }

    return await this.contaConjuntaRepository.criarContaConjunta(data.nomeConta, usuarioConjuntoValidado.id, usuarioLogadoValidado.id);
  }

  async listarContasConjuntasPorUsuarioId(usuarioId: string) {
    const usuario = await this.usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    return await this.contaConjuntaRepository.listarContasConjuntasPorUsuarioId(usuarioId);
  }

  async desvincularContaConjunta(id: string, usuarioId: string) {
    const usuario = await this.usuarioRepository.listarUsuarioPorId(usuarioId);
    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    const contaConjunta = await this.contaConjuntaRepository.buscarContaConjuntaPorId(id);
    if (!contaConjunta) {
      throw createHttpError(404, "Conta conjunta nao encontrada.");
    }

    if (contaConjunta.usuario1Id !== usuarioId && contaConjunta.usuario2Id !== usuarioId) {
      throw createHttpError(403, "Usuario nao autorizado a desvincular esta conta conjunta.");
    }

    const contaConjuntaRemovida = await this.contaConjuntaRepository.desvincularContaConjunta(id) as { deletedAt: Date | null };

    return { message: "Conta conjunta desvinculada com sucesso.", deletedAt: contaConjuntaRemovida.deletedAt };
  }
}

export const contaConjuntaService = new ContaConjuntaService(usuarioRepository, contaConjuntaRepository);
