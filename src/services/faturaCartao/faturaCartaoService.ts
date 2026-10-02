import createHttpError from "http-errors";
import iPagarGasto from "../../@types/gasto/iPagarGasto";
import { faturaCartaoRepository } from "../../repositories/faturaCartao/faturaCartaoRepository";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import { FaturaCartaoRepositoryPort } from "../../ports/outbound/faturaCartaoRepositoryPort";
import { UsuarioRepositoryPort } from "../../ports/outbound/usuarioRepositoryPort";
import { gastoService } from "../gasto/gastoService";

export interface GastoRecorrenteServicePort {
  sincronizarRecorrenciasCartoes(usuarioId: string): Promise<void>;
  gerarGastosRecorrentesDoMes(usuarioId: string, referencia?: Date): Promise<void>;
}

export class FaturaCartaoService {
  constructor(
    private readonly usuarioRepository: UsuarioRepositoryPort,
    private readonly faturaCartaoRepository: FaturaCartaoRepositoryPort,
    private readonly gastoRecorrenteService?: GastoRecorrenteServicePort,
  ) {}

  async listarFaturasPorUsuario(usuarioId: string, cartaoCreditoId?: string) {
    const usuario = await this.usuarioRepository.listarUsuarioPorId(usuarioId);

    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    if (this.gastoRecorrenteService?.sincronizarRecorrenciasCartoes) {
      try {
        await this.gastoRecorrenteService.sincronizarRecorrenciasCartoes(usuarioId);
      } catch (err) {
        console.error("Aviso: falha na sincronizacao automatica de faturas:", err);
      }
    }

    return await this.faturaCartaoRepository.listarFaturasPorUsuario(usuarioId, cartaoCreditoId);
  }

  async buscarExtratoFatura(faturaId: string, usuarioId: string) {
    const usuario = await this.usuarioRepository.listarUsuarioPorId(usuarioId);
    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    try {
      const fatura = await this.faturaCartaoRepository.buscarFaturaPorIdParaUsuario(faturaId, usuarioId);
      if (fatura?.competencia && this.gastoRecorrenteService?.gerarGastosRecorrentesDoMes) {
        const [ano, mes] = fatura.competencia.split("-").map(Number);
        if (ano && mes) {
          await this.gastoRecorrenteService.gerarGastosRecorrentesDoMes(
            usuarioId,
            new Date(Date.UTC(ano, mes - 1, 1))
          );
        }
      }
    } catch {
      // Ignora erro de pré-busca para prosseguir para buscarExtratoFatura
    }

    const extrato = await this.faturaCartaoRepository.buscarExtratoFatura(faturaId, usuarioId);
    if (!extrato) {
      throw createHttpError(404, "Fatura nao encontrada ou usuario sem permissao.");
    }

    return extrato;
  }

  async pagarFatura(faturaId: string, data: iPagarGasto, usuarioId: string) {
    const usuario = await this.usuarioRepository.listarUsuarioPorId(usuarioId);
    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    const fatura = await this.faturaCartaoRepository.buscarFaturaPorIdParaUsuario(faturaId, usuarioId);
    if (!fatura) {
      throw createHttpError(404, "Fatura do cartao nao encontrada.");
    }

    if (fatura.status === "paga") {
      throw createHttpError(400, "Fatura ja esta paga.");
    }

    if (fatura.status === "cancelada") {
      throw createHttpError(400, "Fatura cancelada nao pode ser paga.");
    }

    return await this.faturaCartaoRepository.pagarFatura(faturaId, data.dataPagamento ?? new Date());
  }

  async reabrirFatura(faturaId: string, usuarioId: string) {
    const usuario = await this.usuarioRepository.listarUsuarioPorId(usuarioId);
    if (!usuario) {
      throw createHttpError(404, "Usuario nao encontrado.");
    }

    const fatura = await this.faturaCartaoRepository.buscarFaturaPorIdParaUsuario(faturaId, usuarioId);
    if (!fatura) {
      throw createHttpError(404, "Fatura do cartao nao encontrada.");
    }

    if (fatura.status === "aberta") {
      throw createHttpError(400, "Esta fatura já se encontra aberta.");
    }

    return await this.faturaCartaoRepository.reabrirFatura(faturaId);
  }
}

export const faturaCartaoService = new FaturaCartaoService(usuarioRepository, faturaCartaoRepository, gastoService);
