// Funciones auxiliares del proyecto

// Obtener variable de entorno con valor por defecto
export function obtenerEnv(nombre: string, valorPorDefecto: string): string {
  return process.env[nombre] || valorPorDefecto;
}

// Esperar una cantidad de milisegundos
export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Formatear número como moneda
export function formatearMoneda(valor: number, moneda = 'USD'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
  }).format(valor);
}

// Limpiar número de teléfono (remover caracteres especiales)
export function limpiarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, '');
}

// Obtener hora actual en Argentina
export function obtenerHoraActual(): number {
  return new Date().getHours();
}

// Verificar si es horario laboral
export function esHorarioLaboral(horaInicio: number, horaFin: number): boolean {
  const horaActual = obtenerHoraActual();
  return horaActual >= horaInicio && horaActual < horaFin;
}

// Capitalizar primera letra de cada palabra
export function capitalizar(texto: string): string {
  return texto
    .split(' ')
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
}

// Truncar texto a un máximo de caracteres
export function truncarTexto(texto: string, maxCaracteres: number): string {
  if (texto.length <= maxCaracteres) return texto;
  return texto.substring(0, maxCaracteres - 3) + '...';
}

// Calcular fecha futura en minutos
export function calcularFechaFutura(minutos: number): Date {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() + minutos);
  return fecha;
}

// Calcular fecha futura en horas
export function calcularFechaFuturaHoras(horas: number): Date {
  const fecha = new Date();
  fecha.setHours(fecha.getHours() + horas);
  return fecha;
}

// Calcular fecha futura en días
export function calcularFechaFuturaDias(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

// Generar ID único corto
export function generarIdCorto(): string {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Verificar si una cadena tiene palabras clave de objeción
export function contieneObjecion(texto: string, palabrasClave: string[]): boolean {
  const textoNormalizado = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return palabrasClave.some((palabra) =>
    textoNormalizado.includes(palabra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}

// Formatear fecha en español
export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Verificar si el mensaje es una confirmación positiva
export function esRespuestaPositiva(texto: string): boolean {
  const palabrasPositivas = ['si', 'sí', 'ok', 'dale', 'claro', 'perfecto', 'bueno', 'genial', 'listo', 'quiero', 'confirmo', 'acepto', 'me interesa', 'vamos'];
  return contieneObjecion(texto, palabrasPositivas);
}

// Verificar si el mensaje es una negación
export function esRespuestaNegativa(texto: string): boolean {
  const palabrasNegativas = ['no', 'nop', 'nope', 'para nada', 'no gracias', 'no quiero', 'no me interesa', 'cancelar'];
  return contieneObjecion(texto, palabrasNegativas);
}

// Sanitizar texto para evitar inyecciones
export function sanitizarTexto(texto: string): string {
  return texto
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 4096); // Límite de WhatsApp
}
