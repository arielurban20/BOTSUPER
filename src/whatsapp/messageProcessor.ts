// Procesador de mensajes entrantes - Orquesta toda la lógica del bot
import { TipoMensaje, EtapaPipeline } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { esHorarioLaboral, sanitizarTexto } from '../utils/helpers';
import { generarRespuesta } from '../ai/brain';
import { formatearCatalogoParaIA } from '../sales/catalog';
import { obtenerOCrearPipeline, actualizarEtapaPipeline, parsearEtapa, debeCrearSeguimiento } from '../sales/pipeline';
import { programarSeguimientos, cancelarSeguimientos } from '../sales/followup';
import { detectarSeñalesCompra, obtenerMensajeProcesoPago } from '../sales/closer';
import { obtenerOCrearCliente, actualizarNombreCliente, extraerNombreDeTexto } from '../services/customer';
import { guardarMensaje, obtenerHistorialParaIA } from '../services/conversation';
import { enviarMensajeTexto, marcarComoLeido } from './sender';
import type { WebhookMessage, WebhookContact } from './webhook';

// Procesar un mensaje entrante
export async function procesarMensajeEntrante(
  mensaje: WebhookMessage,
  contactos: WebhookContact[]
): Promise<void> {
  const telefono = mensaje.from;
  const messageId = mensaje.id;

  try {
    // Extraer texto del mensaje según el tipo
    const textoMensaje = extraerTextoMensaje(mensaje);
    if (!textoMensaje) {
      logger.debug(`Mensaje tipo ${mensaje.type} de ${telefono} ignorado (no es texto)`);
      return;
    }

    logger.info(`📨 Mensaje recibido de ${telefono}: ${textoMensaje.substring(0, 80)}`);

    // Marcar como leído
    await marcarComoLeido(messageId);

    // Obtener o crear cliente
    const nombreContacto = contactos.find((c) => c.wa_id === telefono)?.profile?.name;
    const cliente = await obtenerOCrearCliente(telefono, nombreContacto);

    // Guardar mensaje entrante en el historial
    await guardarMensaje(cliente.id, sanitizarTexto(textoMensaje), TipoMensaje.ENTRANTE, messageId);

    // Actualizar último contacto
    await cancelarSeguimientos(cliente.id);

    // Verificar horario laboral
    if (!esHorarioLaboral(config.horario.inicio, config.horario.fin)) {
      await manejarFueraDeHorario(telefono, cliente.id);
      return;
    }

    // Obtener pipeline del cliente
    const pipeline = await obtenerOCrearPipeline(cliente.id);

    // Detectar si el cliente mencionó su nombre
    const nombreExtraido = extraerNombreDeTexto(textoMensaje);
    if (nombreExtraido && !cliente.nombre) {
      await actualizarNombreCliente(cliente.id, nombreExtraido);
    }

    // Obtener historial de conversación para la IA
    const historial = await obtenerHistorialParaIA(cliente.id, 20);

    // Obtener catálogo para el contexto
    const catalogo = await formatearCatalogoParaIA();

    // Generar respuesta con la IA
    const resultado = await generarRespuesta(sanitizarTexto(textoMensaje), {
      telefono,
      nombreCliente: cliente.nombre || nombreExtraido || undefined,
      historialMensajes: historial,
      catalogoProductos: catalogo,
      etapaPipeline: pipeline.etapa,
      notasCliente: cliente.notas || undefined,
    });

    // Actualizar etapa del pipeline si cambió
    if (resultado.nuevaEtapa) {
      const nuevaEtapa = parsearEtapa(resultado.nuevaEtapa);
      if (nuevaEtapa && nuevaEtapa !== pipeline.etapa) {
        await actualizarEtapaPipeline(cliente.id, nuevaEtapa);

        // Si el cliente compró, marcar como vendido
        if (nuevaEtapa === EtapaPipeline.VENDIDO) {
          await manejarVenta(cliente.id, telefono);
          return;
        }
      }
    }

    // Detectar señales de compra directas
    if (detectarSeñalesCompra(textoMensaje)) {
      await actualizarEtapaPipeline(cliente.id, EtapaPipeline.CIERRE);
    }

    // Enviar respuesta al cliente
    const respuestaFinal = resultado.respuesta;
    await enviarMensajeTexto(telefono, respuestaFinal);

    // Guardar respuesta en el historial
    await guardarMensaje(cliente.id, respuestaFinal, TipoMensaje.SALIENTE);

    // Programar seguimientos si aplica
    const etapaActualizada = resultado.nuevaEtapa
      ? (parsearEtapa(resultado.nuevaEtapa) ?? pipeline.etapa)
      : pipeline.etapa;

    if (debeCrearSeguimiento(etapaActualizada) || resultado.requiereSeguimiento) {
      await programarSeguimientos(cliente.id);
    }

    logger.info(`✅ Mensaje procesado para ${telefono}`);
  } catch (error) {
    logger.error(`Error al procesar mensaje de ${telefono}:`, error);

    // Intentar enviar mensaje de error genérico
    try {
      await enviarMensajeTexto(
        telefono,
        '¡Hola! Tuve un pequeño inconveniente técnico 😅 Dame un momento y vuelvo enseguida.'
      );
    } catch {
      // Ignorar error en el fallback
    }
  }
}

