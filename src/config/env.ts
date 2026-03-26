// Configuración y validación de variables de entorno
import dotenv from 'dotenv';

dotenv.config();

// Función para obtener variable de entorno obligatoria
function requerirEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Variable de entorno requerida no configurada: ${nombre}`);
  }
  return valor;
}

// Función para obtener variable de entorno opcional con valor por defecto
function obtenerEnv(nombre: string, valorPorDefecto: string): string {
  return process.env[nombre] || valorPorDefecto;
}

function obtenerEnvNumero(nombre: string, valorPorDefecto: number): number {
  const valor = process.env[nombre];
  if (!valor) return valorPorDefecto;
  const numero = parseInt(valor, 10);
  if (isNaN(numero)) return valorPorDefecto;
  return numero;
}

// Configuración de variables de entorno
export const config = {
  // Servidor
  puerto: obtenerEnvNumero('PORT', 3000),
  entorno: obtenerEnv('NODE_ENV', 'development'),

  // WhatsApp Business API (Meta)
  whatsapp: {
    token: requerirEnv('WHATSAPP_TOKEN'),
    phoneId: requerirEnv('WHATSAPP_PHONE_ID'),
    verifyToken: requerirEnv('WHATSAPP_VERIFY_TOKEN'),
    businessId: obtenerEnv('WHATSAPP_BUSINESS_ID', ''),
    apiVersion: obtenerEnv('WHATSAPP_API_VERSION', 'v19.0'),
    apiUrl: 'https://graph.facebook.com',
  },

  // Base de Datos
  database: {
    url: requerirEnv('DATABASE_URL'),
  },

  // OpenAI
  openai: {
    apiKey: requerirEnv('OPENAI_API_KEY'),
    modelo: obtenerEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    maxTokens: obtenerEnvNumero('OPENAI_MAX_TOKENS', 500),
  },

  // Configuración del Bot
  bot: {
    nombre: obtenerEnv('BOT_NAME', 'Sofía'),
    negocio: obtenerEnv('BUSINESS_NAME', 'Mi Negocio'),
    personalidad: obtenerEnv('BOT_PERSONALITY', 'amigable, persuasiva, profesional'),
  },

  // Horarios de atención (hora en formato 24h)
  horario: {
    inicio: obtenerEnvNumero('HORARIO_INICIO', 8),
    fin: obtenerEnvNumero('HORARIO_FIN', 21),
  },
} as const;

export type Config = typeof config;
