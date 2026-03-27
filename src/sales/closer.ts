// Técnicas de cierre de venta - Sistema automático de cierre
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { formatearCatalogoParaIA, obtenerProductosPocaStock } from './catalog';

// Tipos de cierre disponibles
export type TipoCierre =
  | 'ESCASEZ'
  | 'URGENCIA'
  | 'ALTERNATIVO'
  | 'RESUMEN'
  | 'TESTIMONIO'
  | 'BONUS'
  | 'PRECIO_ESPECIAL';

// Interfaz para contexto de cierre
interface ContextoCierre {
  nombreCliente?: string;
  productoInteres?: string;
  precioProducto?: string;
  etapaPipeline?: string;
}

// Mensajes de cierre predefinidos por técnica
const MENSAJES_CIERRE: Record<TipoCierre, string[]> = {
  ESCASEZ: [
    '⚠️ Te aviso algo importante: {producto} tiene muy poco stock. Literalmente me quedan {stock} unidades. No quisiera que se quede sin él después 😕',
    '🔔 Ojo! {producto} está volando. Quedan pocas piezas disponibles. ¿Lo separamos ahora?',
    '⚡ Stock casi agotado de {producto}! Hay {stock} disponibles. ¿Confirmamos antes de que se vaya?',
  ],
  URGENCIA: [
    '⏰ Te cuento algo: esta oferta especial solo dura hasta hoy. Mañana vuelve al precio normal. ¿Aprovechamos ahora?',
    '🔥 Atención! Esta semana tenemos un descuento especial que no se va a repetir. ¿Cerramos hoy?',
    '⏱️ El precio especial vence esta noche. ¿Lo confirmamos ahora para que puedas aprovechar?',
  ],
  ALTERNATIVO: [
    '¿Qué te parece más conveniente: llevarte el plan básico o el premium? Ambos tienen garantía incluida 😊',
    'Para facilitarte la decisión: ¿preferís pagarlo en 3 cuotas o en 6 cuotas? Te acomodo como mejor te venga.',
    '¿Te lo mando esta semana o la próxima? Solo dime cuándo lo necesitás y lo coordinamos.',
  ],
  RESUMEN: [
    '✅ Entonces, repasando todo: {producto} te da {beneficios}. Precio especial de {precio} con garantía incluida. ¿Procedemos?',
    '📋 Te resumo la propuesta: {producto} → {beneficios} → {precio}. Todo lo que necesitás. ¿Cerramos?',
  ],
  TESTIMONIO: [
    '💬 Te cuento algo: {nombre_cliente_real} compró esto hace poco y me escribió para decirme que fue lo mejor que hizo. ¿Querés tener la misma experiencia?',
    '⭐ Esta semana ya vendí varios de estos y todos los clientes están contentísimos. No me gustaría que vos te lo perdieras 😊',
    '🌟 Mirá, el 90% de quienes lo compraron vuelven a pedir más. Es de esas cosas que uno no sabe que necesita hasta que lo tiene.',
  ],
  BONUS: [
    '🎁 Sabés qué, porque me caíste bien (en serio 😄): si cerramos ahora te incluyo {bonus} sin costo adicional. Pero solo si es hoy.',
    '🎉 Tengo una sorpresa para vos: si confirmás ahora mismo, te mando de regalo {bonus}. ¿Qué decís?',
    '🎀 Bonus especial: si comprás hoy, vas a recibir {bonus} sin cargo. Es solo por hoy. ¿Lo hacemos?',
  ],
  PRECIO_ESPECIAL: [
    '💰 Voy a hacer algo que no hago siempre: te voy a dar el precio especial de ${precio_especial}. Solo por hoy y solo para vos. ¿Cerramos?',
    '🤝 Por la confianza que me mostraste, puedo hacerte un descuento especial. ¿Cuánto es lo máximo que podés invertir hoy?',
    '✨ Tengo un precio especial reservado para clientes nuevos: {precio_especial}. No se lo digo a todo el mundo. ¿Te interesa?',
  ],
};

