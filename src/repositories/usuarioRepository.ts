import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

class UsuarioRepository {
    async buscarUsuarioPorEmail(email: string) {
        return await prisma.usuario.findUnique({
            where: { email }
        });
    }

    async criarUsuario(usuario: Prisma.UsuarioUncheckedCreateInput){
        return await prisma.usuario.create({
            data: usuario
        });
    }
}

export const usuarioRepository = new UsuarioRepository();