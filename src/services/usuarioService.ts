import { usuarioRepository } from '../repositories/usuarioRepository';
import iCriarUsuario from "../@types/iCriarUsuario";
import { Usuario } from '@prisma/client';
import autentication from '../secure/autentication';
import iLogin from '../@types/iLogin';
import authorization from '../secure/authorization';

class UsuarioService {

    async criarUsuario(data: iCriarUsuario): Promise<Usuario> {
        const nome = data.nome;
        const email = data.email;
        const senha = autentication.hasPassword(data.senha);

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

    async login(data: iLogin){
        const email = data.email;
        const senha = data.senha;

        const usuario = await usuarioRepository.buscarUsuarioPorEmail(email);

        if (!usuario) {
            return null;
        }

        if (autentication.checkPassword(senha, usuario.senha)) {
            const token = await authorization.sign(usuario.id);

            if (!token) {
                throw new Error("Não foi possível gerar o token.");
            }

            return { token };
        }
        
        return null;
    }
}

export const usuarioService = new UsuarioService();
