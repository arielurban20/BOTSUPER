// Servicio de gestión de pedidos
import { EstadoPedido } from '@prisma/client';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { actualizarStock } from '../sales/catalog';

// Interfaz para crear pedido
interface DatosNuevoPedido {
  customerId: string;
  items: Array<{
    productId: string;
    cantidad: number;
    precio: number;
  }>;
  notas?: string;
}

// Crear un nuevo pedido
export async function crearPedido(datos: DatosNuevoPedido): Promise<string> {
  try {
    const total = datos.items.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );

    const pedido = await prisma.order.create({
      data: {
        customerId: datos.customerId,
        total,
        notas: datos.notas,
        items: {
          create: datos.items.map((item) => ({
            productId: item.productId,
            cantidad: item.cantidad,
            precio: item.precio,
          })),
        },
      },
      select: { id: true },
    });

    // Actualizar stock de cada producto
    for (const item of datos.items) {
      await actualizarStock(item.productId, item.cantidad);
    }

    logger.info(`✅ Pedido creado: ${pedido.id} para cliente ${datos.customerId}`);
    return pedido.id;
  } catch (error) {
    logger.error('Error al crear pedido:', error);
    throw error;
  }
}

// Actualizar estado del pedido
export async function actualizarEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido
): Promise<void> {
  try {
    await prisma.order.update({
      where: { id: pedidoId },
      data: { estado },
    });
    logger.info(`Estado del pedido ${pedidoId} actualizado a ${estado}`);
  } catch (error) {
    logger.error(`Error al actualizar estado del pedido ${pedidoId}:`, error);
  }
}

// Obtener pedidos de un cliente
export async function obtenerPedidosCliente(customerId: string) {
  try {
    return await prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            product: { select: { nombre: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    logger.error(`Error al obtener pedidos del cliente ${customerId}:`, error);
    return [];
  }
}

// Obtener estadísticas de ventas
export async function obtenerEstadisticasVentas(): Promise<{
  totalVentas: number;
  ventasHoy: number;
  ingresosTotal: number;
  ingresosHoy: number;
}> {
  try {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [pedidosTotales, pedidosHoy] = await Promise.all([
      prisma.order.aggregate({
        where: { estado: EstadoPedido.ENTREGADO },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          estado: EstadoPedido.ENTREGADO,
          createdAt: { gte: inicioHoy },
        },
        _count: { id: true },
        _sum: { total: true },
      }),
    ]);

    return {
      totalVentas: pedidosTotales._count.id,
      ventasHoy: pedidosHoy._count.id,
      ingresosTotal: Number(pedidosTotales._sum.total || 0),
      ingresosHoy: Number(pedidosHoy._sum.total || 0),
    };
  } catch (error) {
    logger.error('Error al obtener estadísticas de ventas:', error);
    return {
      totalVentas: 0,
      ventasHoy: 0,
      ingresosTotal: 0,
      ingresosHoy: 0,
    };
  }
}

// Formatear resumen de pedido para WhatsApp
export function formatearResumenPedido(
  items: Array<{ cantidad: number; precio: number; nombre: string }>,
  total: number
): string {
  const lineas = ['📦 *Resumen de tu pedido:*\n'];

  for (const item of items) {
    lineas.push(`• ${item.nombre} x${item.cantidad} → $${(item.precio * item.cantidad).toFixed(2)}`);
  }

  lineas.push(`\n💰 *Total: $${total.toFixed(2)}*`);
  lineas.push('\n✅ ¡Tu pedido fue registrado! En breve te contacto para coordinar el pago y envío 😊');

  return lineas.join('\n');
}
