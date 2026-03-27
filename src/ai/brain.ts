// Cerebro principal del bot - Genera respuestas inteligentes con OpenAI
import OpenAI from 'openai';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import {
  generarSystemPrompt,
  PROMPT_DETECTAR_INTENCION,
  PROMPT_DETECTAR_ETAPA,
} from './prompts';
import {
  detectarObjecion,
  obtenerContextoObjecion,
  TipoObjecion,
} from './objections';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Interfaces
export interface ContextoConversacion {
  telefono: string;
  nombreCliente?: string;
  historialMensajes: MensajeHistorial[];
  catalogoProductos?: string;
  etapaPipeline?: string;
  notasCliente?: string;
  memoriaCliente?: string;
  aprendizajesVendedor?: string;
}

export interface MensajeHistorial {
  rol: 'user' | 'assistant';
  contenido: string;
  timestamp?: Date;
}

export interface ResultadoIA {
  respuesta: string;
  intencionDetectada?: string;
  nuevaEtapa?: string;
  objecionDetectada?: TipoObjecion;
  requiereSeguimiento?: boolean;
}

// Convertir historial al formato de OpenAI
function convertirHistorial(mensajes: MensajeHistorial[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  // Solo tomar los últimos 20 mensajes para no exceder el contexto
  const mensajesRecientes = mensajes.slice(-20);

  return mensajesRecientes.map((msg) => ({
    role: msg.rol,
    content: msg.contenido,
  }));
}

// Formatear historial como texto para el system prompt
function formatearHistorialTexto(mensajes: MensajeHistorial[]): string {
  if (mensajes.length === 0) return '';

  const mensajesRecientes = mensajes.slice(-10);
  return mensajesRecientes
    .map((msg) => {
      const prefijo = msg.rol === 'user' ? 'Cliente' : config.bot.nombre;
      return `${prefijo}: ${msg.contenido}`;
    })
    .join('\n');
}

// Generar respuesta principal del bot
export async function generarRespuesta(
  mensajeCliente: string,
  contexto: ContextoConversacion
): Promise<ResultadoIA> {
  try {
    // Detectar objeción en el mensaje
    const deteccionObjecion = detectarObjecion(mensajeCliente);
    let contextoExtra = '';

    if (deteccionObjecion.tieneObjecion) {
      contextoExtra = obtenerContextoObjecion(deteccionObjecion.tipoObjecion);
      logger.info(`Objeción detectada: ${deteccionObjecion.tipoObjecion}`);
    }

    // Preparar el system prompt
    const systemPrompt =
      generarSystemPrompt({
        nombreCliente: contexto.nombreCliente,
        historialConversacion: formatearHistorialTexto(contexto.historialMensajes),
        catalogoProductos: contexto.catalogoProductos,
        etapaPipeline: contexto.etapaPipeline,
        notasCliente: contexto.notasCliente,
        memoriaCliente: contexto.memoriaCliente,
        aprendizajesVendedor: contexto.aprendizajesVendedor,
      }) + (contextoExtra ? `\n\nCONTEXTO ESPECIAL: ${contextoExtra}` : '');

    // Preparar mensajes para OpenAI
    const mensajes: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...convertirHistorial(contexto.historialMensajes),
      { role: 'user', content: mensajeCliente },
    ];

    // Llamar a la API de OpenAI
    const respuestaOpenAI = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: mensajes,
      max_tokens: Math.min(config.openai.maxTokens, 150), // Máximo 150 tokens para respuestas cortas
      temperature: 0.8, // Respuestas más creativas y naturales
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const textoRespuesta =
      respuestaOpenAI.choices[0]?.message?.content?.trim() ||
      'déjame revisar eso y te respondo';

    logger.info(`Respuesta generada para ${contexto.telefono}: ${textoRespuesta.substring(0, 50)}...`);

    // Detectar nueva etapa del pipeline
    const nuevaEtapa = await detectarEtapaPipeline(mensajeCliente, contexto);

    return {
      respuesta: textoRespuesta,
      objecionDetectada: deteccionObjecion.tieneObjecion
        ? deteccionObjecion.tipoObjecion
        : undefined,
      nuevaEtapa,
      requiereSeguimiento: deteccionObjecion.tipoObjecion === 'DESPUES_ESCRIBE',
    };
  } catch (error) {
    logger.error('Error al generar respuesta con OpenAI:', error);

    // Respuesta de fallback para no dejar al cliente sin respuesta
    return {
      respuesta: 'un momento, te respondo enseguida',
      requiereSeguimiento: false,
    };
  }
}

