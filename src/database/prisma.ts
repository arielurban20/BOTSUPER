// Cliente Prisma Singleton - Conexión a PostgreSQL en Railway
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Declaración global para evitar múltiples instancias en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Singleton de Prisma
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

// En desarrollo, guardar la instancia en el objeto global
if (process.env['NODE_ENV'] !== 'production') {
  global.prisma = prisma;
}

// Log de queries en desarrollo
if (process.env['NODE_ENV'] === 'development') {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    logger.debug(`Query: ${e.query} - Duración: ${e.duration}ms`);
  });
}

// Función para conectar a la base de datos
export async function conectarDB(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado a PostgreSQL exitosamente');
  } catch (error) {
    logger.error('❌ Error al conectar a PostgreSQL:', error);
    throw error;
  }
}

// Función para desconectar de la base de datos
export async function desconectarDB(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Desconectado de PostgreSQL');
  } catch (error) {
    logger.error('Error al desconectar de PostgreSQL:', error);
  }
}

export default prisma;
