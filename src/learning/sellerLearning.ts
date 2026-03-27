// Servicio de aprendizaje del estilo del vendedor
// Extrae patrones de comunicación de respuestas manuales del vendedor
import OpenAI from 'openai';
import { TipoAprendizaje } from '@prisma/client';
import { config } from '../config/env';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { PROMPT_EXTRAER_APRENDIZAJE_VENDEDOR } from '../ai/prompts';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Confianza por defecto asignada a los aprendizajes extraídos automáticamente.
// Valor conservador (0.8/1) para indicar buena calidad pero que aún requiere revisión manual.
const DEFAULT_LEARNING_CONFIDENCE = 0.8;

interface AprendizajeExtraido {
  tipo: TipoAprendizaje;
  contenido: string;
  contexto?: string;
}

// Extraer y guardar aprendizajes de una respuesta manual del vendedor
export async function aprenderDeRespuestaManual(
  textoRespuesta: string,
  contextoCliente?: string
): Promise<number> {
  if (!textoRespuesta || textoRespuesta.trim().length < 10) return 0;

  try {
    const mensajeUsuario = contextoCliente
      ? `Contexto del cliente: ${contextoCliente}\n\nRespuesta del vendedor: ${textoRespuesta}`
      : `Respuesta del vendedor: ${textoRespuesta}`;

    const respuesta = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: [
        { role: 'system', content: PROMPT_EXTRAER_APRENDIZAJE_VENDEDOR },
        { role: 'user', content: mensajeUsuario },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const contenido = respuesta.choices[0]?.message?.content?.trim() || '{"aprendizajes":[]}';
    const resultado = JSON.parse(contenido) as { aprendizajes: AprendizajeExtraido[] };
    const aprendizajes = resultado.aprendizajes ?? [];

    if (aprendizajes.length === 0) return 0;

    // Guardar cada aprendizaje como registro separado
    const tiposValidos = Object.values(TipoAprendizaje) as string[];
    const aprendizajesValidos = aprendizajes.filter(
      (a) => a.contenido && tiposValidos.includes(a.tipo)
    );

    if (aprendizajesValidos.length > 0) {
      await prisma.sellerLearning.createMany({
        data: aprendizajesValidos.map((a) => ({
          tipo: a.tipo as TipoAprendizaje,
          contenido: a.contenido,
          contexto: a.contexto ?? null,
          confianza: DEFAULT_LEARNING_CONFIDENCE,
          aprobado: false, // Requiere aprobación manual
          origen: 'manual',
        })),
      });

      logger.info(`📚 ${aprendizajesValidos.length} aprendizaje(s) extraídos de respuesta manual`);
    }

    return aprendizajesValidos.length;
  } catch (error) {
    logger.warn('No se pudieron extraer aprendizajes de la respuesta manual:', error);
    return 0;
  }
}

// Obtener aprendizajes aprobados formateados para el prompt de la IA
export async function obtenerAprendizajesParaPrompt(limite = 10): Promise<string> {
  try {
    const aprendizajes = await prisma.sellerLearning.findMany({
      where: { aprobado: true },
      orderBy: [{ confianza: 'desc' }, { vecesUsado: 'desc' }],
      take: limite,
      select: { tipo: true, contenido: true, contexto: true },
    });

    if (aprendizajes.length === 0) return '';

    const porTipo = aprendizajes.reduce<Record<string, string[]>>((acc, a) => {
      const tipoLabel = mapearTipoLabel(a.tipo);
      if (!acc[tipoLabel]) acc[tipoLabel] = [];
      acc[tipoLabel].push(a.contenido);
      return acc;
    }, {});

    return Object.entries(porTipo)
      .map(([tipo, items]) => `${tipo}:\n${items.map((i) => `  - ${i}`).join('\n')}`)
      .join('\n');
  } catch (error) {
    logger.warn('Error al obtener aprendizajes del vendedor:', error);
    return '';
  }
}

// Incrementar contador de uso de un aprendizaje
export async function registrarUsoAprendizaje(id: string): Promise<void> {
  try {
    await prisma.sellerLearning.update({
      where: { id },
      data: { vecesUsado: { increment: 1 } },
    });
  } catch {
    // No es crítico si falla
  }
}

function mapearTipoLabel(tipo: TipoAprendizaje): string {
  const labels: Record<TipoAprendizaje, string> = {
    TONO: 'Tono de comunicación',
    FRASE_CIERRE: 'Frases de cierre',
    MANEJO_OBJECION: 'Manejo de objeciones',
    PERSUASION: 'Persuasión',
    ESTRUCTURA: 'Estructura de respuestas',
  };
  return labels[tipo] ?? tipo;
}