// Seleccionar la mejor técnica de cierre según el contexto
export function seleccionarTecnicaCierre(contexto: ContextoCierre): TipoCierre {
  const { etapaPipeline } = contexto;

  // Si está en etapa de objeción, usar precio especial o bonus
  if (etapaPipeline === 'OBJECION') {
    return Math.random() > 0.5 ? 'PRECIO_ESPECIAL' : 'BONUS';
  }

  // Si está en etapa de cierre, usar escasez o urgencia
  if (etapaPipeline === 'CIERRE') {
    return Math.random() > 0.5 ? 'ESCASEZ' : 'URGENCIA';
  }

  // Si está negociando, usar alternativo o resumen
  if (etapaPipeline === 'NEGOCIANDO') {
    return Math.random() > 0.5 ? 'ALTERNATIVO' : 'RESUMEN';
  }

  // Por defecto, rotar entre técnicas efectivas
  const tecnicas: TipoCierre[] = ['ESCASEZ', 'URGENCIA', 'TESTIMONIO', 'BONUS'];
  // El índice siempre es válido dado que tecnicas no está vacío
  return tecnicas[Math.floor(Math.random() * tecnicas.length)] as TipoCierre;
}

// Generar mensaje de cierre
export async function generarMensajeCierre(
  tipoCierre: TipoCierre,
  contexto: ContextoCierre
): Promise<string> {
  const mensajes = MENSAJES_CIERRE[tipoCierre];
  const mensajeBase = mensajes[Math.floor(Math.random() * mensajes.length)] || '';

  // Obtener datos dinámicos
  let mensaje = mensajeBase;

  // Reemplazar variables dinámicas
  if (contexto.nombreCliente) {
    mensaje = mensaje.replace('{nombre}', contexto.nombreCliente);
  }

  if (contexto.productoInteres) {
    mensaje = mensaje.replace('{producto}', contexto.productoInteres);
  }

  if (contexto.precioProducto) {
    mensaje = mensaje.replace('{precio}', contexto.precioProducto);
    mensaje = mensaje.replace('{precio_especial}', contexto.precioProducto);
  }

  // Obtener stock real si hay producto de interés
  if (tipoCierre === 'ESCASEZ') {
    const productosEscasos = await obtenerProductosPocaStock(5);
    if (productosEscasos.length > 0) {
      const producto = productosEscasos[0];
      if (producto) {
        mensaje = mensaje.replace('{stock}', producto.stock.toString());
        if (!contexto.productoInteres) {
          mensaje = mensaje.replace('{producto}', producto.nombre);
        }
      }
    }
  }

  // Bonus genérico si no hay uno específico
  mensaje = mensaje.replace('{bonus}', 'envío gratis + asesoramiento personalizado');
  mensaje = mensaje.replace('{beneficios}', 'calidad garantizada, entrega rápida y soporte incluido');
  mensaje = mensaje.replace('{nombre_cliente_real}', 'un cliente de la semana pasada');

  logger.debug(`Técnica de cierre aplicada: ${tipoCierre}`);
  return mensaje;
}

// Generar secuencia de cierre completa
export async function generarSecuenciaCierre(contexto: ContextoCierre): Promise<string[]> {
  const tecnica = seleccionarTecnicaCierre(contexto);
  const mensajeCierre = await generarMensajeCierre(tecnica, contexto);
  const catalogo = await formatearCatalogoParaIA();

  const secuencia = [mensajeCierre];

  // Agregar mensaje de proceso de compra si está en cierre
  if (contexto.etapaPipeline === 'CIERRE') {
    secuencia.push(
      `Para concretar tu pedido solo necesito:\n1️⃣ Tu nombre completo\n2️⃣ Dirección de envío\n3️⃣ Método de pago (Western Union, MoneyGram o cuenta bancaria USA)\n\n¿Empezamos? 😊`
    );
  }

  return secuencia;
}

// Detectar señales de compra en el mensaje
export function detectarSeñalesCompra(mensaje: string): boolean {
  const señales = [
    'cómo lo pido',
    'como lo compro',
    'quiero comprarlo',
    'me lo llevo',
    'lo quiero',
    'cuánto es',
    'cómo pago',
    'formas de pago',
    'acepto',
    'confirmo',
    'perfecto lo llevo',
    'me interesa comprarlo',
    'precio',
    'cuántas cuotas',
    'pago con',
    'cuando llega',
    'tiempo de envío',
    'tiene garantía',
    'dónde lo retiro',
  ];

  const textoNormalizado = mensaje
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return señales.some((señal) =>
    textoNormalizado.includes(
      señal
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    )
  );
}

// Obtener mensaje de proceso de compra
export function obtenerMensajeProcesoPago(): string {
  return `¡Genial! 🎉 Para procesar tu pedido necesito estos datos:\n\n👤 *Nombre completo:*\n📍 *Dirección de envío:*\n📱 *Teléfono de contacto:*\n💳 *Método de pago:* (Western Union, MoneyGram o cuenta bancaria USA)\n\nEnviámelos y en seguida proceso todo! 😊`;
}
