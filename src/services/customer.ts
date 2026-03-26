// Servicio de gestión de clientes
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { capitalizar, limpiarTelefono } from '../utils/helpers';
import type { Customer } from '@prisma/client';

// Obtener o crear cliente por teléfono
export async function obtenerOCrearCliente(telefono: string, nombre?: string): Promise<Customer> {
  const telefonoLimpio = limpiarTelefono(telefono);

  try {
    const cliente = await prisma.customer.upsert({
      where: { telefono: telefonoLimpio },
      update: {
        ultimoContacto: new Date(),
        ...(nombre && { nombre: capitalizar(nombre) }),
      },
      create: {
        telefono: telefonoLimpio,
        nombre: nombre ? capitalizar(nombre) : undefined,
      },
    });

    return cliente;
  } catch (error) {
    logger.error(`Error al obtener/crear cliente ${telefono}:`, error);
    throw error;
  }
}

// Obtener cliente por teléfono
export async function obtenerClientePorTelefono(telefono: string): Promise<Customer | null> {
  const telefonoLimpio = limpiarTelefono(telefono);
  try {
    return await prisma.customer.findUnique({
      where: { telefono: telefonoLimpio },
    });
  } catch (error) {
    logger.error(`Error al obtener cliente ${telefono}:`, error);
    return null;
  }
}

// Actualizar nombre del cliente (cuando lo menciona en la conversación)
export async function actualizarNombreCliente(customerId: string, nombre: string): Promise<void> {
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: { nombre: capitalizar(nombre) },
    });
    logger.info(`Nombre actualizado para cliente ${customerId}: ${nombre}`);
  } catch (error) {
    logger.error(`Error al actualizar nombre del cliente ${customerId}:`, error);
  }
}

// Agregar notas a un cliente
export async function agregarNotasCliente(customerId: string, nuevasNotas: string): Promise<void> {
  try {
    const cliente = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { notas: true },
    });

    const notasActualizadas = cliente?.notas
      ? `${cliente.notas}\n[${new Date().toLocaleDateString('es-AR')}] ${nuevasNotas}`
      : `[${new Date().toLocaleDateString('es-AR')}] ${nuevasNotas}`;

    await prisma.customer.update({
      where: { id: customerId },
      data: { notas: notasActualizadas },
    });
  } catch (error) {
    logger.error(`Error al agregar notas al cliente ${customerId}:`, error);
  }
}

// Agregar etiquetas a un cliente
export async function agregarEtiquetasCliente(
  customerId: string,
  etiquetas: string[]
): Promise<void> {
  try {
    const cliente = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { etiquetas: true },
    });

    const etiquetasActuales = cliente?.etiquetas || [];
    const nuevasEtiquetas = [...new Set([...etiquetasActuales, ...etiquetas])];

    await prisma.customer.update({
      where: { id: customerId },
      data: { etiquetas: nuevasEtiquetas },
    });
  } catch (error) {
    logger.error(`Error al agregar etiquetas al cliente ${customerId}:`, error);
  }
}

// Obtener estadísticas de clientes
export async function obtenerEstadisticasClientes(): Promise<{
  total: number;
  nuevosHoy: number;
  activosEstaSemana: number;
}> {
  try {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 7);

    const [total, nuevosHoy, activosEstaSemana] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: { createdAt: { gte: inicioHoy } },
      }),
      prisma.customer.count({
        where: { ultimoContacto: { gte: inicioSemana } },
      }),
    ]);

    return { total, nuevosHoy, activosEstaSemana };
  } catch (error) {
    logger.error('Error al obtener estadísticas de clientes:', error);
    return { total: 0, nuevosHoy: 0, activosEstaSemana: 0 };
  }
}

// Detectar nombre del cliente en el mensaje
export function extraerNombreDeTexto(texto: string): string | null {
  // Patrones comunes para detectar nombre
  const patrones = [
    /me llamo\s+([a-záéíóúñ]+)/i,
    /soy\s+([a-záéíóúñ]+)/i,
    /mi nombre es\s+([a-záéíóúñ]+)/i,
    /me dicen\s+([a-záéíóúñ]+)/i,
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
