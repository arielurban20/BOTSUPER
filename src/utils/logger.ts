// Logger profesional usando Winston
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato personalizado para los logs (nivel ya viene en formato correcto de Winston)
const formatoLog = printf(({ level, message, timestamp: ts, stack }) => {
  const msg = stack || message;
  return `[${ts}] ${level}: ${msg}`;
});

// Crear el logger
export const logger = winston.createLogger({
  level: obtenerEnv('LOG_LEVEL', 'info'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    formatoLog
  ),
  transports: [
    // Consola con colores
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss' }),
        printf(({ level, message, timestamp: ts, stack }) => {
          const msg = stack || message;
          return `[${ts}] ${level}: ${msg}`;
        })
      ),
    }),
    // Archivo de errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Archivo de todos los logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// En producción, no mostrar stack traces en consola
if (process.env['NODE_ENV'] === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  );
}

// Función de ayuda para obtener variable de entorno (necesaria para evitar dependencia circular)
function obtenerEnv(nombre: string, valorPorDefecto: string): string {
  return process.env[nombre] || valorPorDefecto;
}
