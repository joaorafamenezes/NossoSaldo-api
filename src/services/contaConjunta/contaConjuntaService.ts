import createHttpError from "http-errors";
import { usuarioRepository } from "../../repositories/usuario/usuarioRepository";
import iCriarContaConjunta from "../../@types/contaConjunta/iCriarContaConjunta";
import { contaConjuntaRepository } from "../../repositories/contaConjunta/contaConjuntaRepository";

class ContaConjuntaService {
  async criarContaConjunta(data: iCriarContaConjunta) {
    const nomeConta = data.nomeConta;
    const usuario1Id = data.usuario1Id;
    const usuario2Id = data.usuario2Id;

    const usuario1 = await usuarioRepository.listarUsuarioPorId(usuario1Id);
    const usuario2 = await usuarioRepository.listarUsuarioPorId(usuario2Id);

    if (!usuario1 || !usuario2) {
      throw createHttpError(404, "Um ou ambos os usuários não foram encontrados.");
    }

    const contaConjuntaExistente = await contaConjuntaRepository.listarContaConjuntaPorIds(usuario1Id, usuario2Id);

    if (contaConjuntaExistente) {
      throw createHttpError(409, "A conta conjunta já existe para esses usuários.");
    }

    return await contaConjuntaRepository.criarContaConjunta({
      nomeConta,
      usuario1Id,
      usuario2Id,
    });
  }
}

export const contaConjuntaService = new ContaConjuntaService();
