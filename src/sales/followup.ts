// Sistema de seguimiento automático (re-engagement)
import cron from 'node-cron';
import { TipoFollowUp } from '@prisma/client';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { generarMensajeSeguimiento } from '../ai/brain';
import { formatearCatalogoParaIA } from '../sales/catalog';
import { calcularFechaFutura, calcularFechaFuturaHoras, calcularFechaFuturaDias } from '../utils/helpers';
import { enviarMensajeTexto } from '../whatsapp/sender';

import { reactivarClientesPausadosMucho } from '../services/customer';

// Tiempos de seguimiento en minutos
const TIEMPOS_SEGUIMIENTO: Record<TipoFollowUp, number> = {
  PRIMER_SEGUIMIENTO: 30,            // 30 minutos
  SEGUNDO_SEGUIMIENTO: 240,          // 4 horas
  TERCER_SEGUIMIENTO: 1440,          // 24 horas
  CUARTO_SEGUIMIENTO: 2880,          // 48 horas
  QUINTO_SEGUIMIENTO: 4320,          // 72 horas
  RECONEXION: 10080,                 // 1 semana
  UPSELL: 60,                        // 1 hora después de la venta
  PERSONALIZADO: 0,
};

// Programar todos los seguimientos para un cliente
export async function programarSeguimientos(customerId: string): Promise<void> {
  try {
    const tiposSeguimiento: TipoFollowUp[] = [
      TipoFollowUp.PRIMER_SEGUIMIENTO,
      TipoFollowUp.SEGUNDO_SEGUIMIENTO,
      TipoFollowUp.TERCER_SEGUIMIENTO,
      TipoFollowUp.CUARTO_SEGUIMIENTO,
      TipoFollowUp.QUINTO_SEGUIMIENTO,
      TipoFollowUp.RECONEXION,
    ];

    // Eliminar seguimientos anteriores no ejecutados
    await prisma.followUp.deleteMany({
      where: { customerId, ejecutado: false },
    });

    const catalogo = await formatearCatalogoParaIA();
    const cliente = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { nombre: true },
    });

    // Crear seguimientos escalonados
    const seguimientosACrear = [];
    for (const tipo of tiposSeguimiento) {
      const minutosEspera = TIEMPOS_SEGUIMIENTO[tipo];
      let fechaProgramada: Date;

      if (minutosEspera < 60) {
        fechaProgramada = calcularFechaFutura(minutosEspera);
      } else if (minutosEspera < 1440) {
        fechaProgramada = calcularFechaFuturaHoras(minutosEspera / 60);
      } else {
        fechaProgramada = calcularFechaFuturaDias(minutosEspera / 1440);
      }

      const mensaje = await generarMensajeSeguimiento(
        tipo,
        cliente?.nombre || undefined,
        catalogo
      );

      seguimientosACrear.push({
        customerId,
        tipo,
        fechaProgramada,
        mensaje,
      });
    }

    await prisma.followUp.createMany({ data: seguimientosACrear });
    logger.info(`✅ Seguimientos programados para cliente ${customerId}`);
  } catch (error) {
    logger.error(`Error al programar seguimientos para ${customerId}:`, error);
  }
}

// Cancelar seguimientos pendientes (cuando el cliente responde o compra)
export async function cancelarSeguimientos(customerId: string): Promise<void> {
  try {
    const resultado = await prisma.followUp.updateMany({
      where: { customerId, ejecutado: false },
      data: { ejecutado: true, fechaEjecucion: new Date() },
    });
    logger.info(`Seguimientos cancelados para ${customerId}: ${resultado.count}`);
  } catch (error) {
    logger.error(`Error al cancelar seguimientos para ${customerId}:`, error);
  }
}

// Programar seguimiento de upsell después de una venta
export async function programarUpsell(customerId: string, productoComprado: string): Promise<void> {
  try {
    const cliente = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { nombre: true },
    });

    const catalogo = await formatearCatalogoParaIA();
    const mensaje = await generarMensajeSeguimiento(
      'UPSELL',
      cliente?.nombre || undefined,
      `Producto comprado: ${productoComprado}\nCatálogo completo: ${catalogo}`
    );

    const fechaProgramada = calcularFechaFuturaHoras(1);

    await prisma.followUp.create({
      data: {
        customerId,
        tipo: TipoFollowUp.UPSELL,
        fechaProgramada,
        mensaje,
      },
    });

    logger.info(`Upsell programado para cliente ${customerId}`);
  } catch (error) {
    logger.error(`Error al programar upsell para ${customerId}:`, error);
  }
}

// Ejecutar seguimientos pendientes
export async function ejecutarSeguimientosPendientes(): Promise<void> {
  try {
    const ahora = new Date();

    const seguimientos = await prisma.followUp.findMany({
      where: {
        ejecutado: false,
        fechaProgramada: { lte: ahora },
      },
      include: {
        customer: {
          select: { telefono: true, nombre: true },
        },
      },
      orderBy: { fechaProgramada: 'asc' },
      take: 10, // Procesar de a 10 para evitar sobrecarga
    });

    if (seguimientos.length === 0) {
      logger.debug('No hay seguimientos pendientes');
      return;
    }

    logger.info(`Ejecutando ${seguimientos.length} seguimientos pendientes`);

    for (const seguimiento of seguimientos) {
      try {
        // Enviar el mensaje
        await enviarMensajeTexto(seguimiento.customer.telefono, seguimiento.mensaje);

        // Marcar como ejecutado
        await prisma.followUp.update({
          where: { id: seguimiento.id },
          data: { ejecutado: true, fechaEjecucion: new Date() },
        });

        // Guardar en historial de conversación
        const customer = await prisma.customer.findUnique({
          where: { telefono: seguimiento.customer.telefono },
        });

        if (customer) {
          await prisma.conversation.create({
            data: {
              customerId: customer.id,
              mensaje: seguimiento.mensaje,
              tipo: 'SALIENTE',
              metadata: { tipoFollowUp: seguimiento.tipo },
            },
          });
        }

        logger.info(`✅ Seguimiento ejecutado para ${seguimiento.customer.telefono}`);
      } catch (error) {
        logger.error(`Error al ejecutar seguimiento ${seguimiento.id}:`, error);
      }

      // Pequeña pausa entre mensajes para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    logger.error('Error al ejecutar seguimientos pendientes:', error);
  }
}

// Iniciar el cron job para seguimientos automáticos
export function iniciarCronSeguimientos(): void {
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    await ejecutarSeguimientosPendientes();
    await reactivarClientesPausadosMucho();
  });

  logger.info('⏰ Cron de seguimientos automáticos iniciado (cada 5 minutos)');
}
