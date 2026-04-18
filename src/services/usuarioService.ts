import { usuarioRepository } from '../repositories/usuarioRepository';
import iCriarUsuarioSchema from "../@types/iCriarUsuarioSchema";
import { Usuario } from '@prisma/client';

class UsuarioService {

    async criarUsuario(data: iCriarUsuarioSchema): Promise<Usuario> {
        const nome = data.nome;
        const email = data.email;
        const senha = data.senha;

        const usuarioExiste = await usuarioRepository.buscarUsuarioPorEmail(email);

        if (usuarioExiste) {
            throw new Error("Usuário já existe com esse email no banco de dados.");
        }

        return await usuarioRepository.criarUsuario({
            nome, 
            email, 
            senha
        })
    }
}

export const usuarioService = new UsuarioService();