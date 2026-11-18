-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deniedPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extraPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
