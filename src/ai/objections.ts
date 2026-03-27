// Manejo inteligente de objeciones de venta
import { logger } from '../utils/logger';
import { contieneObjecion } from '../utils/helpers';

// Tipos de objeciones
export type TipoObjecion =
  | 'PRECIO_CARO'
  | 'NECESITA_PENSAR'
  | 'NO_INTERESA'
  | 'YA_TIENE_UNO'
  | 'SIN_DINERO'
  | 'DESPUES_ESCRIBE'
  | 'DESCONFIANZA'
  | 'MALA_EXPERIENCIA_PREVIA'
  | 'CONSULTAR_PAREJA'
  | 'NO_DETECTADA';

// Interfaz para resultado de detección
interface ResultadoDeteccion {
  tieneObjecion: boolean;
  tipoObjecion: TipoObjecion;
  confianza: number; // 0-100
}

// Palabras clave para detectar cada tipo de objeción
const PALABRAS_CLAVE_OBJECIONES: Record<TipoObjecion, string[]> = {
  PRECIO_CARO: [
    'caro', 'costoso', 'muy caro', 'es mucho', 'precio alto', 'muy costoso',
    'demasiado caro', 'no vale tanto', 'muy elevado', 'excesivo', 'no me alcanza el precio'
  ],
  NECESITA_PENSAR: [
    'lo pienso', 'voy a pensar', 'necesito pensar', 'déjame pensar',
    'tengo que pensarlo', 'lo evalúo', 'lo considero', 'le doy una vuelta',
    'me tomo el tiempo', 'no me apuro'
  ],
  NO_INTERESA: [
    'no me interesa', 'no estoy interesado', 'no gracias', 'no lo necesito',
    'no quiero', 'paso', 'no es para mí', 'no aplica', 'no busco eso'
  ],
  YA_TIENE_UNO: [
    'ya tengo uno', 'ya lo tengo', 'ya tengo', 'ya compré', 'ya adquirí',
    'tengo uno igual', 'tengo algo similar', 'ya cuento con uno'
  ],
  SIN_DINERO: [
    'no tengo dinero', 'no tengo plata', 'estoy sin dinero', 'no me alcanza',
    'no puedo pagarlo', 'no tengo presupuesto', 'sin fondos', 'quebrado',
    'pelado', 'no tengo efectivo', 'sin cash'
  ],
  DESPUES_ESCRIBE: [
    'después te escribo', 'te escribo luego', 'después veo', 'más tarde',
    'luego te contacto', 'después confirmo', 'ahorita no', 'en otro momento',
    'cuando pueda', 'ya te aviso'
  ],
  DESCONFIANZA: [
    'es confiable', 'es seguro', 'es estafa', 'es real', 'cómo sé que es verdad',
    'no confío', 'parece estafa', 'es legítimo', 'hay garantía', 'y si no llega'
  ],
  MALA_EXPERIENCIA_PREVIA: [
    'me pasó antes', 'ya me estafaron', 'la última vez', 'antes compré y',
    'tuve mala experiencia', 'no me fue bien', 'quedé mal', 'me fallaron'
  ],
  CONSULTAR_PAREJA: [
    'consultar con', 'preguntarle a', 'hablar con mi', 'mi pareja', 'mi esposo',
    'mi esposa', 'mi marido', 'mi mujer', 'decidir juntos', 'preguntar en casa',
    'ver con mi socio'
  ],
  NO_DETECTADA: [],
};

