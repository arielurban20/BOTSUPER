// Pipeline de ventas - Gestión de estados y transiciones
import { EtapaPipeline } from '@prisma/client';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

export { EtapaPipeline };

// Obtener o crear pipeline para un cliente
export async function obtenerOCrearPipeline(customerId: string): Promise<{
  id: string;
  etapa: EtapaPipeline;
  customerId: string;
}> {
  try {
    const pipeline = await prisma.salesPipeline.upsert({
      where: { customerId },
      update: { ultimaActualizacion: new Date() },
      create: {
        customerId,
        etapa: EtapaPipeline.NUEVO,
      },
      select: { id: true, etapa: true, customerId: true },
    });
    return pipeline;
  } catch (error) {
    logger.error(`Error al obtener/crear pipeline para ${customerId}:`, error);
    throw error;
  }
}

// Actualizar etapa del pipeline
export async function actualizarEtapaPipeline(
  customerId: string,
  nuevaEtapa: EtapaPipeline,
  notas?: string
): Promise<void> {
  try {
    const etapaActual = await prisma.salesPipeline.findUnique({
      where: { customerId },
      select: { etapa: true },
    });

    // Solo actualizar si la etapa cambió
    if (etapaActual?.etapa === nuevaEtapa) return;

    await prisma.salesPipeline.update({
      where: { customerId },
      data: {
        etapa: nuevaEtapa,
        ultimaActualizacion: new Date(),
        notas: notas || undefined,
      },
    });

    logger.info(
      `Pipeline actualizado: ${customerId} → ${etapaActual?.etapa} → ${nuevaEtapa}`
    );
  } catch (error) {
    logger.error(`Error al actualizar pipeline para ${customerId}:`, error);
  }
}

// Convertir string a EtapaPipeline
export function parsearEtapa(etapaStr: string): EtapaPipeline | undefined {
  const etapasValidas: Record<string, EtapaPipeline> = {
    NUEVO: EtapaPipeline.NUEVO,
    INTERESADO: EtapaPipeline.INTERESADO,
    NEGOCIANDO: EtapaPipeline.NEGOCIANDO,
    OBJECION: EtapaPipeline.OBJECION,
    CIERRE: EtapaPipeline.CIERRE,
    VENDIDO: EtapaPipeline.VENDIDO,
    PERDIDO: EtapaPipeline.PERDIDO,
  };
  return etapasValidas[etapaStr.toUpperCase()];
}

// Obtener estadísticas del pipeline
export async function obtenerEstadisticasPipeline(): Promise<Record<string, number>> {
  try {
    const resultados = await prisma.salesPipeline.groupBy({
      by: ['etapa'],
      _count: { etapa: true },
    });

    const stats: Record<string, number> = {};
    for (const r of resultados) {
      stats[r.etapa] = r._count.etapa;
    }

    return stats;
  } catch (error) {
    logger.error('Error al obtener estadísticas del pipeline:', error);
    return {};
  }
}

// Obtener clientes por etapa
export async function obtenerClientesPorEtapa(etapa: EtapaPipeline): Promise<string[]> {
  try {
    const pipelines = await prisma.salesPipeline.findMany({
      where: { etapa },
      select: { customerId: true },
    });
    return pipelines.map((p) => p.customerId);
  } catch (error) {
    logger.error(`Error al obtener clientes en etapa ${etapa}:`, error);
    return [];
  }
}

// Determinar si se debe crear un seguimiento según la etapa
export function debeCrearSeguimiento(etapa: EtapaPipeline): boolean {
  const etapasConSeguimiento: EtapaPipeline[] = [
    EtapaPipeline.INTERESADO,
    EtapaPipeline.NEGOCIANDO,
    EtapaPipeline.OBJECION,
    EtapaPipeline.CIERRE,
  ];
  return etapasConSeguimiento.includes(etapa);
}
