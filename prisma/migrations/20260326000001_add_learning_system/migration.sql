-- CreateEnum
CREATE TYPE "TipoAprendizaje" AS ENUM ('TONO', 'FRASE_CIERRE', 'MANEJO_OBJECION', 'PERSUASION', 'ESTRUCTURA');

-- CreateTable: Memoria persistente por cliente
CREATE TABLE "customer_memory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "nombre" TEXT,
    "intereses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objeciones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "presupuesto" TEXT,
    "tonoConversacion" TEXT,
    "intencionCompra" TEXT,
    "datosRelevantes" JSONB,
    "ultimaActualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Aprendizajes estructurados del estilo del vendedor
CREATE TABLE "seller_learnings" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAprendizaje" NOT NULL,
    "contenido" TEXT NOT NULL,
    "contexto" TEXT,
    "confianza" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "origen" TEXT NOT NULL DEFAULT 'manual',
    "vecesUsado" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_learnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Resúmenes estructurados de conversaciones
CREATE TABLE "conversation_summaries" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "intencionCliente" TEXT,
    "productosInteres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objeciones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "datosClave" JSONB,
    "probabilidadCompra" DOUBLE PRECISION,
    "siguienteAccion" TEXT,
    "totalMensajes" INTEGER NOT NULL DEFAULT 0,
    "periodoDesde" TIMESTAMP(3) NOT NULL,
    "periodoHasta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_memory_customerId_key" ON "customer_memory"("customerId");

-- CreateIndex
CREATE INDEX "conversation_summaries_customerId_idx" ON "conversation_summaries"("customerId");

-- AddForeignKey
ALTER TABLE "customer_memory" ADD CONSTRAINT "customer_memory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_summaries" ADD CONSTRAINT "conversation_summaries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
