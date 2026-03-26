// Envío de mensajes via WhatsApp Business API (Meta)
import axios from 'axios';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// URL base de la API de WhatsApp
const WHATSAPP_API_URL = `${config.whatsapp.apiUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneId}/messages`;

// Headers de autenticación
const HEADERS = {
  Authorization: `Bearer ${config.whatsapp.token}`,
  'Content-Type': 'application/json',
};

// Interfaz para respuesta de la API
interface RespuestaWhatsApp {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

// Enviar mensaje de texto
export async function enviarMensajeTexto(
  telefono: string,
  mensaje: string
): Promise<string | null> {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefono,
      type: 'text',
      text: {
        preview_url: false,
        body: mensaje,
      },
    };

    const respuesta = await axios.post<RespuestaWhatsApp>(WHATSAPP_API_URL, payload, {
      headers: HEADERS,
    });

    const messageId = respuesta.data.messages[0]?.id;
    logger.info(`✅ Mensaje enviado a ${telefono}: ${mensaje.substring(0, 50)}...`);
    return messageId || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error al enviar mensaje a ${telefono}:`, error.response?.data || error.message);
    } else {
      logger.error(`Error al enviar mensaje a ${telefono}:`, error);
    }
    return null;
  }
}

// Enviar mensaje con botones interactivos
export async function enviarMensajeConBotones(
  telefono: string,
  cuerpo: string,
  botones: Array<{ id: string; titulo: string }>,
  cabecera?: string,
  pie?: string
): Promise<string | null> {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefono,
      type: 'interactive',
      interactive: {
        type: 'button',
        ...(cabecera && {
          header: { type: 'text', text: cabecera },
        }),
        body: { text: cuerpo },
        ...(pie && { footer: { text: pie } }),
        action: {
          buttons: botones.slice(0, 3).map((btn) => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.titulo.substring(0, 20) },
          })),
        },
      },
    };

    const respuesta = await axios.post<RespuestaWhatsApp>(WHATSAPP_API_URL, payload, {
      headers: HEADERS,
    });

    const messageId = respuesta.data.messages[0]?.id;
    logger.info(`✅ Mensaje con botones enviado a ${telefono}`);
    return messageId || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error al enviar botones a ${telefono}:`, error.response?.data || error.message);
    } else {
      logger.error(`Error al enviar botones a ${telefono}:`, error);
    }
    // Fallback: enviar como texto plano
    return await enviarMensajeTexto(telefono, cuerpo);
  }
}

// Enviar lista de productos
export async function enviarListaProductos(
  telefono: string,
  titulo: string,
  cuerpo: string,
  seccionTitulo: string,
  productos: Array<{ id: string; titulo: string; descripcion: string }>
): Promise<string | null> {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefono,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: titulo },
        body: { text: cuerpo },
        footer: { text: 'Selecciona un producto para más info' },
        action: {
          button: 'Ver productos',
          sections: [
            {
              title: seccionTitulo,
              rows: productos.slice(0, 10).map((prod) => ({
                id: prod.id,
                title: prod.titulo.substring(0, 24),
                description: prod.descripcion.substring(0, 72),
              })),
            },
          ],
        },
      },
    };

    const respuesta = await axios.post<RespuestaWhatsApp>(WHATSAPP_API_URL, payload, {
      headers: HEADERS,
    });

    const messageId = respuesta.data.messages[0]?.id;
    logger.info(`✅ Lista de productos enviada a ${telefono}`);
    return messageId || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error al enviar lista a ${telefono}:`, error.response?.data || error.message);
    } else {
      logger.error(`Error al enviar lista a ${telefono}:`, error);
    }
    return await enviarMensajeTexto(telefono, cuerpo);
  }
}

// Enviar imagen con caption
export async function enviarImagen(
  telefono: string,
  urlImagen: string,
  caption?: string
): Promise<string | null> {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefono,
      type: 'image',
      image: {
        link: urlImagen,
        ...(caption && { caption }),
      },
    };

    const respuesta = await axios.post<RespuestaWhatsApp>(WHATSAPP_API_URL, payload, {
      headers: HEADERS,
    });

    const messageId = respuesta.data.messages[0]?.id;
    logger.info(`✅ Imagen enviada a ${telefono}`);
    return messageId || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error al enviar imagen a ${telefono}:`, error.response?.data || error.message);
    } else {
      logger.error(`Error al enviar imagen a ${telefono}:`, error);
    }
    return null;
  }
}

// Marcar mensaje como leído
export async function marcarComoLeido(messageId: string): Promise<void> {
  try {
    const url = `${config.whatsapp.apiUrl}/${config.whatsapp.apiVersion}/${config.whatsapp.phoneId}/messages`;
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      },
      { headers: HEADERS }
    );
  } catch (error) {
    // No es crítico si falla
    logger.debug(`No se pudo marcar como leído el mensaje ${messageId}`);
  }
}

// Enviar mensaje de plantilla (template)
export async function enviarPlantilla(
  telefono: string,
  nombrePlantilla: string,
  idioma = 'es',
  parametros?: string[]
): Promise<string | null> {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'template',
      template: {
        name: nombrePlantilla,
        language: { code: idioma },
        ...(parametros && {
          components: [
            {
              type: 'body',
              parameters: parametros.map((param) => ({
                type: 'text',
                text: param,
              })),
            },
          ],
        }),
      },
    };

    const respuesta = await axios.post<RespuestaWhatsApp>(WHATSAPP_API_URL, payload, {
      headers: HEADERS,
    });

    const messageId = respuesta.data.messages[0]?.id;
    logger.info(`✅ Plantilla ${nombrePlantilla} enviada a ${telefono}`);
    return messageId || null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`Error al enviar plantilla a ${telefono}:`, error.response?.data || error.message);
    } else {
      logger.error(`Error al enviar plantilla a ${telefono}:`, error);
    }
    return null;
  }
}

// Enviar múltiples mensajes con retraso (para parecer más humano)
export async function enviarMensajesConRetraso(
  telefono: string,
  mensajes: string[],
  retrasoMs = 1500
): Promise<void> {
  for (let i = 0; i < mensajes.length; i++) {
    await enviarMensajeTexto(telefono, mensajes[i]!);
    if (i < mensajes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, retrasoMs));
    }
  }
}
