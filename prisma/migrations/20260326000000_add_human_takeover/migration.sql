-- AlterTable: Add human takeover fields to customers
ALTER TABLE "customers" ADD COLUMN "pausado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN "pausadoEn" TIMESTAMP(3);