// Respuestas sugeridas para cada tipo de objeción
export const RESPUESTAS_OBJECION: Record<TipoObjecion, string[]> = {
  PRECIO_CARO: [
    '💰 Entiendo que el precio importa. Pero pensalo así: ¿cuánto te cuesta NO tenerlo? Muchos clientes me dicen que fue la mejor inversión. ¿Querés que te cuente cómo te ayuda específicamente?',
    '🤔 Sé que parece mucho al principio. Por eso tengo buenas noticias: podés pagarlo en cuotas cómodas. ¿Te funciona mejor 3 o 6 cuotas?',
    '✨ La calidad tiene su precio, y esto es de lo mejor que hay. Además, ahora tengo una oferta especial solo por hoy que te deja muy buen precio. ¿Te la cuento?',
  ],
  NECESITA_PENSAR: [
    '⏰ ¡Claro que sí! Mientras pensás, te cuento que esta oferta tiene vigencia solo por hoy. No quisiera que después te arrepientas de haberla perdido 😊 ¿Qué te genera más dudas?',
    '🤔 Perfecto, te entiendo. A veces necesitamos un empujoncito para decidir. ¿Qué sería lo que te haría decir "sí" ahora mismo?',
    '💡 Mientras lo pensás, ¿puedo preguntarte qué es lo que más te gustó del producto? Así veo si puedo mejorar la propuesta para vos.',
  ],
  NO_INTERESA: [
    '😊 ¡Hola! No hay problema. Pero antes de irte, ¿me contás qué es lo que estás buscando? A veces tenemos opciones que la gente no ve a primera vista y que pueden ser perfectas para vos.',
    '🤷‍♀️ Entiendo. ¿Puedo preguntarte qué es lo que no te convence? Quizás tenemos algo diferente que sí sea exactamente lo que necesitás.',
  ],
  YA_TIENE_UNO: [
    '🎯 ¡Qué bien! Y dime, ¿estás 100% satisfecho/a con el que tenés? Porque lo que yo ofrezco tiene [mejoras clave] que muchos dicen que marcan la diferencia. ¿Te cuento?',
    '💪 Genial que ya tengas uno. La pregunta es: ¿tiene todas las características que este tiene? Porque la mayoría de quienes ya tenían uno dicen que esto lo supera por completo.',
  ],
  SIN_DINERO: [
    '💳 ¡No te preocupes! Tengo opciones de cuotas sin interés para que no sientas el impacto. ¿Cuánto podrías pagar por mes cómodamente?',
    '🌟 Entiendo perfectamente. Por eso mismo tengo una versión de entrada que te da todos los beneficios principales a un precio mucho menor. ¿La vemos?',
    '🤝 Mirá, quiero ayudarte a que lo tengas. Cuéntame qué presupuesto tenés y buscamos la manera de que funcione para los dos.',
  ],
  DESPUES_ESCRIBE: [
    '📅 ¡Dale! Solo para que no pierdas la oferta de hoy, ¿a qué hora te conviene que te escriba? Así te reservo el precio especial.',
    '⏰ Perfecto. Pero te aviso que este precio especial vence hoy. ¿Puedo hacer la reserva con tus datos ahora y después coordinamos el pago?',
  ],
  DESCONFIANZA: [
    '🔒 ¡Totalmente entendible! Somos [número] años en el mercado y tenés garantía de devolución. Además, podés ver opiniones reales de clientes. ¿Querés que te comparta algunas?',
    '✅ Me alegra que preguntes. La seguridad es lo primero. Aceptamos Western Union, MoneyGram o transferencia a cuenta bancaria en Estados Unidos, y tenés garantía completa. ¿Qué más necesitás saber?',
  ],
  MALA_EXPERIENCIA_PREVIA: [
    '😔 Lamento mucho lo que viviste. Eso no está bien y lo entiendo perfectamente. Por eso nosotros trabajamos diferente: con garantía real y soporte post-venta. ¿Me das la oportunidad de demostrártelo?',
    '💪 Qué bueno que me lo contás. La experiencia previa mala es exactamente por qué nosotros hacemos las cosas diferente. ¿Qué te falló antes? Quiero asegurarme de que con nosotros no pase.',
  ],
  CONSULTAR_PAREJA: [
    '👫 ¡Por supuesto! La familia es lo primero. ¿Querés que te mande toda la información por este chat así se la mostrás? Así tiene todos los detalles para decidir juntos 😊',
    '🤝 Perfecto. Para facilitarte, te puedo mandar un resumen con los beneficios y el precio para que lo vean juntos. ¿Te parece?',
  ],
  NO_DETECTADA: [],
};

// Detectar tipo de objeción en un mensaje
export function detectarObjecion(mensaje: string): ResultadoDeteccion {
  const texto = mensaje.toLowerCase();

  for (const [tipo, palabrasClave] of Object.entries(PALABRAS_CLAVE_OBJECIONES)) {
    if (tipo === 'NO_DETECTADA') continue;

    if (contieneObjecion(texto, palabrasClave)) {
      const confianza = calcularConfianza(texto, palabrasClave);
      logger.debug(`Objeción detectada: ${tipo} (confianza: ${confianza}%)`);
      return {
        tieneObjecion: true,
        tipoObjecion: tipo as TipoObjecion,
        confianza,
      };
    }
  }

  return {
    tieneObjecion: false,
    tipoObjecion: 'NO_DETECTADA',
    confianza: 0,
  };
}

// Calcular nivel de confianza basado en cuántas palabras clave coinciden
function calcularConfianza(texto: string, palabrasClave: string[]): number {
  const coincidencias = palabrasClave.filter((palabra) =>
    texto.includes(palabra.toLowerCase())
  ).length;
  return Math.min(100, Math.round((coincidencias / palabrasClave.length) * 100) + 50);
}

// Obtener respuesta aleatoria para un tipo de objeción
export function obtenerRespuestaObjecion(tipoObjecion: TipoObjecion): string {
  const respuestas = RESPUESTAS_OBJECION[tipoObjecion];
  if (!respuestas || respuestas.length === 0) {
    return '';
  }
  const indice = Math.floor(Math.random() * respuestas.length);
  return respuestas[indice] || '';
}

// Obtener contexto adicional para el prompt de IA basado en la objeción
export function obtenerContextoObjecion(tipoObjecion: TipoObjecion): string {
  const contextos: Partial<Record<TipoObjecion, string>> = {
    PRECIO_CARO: 'El cliente dice que es muy caro. Ofrece cuotas, descuento especial o enfócate en el valor y retorno de inversión.',
    NECESITA_PENSAR: 'El cliente dice que lo va a pensar. Crea urgencia genuina, descubre qué le genera duda y ofrece un bonus por decidir ahora.',
    NO_INTERESA: 'El cliente dice que no le interesa. Pregunta qué sí busca, ofrece alternativas y descubre la necesidad real.',
    YA_TIENE_UNO: 'El cliente ya tiene algo similar. Muestra las ventajas superiores y pregunta si está completamente satisfecho con lo que tiene.',
    SIN_DINERO: 'El cliente dice que no tiene dinero. Ofrece cuotas, versión más económica o ayúdalo a ver el valor a largo plazo.',
    DESPUES_ESCRIBE: 'El cliente dice que después escribe. Crea urgencia, ofrece reservar el precio y programa un seguimiento.',
    DESCONFIANZA: 'El cliente desconfía. Ofrece garantías, testimonios reales y tranquilízalo sobre la seguridad.',
    MALA_EXPERIENCIA_PREVIA: 'El cliente tuvo mala experiencia antes. Escúchalo, empatiza y muestra cómo eres diferente.',
    CONSULTAR_PAREJA: 'El cliente necesita consultar con alguien más. Ofrece enviar información resumida y facilita la decisión en conjunto.',
  };

  return contextos[tipoObjecion] || '';
}
