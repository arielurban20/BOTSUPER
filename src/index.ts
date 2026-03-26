// Punto de entrada principal - Servidor Express para el Super Bot de Ventas WhatsApp
import 'dotenv/config';
import express from 'express';
import { config } from './config/env';
import { conectarDB } from './database/prisma';
import { logger } from './utils/logger';
import { webhookRouter } from './whatsapp/webhook';
import { iniciarCronSeguimientos } from './sales/followup';
import { obtenerEstadisticasVentas } from './services/order';
import { obtenerEstadisticasClientes } from './services/customer';
import { obtenerEstadisticasPipeline } from './sales/pipeline';

// Crear la aplicación Express
const app = express();

// ============================================================
// Middlewares
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging de requests
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// Rutas principales
// ============================================================

// Webhook de WhatsApp
app.use('/webhook', webhookRouter);

// Ruta de salud del servidor
app.get('/health', (_req, res) => {
  res.json({
    estado: 'activo',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    entorno: config.entorno,
    bot: config.bot.nombre,
    negocio: config.bot.negocio,
  });
});

// Ruta de estadísticas del bot
app.get('/estadisticas', async (_req, res) => {
  try {
    const [ventas, clientes, pipeline] = await Promise.all([
      obtenerEstadisticasVentas(),
      obtenerEstadisticasClientes(),
      obtenerEstadisticasPipeline(),
    ]);

    res.json({
      ventas,
      clientes,
      pipeline,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Ruta raíz
app.get('/', (_req, res) => {
  res.json({
    nombre: `🤖 ${config.bot.negocio} - Super Bot de Ventas`,
    estado: 'activo',
    version: '1.0.0',
    descripcion: 'Bot de ventas para WhatsApp con IA - Listo para vender 💪',
  });
});

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ============================================================
// Inicialización del servidor
// ============================================================
async function iniciarServidor(): Promise<void> {
  try {
    // Conectar a la base de datos
    await conectarDB();

    // Iniciar el servidor Express
    app.listen(config.puerto, () => {
      logger.info('='.repeat(60));
      logger.info(`🚀 ${config.bot.negocio} - Super Bot de Ventas`);
      logger.info(`🤖 Bot: ${config.bot.nombre}`);
      logger.info(`🌐 Servidor: http://localhost:${config.puerto}`);
      logger.info(`📱 Webhook: http://localhost:${config.puerto}/webhook`);
      logger.info(`📊 Stats: http://localhost:${config.puerto}/estadisticas`);
      logger.info(`🔧 Entorno: ${config.entorno}`);
      logger.info('='.repeat(60));
    });

    // Iniciar el sistema de seguimientos automáticos
    iniciarCronSeguimientos();

    logger.info('✅ Todos los sistemas iniciados correctamente');
  } catch (error) {
    logger.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de apagado graceful
process.on('SIGTERM', async () => {
  logger.info('Señal SIGTERM recibida - Cerrando servidor...');
  const { desconectarDB } = await import('./database/prisma');
  await desconectarDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Señal SIGINT recibida - Cerrando servidor...');
  const { desconectarDB } = await import('./database/prisma');
  await desconectarDB();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada no manejada:', reason);
});

// Iniciar el servidor
iniciarServidor();

export default app;