// Extraer texto del mensaje según su tipo
function extraerTextoMensaje(mensaje: WebhookMessage): string | null {
  switch (mensaje.type) {
    case 'text':
      return mensaje.text?.body || null;

    case 'interactive':
      if (mensaje.interactive?.type === 'button_reply') {
        return mensaje.interactive.button_reply?.title || null;
      }
      if (mensaje.interactive?.type === 'list_reply') {
        return mensaje.interactive.list_reply?.title || null;
      }
      return null;

    case 'button':
      return mensaje.button?.text || null;

    case 'image':
      return mensaje.image?.caption || '[Imagen enviada]';

    case 'audio':
      return '[Nota de voz enviada - No puedo escuchar audios, por favor escríbeme]';

    default:
      return null;
  }
}

// Manejar mensaje fuera de horario
async function manejarFueraDeHorario(telefono: string, customerId: string): Promise<void> {
  try {
    // Obtener mensaje de fuera de horario de la configuración
    const botConfig = await import('../database/prisma').then((m) =>
      m.prisma.botConfig.findFirst()
    );

    const mensajeFueraHorario =
      botConfig?.mensajeFueraHorario ||
      `¡Hola! Gracias por escribirme 😊 Nuestro horario de atención es de ${config.horario.inicio}:00 a ${config.horario.fin}:00 hs. Te respondo en cuanto estemos disponibles. ¡Hasta pronto!`;

    await enviarMensajeTexto(telefono, mensajeFueraHorario);
    await guardarMensaje(customerId, mensajeFueraHorario, TipoMensaje.SALIENTE);
  } catch (error) {
    logger.error('Error al enviar mensaje fuera de horario:', error);
  }
}

// Manejar venta completada
async function manejarVenta(customerId: string, telefono: string): Promise<void> {
  try {
    const mensajeVenta =
      `¡Excelente! 🎉 Tu pedido fue registrado con éxito. En breve te contacto para coordinar los detalles de pago y envío. ¡Gracias por elegirnos! 🙏`;

    await enviarMensajeTexto(telefono, mensajeVenta);
    await guardarMensaje(customerId, mensajeVenta, TipoMensaje.SALIENTE);
    await actualizarEtapaPipeline(customerId, EtapaPipeline.VENDIDO);

    // Programar upsell después de 1 hora
    const { programarUpsell } = await import('../sales/followup');
    await programarUpsell(customerId, 'producto reciente');

    logger.info(`🏆 VENTA COMPLETADA para cliente ${customerId}`);
  } catch (error) {
    logger.error(`Error al manejar venta para ${customerId}:`, error);
  }
}
