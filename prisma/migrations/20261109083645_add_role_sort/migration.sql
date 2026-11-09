-- DropIndex
DROP INDEX "Role_name_idx";

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "sort" INTEGER NOT NULL DEFAULT 0;
