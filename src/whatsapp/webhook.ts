// Webhook para recibir mensajes de WhatsApp Business API
import { Router, Request, Response } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { procesarMensajeEntrante } from './messageProcessor';

export const webhookRouter = Router();

// ============================================================
// GET /webhook - Verificación del webhook de Meta
// ============================================================
webhookRouter.get('/', (req: Request, res: Response) => {
  const modo = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info(`Verificación de webhook: modo=${modo}, token=${token}`);

  if (modo === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('✅ Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    logger.warn('❌ Verificación de webhook fallida - Token incorrecto');
    res.sendStatus(403);
  }
});

// ============================================================
// POST /webhook - Recibir mensajes entrantes de WhatsApp
// ============================================================
webhookRouter.post('/', (req: Request, res: Response) => {
  // Responder 200 inmediatamente para evitar reintentos de Meta
  res.sendStatus(200);

  // Procesar en background para no bloquear la respuesta
  procesarWebhookPayload(req.body).catch((error) => {
    logger.error('Error al procesar webhook payload:', error);
  });
});

// Procesar el payload del webhook de forma asíncrona
async function procesarWebhookPayload(body: WebhookPayload): Promise<void> {
  try {
    if (!body?.object) return;

    if (body.object !== 'whatsapp_business_account') {
      logger.debug('Payload ignorado: no es de WhatsApp Business');
      return;
    }

    for (const entrada of body.entry || []) {
      for (const cambio of entrada.changes || []) {
        if (cambio.field !== 'messages') continue;

        const valor = cambio.value;

        // Procesar mensajes entrantes
        for (const mensaje of valor.messages || []) {
          await procesarMensajeEntrante(mensaje, valor.contacts || []);
        }

        // Procesar actualizaciones de estado (leído, enviado, etc.)
        for (const estado of valor.statuses || []) {
          logger.debug(`Estado del mensaje ${estado.id}: ${estado.status}`);
        }
      }
    }
  } catch (error) {
    logger.error('Error al procesar payload del webhook:', error);
  }
}

// Interfaces para el payload del webhook de WhatsApp
interface WebhookPayload {
  object?: string;
  entry?: WebhookEntry[];
}

interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

interface WebhookChange {
  field: string;
  value: WebhookChangeValue;
}

interface WebhookChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WebhookContact[];
  messages?: WebhookMessage[];
  statuses?: WebhookStatus[];
}

export interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'button' | 'location' | 'contacts' | 'sticker' | 'reaction' | 'unknown';
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description: string };
  };
  button?: { payload: string; text: string };
  context?: { from: string; id: string };
}

interface WebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