// Detectar la etapa del pipeline basándose en el mensaje
async function detectarEtapaPipeline(
  mensaje: string,
  contexto: ContextoConversacion
): Promise<string | undefined> {
  try {
    const mensajes: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: PROMPT_DETECTAR_ETAPA },
      {
        role: 'user',
        content: `Mensaje del cliente: "${mensaje}"\nHistorial: ${formatearHistorialTexto(contexto.historialMensajes)}\nEtapa actual: ${contexto.etapaPipeline || 'NUEVO'}`,
      },
    ];

    const respuesta = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: mensajes,
      max_tokens: 20,
      temperature: 0.1,
    });

    const etapa = respuesta.choices[0]?.message?.content?.trim().toUpperCase();
    const etapasValidas = ['NUEVO', 'INTERESADO', 'NEGOCIANDO', 'OBJECION', 'CIERRE', 'VENDIDO', 'PERDIDO'];

    if (etapa && etapasValidas.includes(etapa)) {
      return etapa;
    }
    return undefined;
  } catch (error) {
    logger.warn('No se pudo detectar la etapa del pipeline:', error);
    return undefined;
  }
}

// Detectar intención del mensaje
export async function detectarIntencion(mensaje: string): Promise<{
  intencion: string;
  intensidad: number;
  requiereSeguimiento: boolean;
  palabrasClave: string[];
}> {
  try {
    const respuesta = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: [
        { role: 'system', content: PROMPT_DETECTAR_INTENCION },
        { role: 'user', content: mensaje },
      ],
      max_tokens: 150,
      temperature: 0.1,
    });

    const contenido = respuesta.choices[0]?.message?.content?.trim() || '{}';
    const resultado = JSON.parse(contenido) as {
      intencion: string;
      intensidad: number;
      requiereSeguimiento: boolean;
      palabrasClave: string[];
    };
    return resultado;
  } catch (error) {
    logger.warn('No se pudo detectar la intención:', error);
    return {
      intencion: 'OTRA',
      intensidad: 5,
      requiereSeguimiento: false,
      palabrasClave: [],
    };
  }
}

// Generar mensaje de seguimiento automático
export async function generarMensajeSeguimiento(
  tipoSeguimiento: string,
  nombreCliente: string | undefined,
  catalogoProductos: string
): Promise<string> {
  try {
    const nombre = nombreCliente || 'amigo/a';

    const prompts: Record<string, string> = {
      PRIMER_SEGUIMIENTO: `Eres ${config.bot.nombre} de ${config.bot.negocio}. Genera un mensaje casual para ${nombre} que mostró interés hace 30 minutos pero no respondió. Máximo 2 líneas. Productos: ${catalogoProductos}`,
      SEGUNDO_SEGUIMIENTO: `Eres ${config.bot.nombre} de ${config.bot.negocio}. Genera un mensaje con un testimonio de cliente satisfecho para ${nombre}. Máximo 3 líneas. Productos: ${catalogoProductos}`,
      TERCER_SEGUIMIENTO: `Eres ${config.bot.nombre} de ${config.bot.negocio}. Genera un mensaje con oferta especial de tiempo limitado para ${nombre}. Máximo 2 líneas. Productos: ${catalogoProductos}`,
      CUARTO_SEGUIMIENTO: `Eres ${config.bot.nombre} de ${config.bot.negocio}. Genera un mensaje de escasez de stock para ${nombre}. Máximo 2 líneas. Productos: ${catalogoProductos}`,
      QUINTO_SEGUIMIENTO: `Eres ${config.bot.nombre} de ${config.bot.negocio}. Genera el ÚLTIMO intento con mejor oferta para ${nombre}. Máximo 3 líneas. Productos: ${catalogoProductos}`,
      RECONEXION: `Eres ${config.bot.nombre} de ${config.bot.negocio}. Genera un mensaje suave de reconexión después de 1 semana para ${nombre}. Solo saluda y pregunta cómo está. Máximo 2 líneas.`,
    };

    const promptSeleccionado = prompts[tipoSeguimiento] || prompts['PRIMER_SEGUIMIENTO'] || '';

    const respuesta = await openai.chat.completions.create({
      model: config.openai.modelo,
      messages: [
        {
          role: 'system',
          content: `Eres ${config.bot.nombre}, vendedora de Pacas California. NUNCA digas que eres una IA. Mensajes cortos, 1-2 oraciones, tono relajado y casual, máximo 1 emoji.`,
        },
        { role: 'user', content: promptSeleccionado },
      ],
      max_tokens: 150,
      temperature: 0.9,
    });

    return (
      respuesta.choices[0]?.message?.content?.trim() ||
      `hola ${nombre}, como estas, queria saber si pudiste revisar lo que te comente`
    );
  } catch (error) {
    logger.error('Error al generar mensaje de seguimiento:', error);
    return `hola, me avisas si te interesa algo`;
  }
}
