// Servicio de resumen estructurado de conversaciones
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { config } from '../config/env';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { PROMPT_GENERAR_RESUMEN_CONVERSACION } from '../ai/prompts';
import type { MensajeHistorial } from '../ai/brain';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Umbral de mensajes para generar resumen automático
const MENSAJES_PARA_RESUMEN = 10;

export interface ResumenConversacion {
  intencionCliente?: string;
  productosInteres: string[];
  objeciones: string[];
  datosClave?: Record<string, string>;
  probabilidadCompra?: number;
  siguienteAccion?: string;
}

// Verificar si corresponde generar un resumen y generarlo si es necesario
export async function verificarYGenerarResumen(
  customerId: string,
  totalMensajes: number,
  historial: MensajeHistorial[]
): Promise<void> {
  if (totalMensajes < MENSAJES_PARA_RESUMEN) return;
  if (historial.length < 5) return;

  try {
    // Obtener fecha del último resumen
    const ultimoResumen = await prisma.conversationSummary.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, totalMensajes: true },
    });

    // Solo generar si hay al menos MENSAJES_PARA_RESUMEN mensajes nuevos desde el último resumen
    const mensajesDesdeUltimoResumen = ultimoResumen
      ? totalMensajes - ultimoResumen.totalMensajes
      : totalMensajes;

    if (mensajesDesdeUltimoResumen < MENSAJES_PARA_RESUMEN) return;

    await generarYGuardarResumen(customerId, historial, totalMensajes);
  } catch (error) {
    logger.warn(`No se pudo verificar resumen para ${customerId}:`, error);
  }
}

// Generar y guardar un resumen estructurado de la conversación
export async function generarYGuardarResumen(
  customerId: string,
  historial: MensajeHistorial[],
  totalMensajes: number
): Promise<ResumenConversacion | null> {
  if (historial.length < 3) return null;

  try {
    const historialTexto = historial
      .slice(-30)
      .map((m) => `${m.rol === 'user' ? 'Cliente' : 'Vendedor'}: ${m.contenido}`)
      .join('\n');

    // Obtener el timestamp real del primer mensaje del período desde la base de datos
    const primerMensaje = await prisma.conversation.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const periodoDesde = primerMensaje?.createdAt ?? new Date();

    const respuesta = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: [
        { role: 'system', content: PROMPT_GENERAR_RESUMEN_CONVERSACION },
        { role: 'user', content: historialTexto },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const contenido = respuesta.choices[0]?.message?.content?.trim() || '{}';
    const resumen = JSON.parse(contenido) as ResumenConversacion;

    const datosClave: Prisma.InputJsonValue = resumen.datosClave ?? {};

    // Guardar resumen en la base de datos
    await prisma.conversationSummary.create({
      data: {
        customerId,
        intencionCliente: resumen.intencionCliente ?? null,
        productosInteres: resumen.productosInteres ?? [],
        objeciones: resumen.objeciones ?? [],
        datosClave,
        probabilidadCompra: resumen.probabilidadCompra ?? null,
        siguienteAccion: resumen.siguienteAccion ?? null,
        totalMensajes,
        periodoDesde,
        periodoHasta: new Date(),
      },
    });

    logger.info(`📋 Resumen generado para cliente ${customerId} (${totalMensajes} mensajes)`);
    return resumen;
  } catch (error) {
    logger.warn(`No se pudo generar resumen para ${customerId}:`, error);
    return null;
  }
}

// Obtener el último resumen de un cliente
export async function obtenerUltimoResumen(
  customerId: string
): Promise<ResumenConversacion | null> {
  try {
    const resumen = await prisma.conversationSummary.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!resumen) return null;

    return {
      intencionCliente: resumen.intencionCliente ?? undefined,
      productosInteres: resumen.productosInteres,
      objeciones: resumen.objeciones,
      datosClave: resumen.datosClave as Record<string, string> | undefined,
      probabilidadCompra: resumen.probabilidadCompra ?? undefined,
      siguienteAccion: resumen.siguienteAccion ?? undefined,
    };
  } catch (error) {
    logger.warn(`Error al obtener resumen de ${customerId}:`, error);
    return null;
  }
}
