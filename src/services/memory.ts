// Servicio de memoria persistente por cliente
import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { config } from '../config/env';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { PROMPT_EXTRAER_MEMORIA_CLIENTE } from '../ai/prompts';
import type { MensajeHistorial } from '../ai/brain';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export interface MemoriaCliente {
  nombre?: string | null;
  intereses: string[];
  objeciones: string[];
  presupuesto?: string | null;
  tonoConversacion?: string | null;
  intencionCompra?: string | null;
  datosRelevantes?: Record<string, string> | null;
}

// Obtener memoria de un cliente (o null si no existe)
export async function obtenerMemoriaCliente(customerId: string): Promise<MemoriaCliente | null> {
  try {
    const memoria = await prisma.customerMemory.findUnique({
      where: { customerId },
    });
    if (!memoria) return null;

    return {
      nombre: memoria.nombre,
      intereses: memoria.intereses,
      objeciones: memoria.objeciones,
      presupuesto: memoria.presupuesto,
      tonoConversacion: memoria.tonoConversacion,
      intencionCompra: memoria.intencionCompra,
      datosRelevantes: memoria.datosRelevantes as Record<string, string> | null,
    };
  } catch (error) {
    logger.error(`Error al obtener memoria del cliente ${customerId}:`, error);
    return null;
  }
}

// Formatear memoria para incluir en el prompt de la IA
export function formatearMemoriaParaPrompt(memoria: MemoriaCliente): string {
  const lineas: string[] = [];

  if (memoria.intereses.length > 0) {
    lineas.push(`- Intereses: ${memoria.intereses.join(', ')}`);
  }
  if (memoria.objeciones.length > 0) {
    lineas.push(`- Objeciones frecuentes: ${memoria.objeciones.join(', ')}`);
  }
  if (memoria.presupuesto) {
    lineas.push(`- Presupuesto: ${memoria.presupuesto}`);
  }
  if (memoria.tonoConversacion) {
    lineas.push(`- Tono: ${memoria.tonoConversacion}`);
  }
  if (memoria.intencionCompra) {
    lineas.push(`- Intención de compra: ${memoria.intencionCompra}`);
  }
  if (memoria.datosRelevantes && Object.keys(memoria.datosRelevantes).length > 0) {
    const datos = Object.entries(memoria.datosRelevantes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    lineas.push(`- Datos adicionales: ${datos}`);
  }

  return lineas.join('\n');
}

// Extraer y actualizar memoria del cliente usando IA
export async function actualizarMemoriaDesdeHistorial(
  customerId: string,
  historial: MensajeHistorial[]
): Promise<void> {
  if (historial.length < 3) return; // Necesitamos al menos 3 mensajes para extraer algo útil

  try {
    const historialTexto = historial
      .slice(-20)
      .map((m) => `${m.rol === 'user' ? 'Cliente' : 'Vendedor'}: ${m.contenido}`)
      .join('\n');

    const respuesta = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: [
        { role: 'system', content: PROMPT_EXTRAER_MEMORIA_CLIENTE },
        { role: 'user', content: historialTexto },
      ],
      max_tokens: 400,
      temperature: 0.1,
    });

    const contenido = respuesta.choices[0]?.message?.content?.trim() || '{}';
    const datos = JSON.parse(contenido) as MemoriaCliente & { datosRelevantes?: Record<string, string> };

    // Obtener memoria existente para hacer un merge no destructivo
    const memoriaActual = await prisma.customerMemory.findUnique({
      where: { customerId },
    });

    const interesesNuevos = mergeArrays(memoriaActual?.intereses ?? [], datos.intereses ?? []);
    const objecionesNuevos = mergeArrays(memoriaActual?.objeciones ?? [], datos.objeciones ?? []);

    // Resolver cada campo con prioridad: nuevo > existente > undefined
    const resolverCampo = (nuevo: string | null | undefined, existente: string | null | undefined): string | undefined =>
      (nuevo ?? existente) ?? undefined;

    const datosRelevantesJson: Prisma.InputJsonValue = mergeObjetos(
      memoriaActual?.datosRelevantes as Record<string, string> | null,
      datos.datosRelevantes
    );

    await prisma.customerMemory.upsert({
      where: { customerId },
      update: {
        nombre: resolverCampo(datos.nombre, memoriaActual?.nombre),
        intereses: interesesNuevos,
        objeciones: objecionesNuevos,
        presupuesto: resolverCampo(datos.presupuesto, memoriaActual?.presupuesto),
        tonoConversacion: resolverCampo(datos.tonoConversacion, memoriaActual?.tonoConversacion),
        intencionCompra: resolverCampo(datos.intencionCompra, memoriaActual?.intencionCompra),
        datosRelevantes: datosRelevantesJson,
        ultimaActualizacion: new Date(),
      },
      create: {
        customerId,
        nombre: datos.nombre ?? undefined,
        intereses: datos.intereses ?? [],
        objeciones: datos.objeciones ?? [],
        presupuesto: datos.presupuesto ?? undefined,
        tonoConversacion: datos.tonoConversacion ?? undefined,
        intencionCompra: datos.intencionCompra ?? undefined,
        datosRelevantes: (datos.datosRelevantes ?? {}) as Prisma.InputJsonValue,
      },
    });

    logger.info(`🧠 Memoria actualizada para cliente ${customerId}`);
  } catch (error) {
    logger.warn(`No se pudo actualizar memoria del cliente ${customerId}:`, error);
  }
}

// Merge de arrays sin duplicados
function mergeArrays(existente: string[], nuevo: string[]): string[] {
  return [...new Set([...existente, ...nuevo.filter(Boolean)])];
}

// Merge de objetos sin sobrescribir valores existentes
function mergeObjetos(
  existente: Record<string, string> | null | undefined,
  nuevo: Record<string, string> | null | undefined
): Record<string, string> {
  return { ...(existente ?? {}), ...(nuevo ?? {}) };
}
