// Servicio de historial de conversaciones
import { TipoMensaje } from '@prisma/client';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import type { MensajeHistorial } from '../ai/brain';

// Guardar mensaje en el historial
export async function guardarMensaje(
  customerId: string,
  mensaje: string,
  tipo: TipoMensaje,
  messageId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.conversation.create({
      data: {
        customerId,
        mensaje,
        tipo,
        messageId,
        metadata: metadata as never,
      },
    });
  } catch (error) {
    logger.error(`Error al guardar mensaje para ${customerId}:`, error);
  }
}

// Obtener historial de conversación formateado para la IA
export async function obtenerHistorialParaIA(
  customerId: string,
  limite = 20
): Promise<MensajeHistorial[]> {
  try {
    const conversaciones = await prisma.conversation.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limite,
      select: {
        mensaje: true,
        tipo: true,
        createdAt: true,
      },
    });

    // Revertir para tener orden cronológico
    return conversaciones
      .reverse()
      .map((conv) => ({
        rol: conv.tipo === TipoMensaje.ENTRANTE ? ('user' as const) : ('assistant' as const),
        contenido: conv.mensaje,
        timestamp: conv.createdAt,
      }));
  } catch (error) {
    logger.error(`Error al obtener historial para ${customerId}:`, error);
    return [];
  }
}

// Obtener el último mensaje del cliente
export async function obtenerUltimoMensajeCliente(
  customerId: string
): Promise<{ mensaje: string; createdAt: Date } | null> {
  try {
    return await prisma.conversation.findFirst({
      where: {
        customerId,
        tipo: TipoMensaje.ENTRANTE,
      },
      orderBy: { createdAt: 'desc' },
      select: { mensaje: true, createdAt: true },
    });
  } catch (error) {
    logger.error(`Error al obtener último mensaje de ${customerId}:`, error);
    return null;
  }
}

// Obtener cantidad de mensajes intercambiados
export async function contarMensajes(customerId: string): Promise<number> {
  try {
    return await prisma.conversation.count({ where: { customerId } });
  } catch (error) {
    logger.error(`Error al contar mensajes de ${customerId}:`, error);
    return 0;
  }
}

// Marcar mensajes como leídos
export async function marcarMensajesLeidos(customerId: string): Promise<void> {
  try {
    await prisma.conversation.updateMany({
      where: { customerId, tipo: TipoMensaje.ENTRANTE, leido: false },
      data: { leido: true },
    });
  } catch (error) {
    logger.error(`Error al marcar mensajes como leídos para ${customerId}:`, error);
  }
}

// Obtener estadísticas de conversaciones
export async function obtenerEstadisticasConversaciones(): Promise<{
  totalMensajes: number;
  mensajesHoy: number;
  clientesActivos: number;
}> {
  try {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [totalMensajes, mensajesHoy, clientesActivos] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({
        where: { createdAt: { gte: inicioHoy } },
      }),
      prisma.conversation.groupBy({
        by: ['customerId'],
        where: { createdAt: { gte: inicioHoy } },
      }).then((res) => res.length),
    ]);

    return { totalMensajes, mensajesHoy, clientesActivos };
  } catch (error) {
    logger.error('Error al obtener estadísticas de conversaciones:', error);
    return { totalMensajes: 0, mensajesHoy: 0, clientesActivos: 0 };
  }
}
