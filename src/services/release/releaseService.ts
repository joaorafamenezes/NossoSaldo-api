import { PrismaReleaseRepository, releaseRepository as defaultReleaseRepository } from "../../repositories/release/releaseRepository";
import createHttpError from "http-errors";

export class ReleaseService {
  constructor(private readonly repository: PrismaReleaseRepository = defaultReleaseRepository) {}

  async obterStatusVisualizacao(usuarioId: string, versaoAtual?: string) {
    if (!usuarioId) {
      throw createHttpError(400, "Identificador de usuário é obrigatório.");
    }

    const views = await this.repository.buscarVersoesVisualizadas(usuarioId);
    const seenVersions = views.map((v) => v.versao);
    const latestSeenVersion = views[0]?.versao ?? null;

    let hasSeenCurrentVersion = false;
    if (versaoAtual) {
      hasSeenCurrentVersion = seenVersions.includes(versaoAtual);
    }

    return {
      hasSeenCurrentVersion,
      latestSeenVersion,
      seenVersions,
    };
  }

  async marcarComoVisualizada(usuarioId: string, versao: string) {
    if (!usuarioId) {
      throw createHttpError(400, "Identificador de usuário é obrigatório.");
    }

    if (!versao || typeof versao !== "string" || versao.trim() === "") {
      throw createHttpError(400, "A versão da release é obrigatória.");
    }

    const trimmedVersion = versao.trim();
    const result = await this.repository.marcarVersaoVisualizada(usuarioId, trimmedVersion);

    return {
      success: true,
      versao: result.versao,
      visualizadoEm: result.visualizadoEm,
    };
  }
}

export const releaseService = new ReleaseService();
