// Procesador de mensajes entrantes - Orquesta toda la lógica del bot
import { TipoMensaje, EtapaPipeline } from '@prisma/client';
import { logger } from '../utils/logger';
import { sanitizarTexto } from '../utils/helpers';
import { generarRespuesta } from '../ai/brain';
import { formatearCatalogoParaIA } from '../sales/catalog';
import { obtenerOCrearPipeline, actualizarEtapaPipeline, parsearEtapa, debeCrearSeguimiento } from '../sales/pipeline';
import { programarSeguimientos, cancelarSeguimientos } from '../sales/followup';
import { detectarSeñalesCompra, obtenerMensajeProcesoPago } from '../sales/closer';
import { obtenerOCrearCliente, actualizarNombreCliente, extraerNombreDeTexto, pausarCliente, reactivarCliente, clientePausado } from '../services/customer';
import { guardarMensaje, obtenerHistorialParaIA, contarMensajes } from '../services/conversation';
import { obtenerMemoriaCliente, actualizarMemoriaDesdeHistorial, formatearMemoriaParaPrompt } from '../services/memory';
import { aprenderDeRespuestaManual, obtenerAprendizajesParaPrompt } from '../learning/sellerLearning';
import { verificarYGenerarResumen } from '../learning/conversationSummarizer';
import { enviarMensajeTexto, marcarComoLeido, enviarTypingIndicator, calcularDelayTipeo } from './sender';
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

    // Detectar comandos del dueño (#humano, #bot, #estado) antes de cualquier procesamiento
    const textoTrimmed = textoMensaje.trim();
    if (textoTrimmed.startsWith('#')) {
      await procesarComando(textoTrimmed, telefono);
      return;
    }

    // Obtener o crear cliente
    const nombreContacto = contactos.find((c) => c.wa_id === telefono)?.profile?.name;
    const cliente = await obtenerOCrearCliente(telefono, nombreContacto);

    // Guardar mensaje entrante en el historial
    await guardarMensaje(cliente.id, sanitizarTexto(textoMensaje), TipoMensaje.ENTRANTE, messageId);

    // Actualizar último contacto
    await cancelarSeguimientos(cliente.id);

    // Si el bot está pausado para este cliente, solo guardar el mensaje y no responder
    if (await clientePausado(cliente.id)) {
      logger.info(`⏸️ Bot pausado para ${telefono} — mensaje guardado sin respuesta`);
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

    // Obtener memoria persistente del cliente y aprendizajes del vendedor en paralelo
    const [memoriaRaw, aprendizajesTexto] = await Promise.all([
      obtenerMemoriaCliente(cliente.id),
      obtenerAprendizajesParaPrompt(8),
    ]);
    const memoriaTexto = memoriaRaw ? formatearMemoriaParaPrompt(memoriaRaw) : undefined;

    // Generar respuesta con la IA
    const resultado = await generarRespuesta(sanitizarTexto(textoMensaje), {
      telefono,
      nombreCliente: cliente.nombre || nombreExtraido || undefined,
      historialMensajes: historial,
      catalogoProductos: catalogo,
      etapaPipeline: pipeline.etapa,
      notasCliente: cliente.notas || undefined,
      memoriaCliente: memoriaTexto || undefined,
      aprendizajesVendedor: aprendizajesTexto || undefined,
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

    // Enviar respuesta al cliente con delay humanizado (simula tipeo)
    const respuestaFinal = resultado.respuesta;
    const delayMs = calcularDelayTipeo(respuestaFinal);
    await enviarTypingIndicator(telefono);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await enviarMensajeTexto(telefono, respuestaFinal);

    // Guardar respuesta en el historial
    await guardarMensaje(cliente.id, respuestaFinal, TipoMensaje.SALIENTE);

    // Auto-pausar si Sofia no sabe algo (menciona al socio)
    if (/confirmarlo con mi socio|te aviso en unos minutos/i.test(respuestaFinal)) {
      await pausarCliente(telefono);
      logger.info(`⏸️ Bot auto-pausado para ${telefono} porque Sofia no supo responder`);
    }

    // Programar seguimientos si aplica
    const etapaActualizada = resultado.nuevaEtapa
      ? (parsearEtapa(resultado.nuevaEtapa) ?? pipeline.etapa)
      : pipeline.etapa;

    if (debeCrearSeguimiento(etapaActualizada) || resultado.requiereSeguimiento) {
      await programarSeguimientos(cliente.id);
    }

    // Actualizar memoria del cliente y verificar resumen en background (no bloqueante)
    const historialActualizado = await obtenerHistorialParaIA(cliente.id, 30);
    const totalMensajes = await contarMensajes(cliente.id);
    void Promise.all([
      actualizarMemoriaDesdeHistorial(cliente.id, historialActualizado),
      verificarYGenerarResumen(cliente.id, totalMensajes, historialActualizado),
    ]).catch((err) => logger.warn('Error en actualización de aprendizaje en background:', err));

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

// Procesar comandos del dueño (#humano, #bot, #estado, #respuesta:)
async function procesarComando(texto: string, telefono: string): Promise<void> {
  const comando = texto.toLowerCase();

  try {
    if (comando === '#humano') {
      await pausarCliente(telefono);
      await enviarMensajeTexto(
        telefono,
        '🔴 Bot PAUSADO para este cliente. Ahora puedes responder manualmente. Escribe #bot cuando termines.'
      );
      logger.info(`🔴 Comando #humano ejecutado para ${telefono}`);
    } else if (comando === '#bot') {
      await reactivarCliente(telefono);
      await enviarMensajeTexto(
        telefono,
        '🟢 Bot ACTIVADO para este cliente. Sofia retomará la conversación automáticamente.'
      );
      logger.info(`🟢 Comando #bot ejecutado para ${telefono}`);
    } else if (comando === '#estado') {
      const cliente = await obtenerOCrearCliente(telefono);
      const pausado = await clientePausado(cliente.id);
      const estadoTexto = pausado ? 'PAUSADO 🔴' : 'ACTIVO 🟢';
      await enviarMensajeTexto(telefono, `ℹ️ Estado del bot para este cliente: ${estadoTexto}`);
      logger.info(`ℹ️ Comando #estado ejecutado para ${telefono}: ${estadoTexto}`);
    } else if (texto.toLowerCase().startsWith('#respuesta:')) {
      // Aprender del estilo de respuesta manual del vendedor
      const textoRespuesta = texto.slice('#respuesta:'.length).trim();
      if (textoRespuesta) {
        const cliente = await obtenerOCrearCliente(telefono);
        const historial = await obtenerHistorialParaIA(cliente.id, 10);
        const contextoCliente = historial.length > 0
          ? historial.slice(-3).map((m) => `${m.rol === 'user' ? 'Cliente' : 'Vendedor'}: ${m.contenido}`).join('\n')
          : undefined;
        const cantidadAprendizajes = await aprenderDeRespuestaManual(textoRespuesta, contextoCliente);
        await enviarMensajeTexto(
          telefono,
          `📚 Aprendizaje registrado (${cantidadAprendizajes} patrón(es) extraídos). Pendiente de aprobación.`
        );
        logger.info(`📚 Aprendizaje manual registrado desde ${telefono}`);
      }
    } else {
      logger.debug(`Comando desconocido ignorado: ${texto} de ${telefono}`);
    }
  } catch (error) {
    logger.error(`Error al procesar comando "${texto}" para ${telefono}:`, error);
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
