-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'USUARIO');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "perfil" "PerfilUsuario" NOT NULL DEFAULT 'USUARIO';
