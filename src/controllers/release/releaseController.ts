import type { NextFunction, Request, Response } from "express";
import { ReleaseService, releaseService as defaultReleaseService } from "../../services/release/releaseService";

export class ReleaseController {
  constructor(private readonly service: ReleaseService = defaultReleaseService) {}

  async obterStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = res.locals.payload?.id;
      const versaoAtual = typeof req.query.version === "string" ? req.query.version : undefined;

      const status = await this.service.obterStatusVisualizacao(usuarioId, versaoAtual);
      return res.status(200).json(status);
    } catch (error) {
      return next(error);
    }
  }

  async marcarVisualizada(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = res.locals.payload?.id;
      const { versao } = req.body;

      const resultado = await this.service.marcarComoVisualizada(usuarioId, versao);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  }
}

export const releaseController = new ReleaseController();
