// Script de seed - Carga productos reales de Pacas California en la base de datos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos - Pacas California...');

  // Limpiar datos existentes (en orden correcto por las FK)
  await prisma.followUp.deleteMany();
  await prisma.salesPipeline.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.botConfig.deleteMany();

  // Crear configuración del bot
  const botConfig = await prisma.botConfig.create({
    data: {
      nombreNegocio: 'Pacas California',
      nombreBot: 'Sofia',
      personalidad: 'amigable, directa, casual, como una persona real en WhatsApp',
      horarioInicio: 8,
      horarioFin: 21,
      mensajeBienvenida: 'Hola! 👋 Soy Sofia de Pacas California, qué te interesa?',
      mensajeFueraHorario: 'Hola! 😊 Ahorita no estoy disponible, te respondo mañana temprano!',
    },
  });

  console.log(`✅ Configuración del bot creada: ${botConfig.nombreBot} de ${botConfig.nombreNegocio}`);

  // =====================================================
  // PACAS DE ROPA
  // =====================================================
  const pacasRopa = [
    {
      nombre: 'Paca de Abrigos',
      descripcion: 'Paca de 100 piezas de abrigos de California. Variedad de tallas y estilos. Envíos internacionales.',
      precio: 750,
      precioOferta: null as number | null,
      stock: 10,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca Ropa Mujer',
      descripcion: 'Paca de 200 piezas de ropa de mujer. Blusas, pantalones, vestidos, variedad de marcas y tallas.',
      precio: 550,
      precioOferta: null as number | null,
      stock: 15,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca Ropa Hombre',
      descripcion: 'Paca de 200 piezas de ropa de hombre. Camisas, pantalones, playeras, variedad de marcas y tallas.',
      precio: 550,
      precioOferta: null as number | null,
      stock: 15,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca Trajes de Baño',
      descripcion: 'Paca de 300 piezas de trajes de baño. Bañadores, bikinis, shorts, variedad de tallas y colores.',
      precio: 500,
      precioOferta: null as number | null,
      stock: 10,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca de Maquillaje',
      descripcion: 'Paca de 400 piezas de maquillaje variado. Labiales, sombras, bases, corrector, maquillaje de marca.',
      precio: 650,
      precioOferta: null as number | null,
      stock: 8,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca de Zapatillas',
      descripcion: 'Paca de 30 pares de zapatillas originales. Nike, Adidas, Jordan y más marcas. Variedad de tallas.',
      precio: 980,
      precioOferta: null as number | null,
      stock: 10,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca Ropa Niños',
      descripcion: 'Paca de 200 piezas de ropa para niños. Variedad de tallas y estilos para niños y niñas.',
      precio: 550,
      precioOferta: null as number | null,
      stock: 12,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca de Perfumes',
      descripcion: 'Paca de 50 piezas de perfumes de marca. Fragancias para hombre y mujer de marcas reconocidas.',
      precio: 1100,
      precioOferta: null as number | null,
      stock: 5,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca de Relojes',
      descripcion: 'Paca de 50 piezas de relojes de moda y marca. Variedad de estilos para hombre y mujer.',
      precio: 1300,
      precioOferta: null as number | null,
      stock: 5,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
    {
      nombre: 'Paca Deportiva',
      descripcion: 'Paca de 400 piezas de ropa deportiva. Leggings, playeras, shorts, sudaderas. Envío incluido.',
      precio: 850,
      precioOferta: null as number | null,
      stock: 8,
      categoria: 'Pacas de Ropa',
      activo: true,
    },
  ];

  // =====================================================
  // iPHONES
  // =====================================================
  const iphones = [
    { nombre: 'iPhone 13 128GB', descripcion: 'iPhone 13 128GB desbloqueado. Chip A15 Bionic, cámara dual 12MP, Face ID. Envíos internacionales.', precio: 320, stock: 10 },
    { nombre: 'iPhone 13 Mini', descripcion: 'iPhone 13 Mini desbloqueado. Pantalla 5.4", chip A15 Bionic, compacto y potente. Envíos internacionales.', precio: 300, stock: 8 },
    { nombre: 'iPhone 13 Pro', descripcion: 'iPhone 13 Pro desbloqueado. Cámara triple 12MP, pantalla ProMotion 120Hz, chip A15. Envíos internacionales.', precio: 370, stock: 8 },
    { nombre: 'iPhone 13 Pro Max', descripcion: 'iPhone 13 Pro Max desbloqueado. Pantalla 6.7" Super Retina, cámara pro, batería de larga duración.', precio: 390, stock: 6 },
    { nombre: 'iPhone 14', descripcion: 'iPhone 14 desbloqueado. Chip A15 Bionic, cámara 12MP mejorada, Crash Detection. Envíos internacionales.', precio: 360, stock: 10 },
    { nombre: 'iPhone 14 Plus', descripcion: 'iPhone 14 Plus desbloqueado. Pantalla grande 6.7", batería de larga duración, chip A15. Envíos internacionales.', precio: 370, stock: 8 },
    { nombre: 'iPhone 14 Pro', descripcion: 'iPhone 14 Pro desbloqueado. Dynamic Island, cámara 48MP, chip A16 Bionic. Envíos internacionales.', precio: 410, stock: 8 },
    { nombre: 'iPhone 14 Pro Max', descripcion: 'iPhone 14 Pro Max desbloqueado. Pantalla 6.7" Always-On, Dynamic Island, cámara 48MP pro.', precio: 430, stock: 6 },
    { nombre: 'iPhone 15', descripcion: 'iPhone 15 desbloqueado. USB-C, cámara 48MP, chip A16, Dynamic Island. Envíos internacionales.', precio: 390, stock: 10 },
    { nombre: 'iPhone 15 Plus', descripcion: 'iPhone 15 Plus desbloqueado. Pantalla 6.7", USB-C, cámara 48MP, batería excepcional.', precio: 410, stock: 8 },
    { nombre: 'iPhone 15 Pro', descripcion: 'iPhone 15 Pro desbloqueado. Titanio, chip A17 Pro, cámara 48MP, Action Button. Envíos internacionales.', precio: 460, stock: 8 },
    { nombre: 'iPhone 15 Pro Max', descripcion: 'iPhone 15 Pro Max desbloqueado. Titanio, zoom 5x, chip A17 Pro, pantalla 6.7". El más avanzado.', precio: 490, stock: 6 },
    { nombre: 'iPhone 16', descripcion: 'iPhone 16 desbloqueado. Chip A18, cámara 48MP mejorada, Camera Control, Apple Intelligence.', precio: 430, stock: 10 },
    { nombre: 'iPhone 16 Plus', descripcion: 'iPhone 16 Plus desbloqueado. Pantalla grande, chip A18, Camera Control, Apple Intelligence.', precio: 450, stock: 8 },
    { nombre: 'iPhone 16 Pro', descripcion: 'iPhone 16 Pro desbloqueado. Chip A18 Pro, cámara 48MP con zoom 5x, pantalla 6.3". El más avanzado.', precio: 520, stock: 6 },
    { nombre: 'iPhone 16 Pro Max', descripcion: 'iPhone 16 Pro Max desbloqueado. Pantalla 6.9", chip A18 Pro, cámara pro con zoom 5x. Lo mejor de Apple.', precio: 560, stock: 5 },
  ];

  // =====================================================
  // LOTES DE LIQUIDACIÓN (122 lotes)
  // =====================================================
  const lotes = [
    { nombre: 'Caja de ropa mixta niño - 100 piezas', descripcion: 'Caja de 100 piezas de ropa mixta para niño. Tallas variadas, buen estado.', precio: 450, categoria: 'Lotes de Liquidación - Ropa' },
    { nombre: 'Caja de camisetas mixtas - 120 piezas', descripcion: 'Caja de 120 camisetas surtidas de marcas variadas. Para hombre y mujer.', precio: 420, categoria: 'Lotes de Liquidación - Ropa' },
    { nombre: 'Lote de jeans mixtos - 80 piezas', descripcion: 'Lote de 80 jeans de diferentes marcas y tallas. Hombre y mujer.', precio: 520, categoria: 'Lotes de Liquidación - Ropa' },
    { nombre: 'Lote de ropa deportiva - 70 sets', descripcion: 'Lote de 70 sets de ropa deportiva. Leggings, playeras, shorts de marca.', precio: 680, categoria: 'Lotes de Liquidación - Ropa' },
    { nombre: 'Lote de vestidos mixtos - 90 piezas', descripcion: 'Lote de 90 vestidos de diferentes estilos y tallas. Casuales y formales.', precio: 650, categoria: 'Lotes de Liquidación - Ropa' },
    { nombre: 'Lote de ropa plus size - 80 piezas', descripcion: 'Lote de 80 piezas de ropa tallas grandes (plus size). Variedad de estilos.', precio: 540, categoria: 'Lotes de Liquidación - Ropa' },
    { nombre: 'Lote de zapatillas mixtas originales - 70 pares', descripcion: 'Lote de 70 pares de zapatillas originales de marca. Nike, Adidas, Puma, etc.', precio: 850, categoria: 'Lotes de Liquidación - Calzado' },
    { nombre: 'Lote de sandalias y flats - 100 pares', descripcion: 'Lote de 100 pares de sandalias y flats para mujer. Variedad de colores y tallas.', precio: 650, categoria: 'Lotes de Liquidación - Calzado' },
    { nombre: 'Lote de botas y botines - 60 pares', descripcion: 'Lote de 60 pares de botas y botines de moda. Hombre y mujer.', precio: 780, categoria: 'Lotes de Liquidación - Calzado' },
    { nombre: 'Lote de calzado infantil - 120 pares', descripcion: 'Lote de 120 pares de calzado para niños. Tallas variadas, diferentes estilos.', precio: 700, categoria: 'Lotes de Liquidación - Calzado' },
    { nombre: 'Lote premium de sneakers - 40 pares', descripcion: 'Lote de 40 pares de sneakers premium de marcas reconocidas. Jordan, Yeezy, etc.', precio: 1250, categoria: 'Lotes de Liquidación - Calzado' },
    { nombre: 'Lote de bolsos y carteras - 60 piezas', descripcion: 'Lote de 60 bolsos y carteras de moda. Variedad de estilos y colores.', precio: 780, categoria: 'Lotes de Liquidación - Accesorios' },
    { nombre: 'Caja de gorras y sombreros - 120 piezas', descripcion: 'Caja de 120 gorras y sombreros de diferentes marcas y estilos.', precio: 390, categoria: 'Lotes de Liquidación - Accesorios' },
    { nombre: 'Lote de cinturones y billeteras - 150 piezas', descripcion: 'Lote de 150 cinturones y billeteras. Cuero y sintético, variedad de estilos.', precio: 450, categoria: 'Lotes de Liquidación - Accesorios' },
    { nombre: 'Lote de gafas de sol - 100 piezas', descripcion: 'Lote de 100 gafas de sol de moda. UV400, diferentes estilos y colores.', precio: 650, categoria: 'Lotes de Liquidación - Accesorios' },
    { nombre: 'Lote de relojes fashion - 80 piezas', descripcion: 'Lote de 80 relojes de moda. Diferentes estilos para hombre y mujer.', precio: 950, categoria: 'Lotes de Liquidación - Accesorios' },
    { nombre: 'Lote de sábanas mixtas - 80 sets', descripcion: 'Lote de 80 sets de sábanas. Diferentes tamaños y colores. Buena calidad.', precio: 620, categoria: 'Lotes de Liquidación - Hogar' },
    { nombre: 'Caja de toallas surtidas - 120 piezas', descripcion: 'Caja de 120 toallas de diferentes tamaños y colores. Algodón suave.', precio: 480, categoria: 'Lotes de Liquidación - Hogar' },
    { nombre: 'Lote de edredones y comforters - 40 sets', descripcion: 'Lote de 40 edredones y comforters. Diferentes tallas y diseños.', precio: 950, categoria: 'Lotes de Liquidación - Hogar' },
    { nombre: 'Lote de cortinas y blackout - 60 sets', descripcion: 'Lote de 60 sets de cortinas incluyendo blackout. Diferentes colores y tamaños.', precio: 540, categoria: 'Lotes de Liquidación - Hogar' },
    { nombre: 'Lote de almohadas y cojines - 100 piezas', descripcion: 'Lote de 100 almohadas y cojines decorativos. Diferentes tamaños y rellenos.', precio: 460, categoria: 'Lotes de Liquidación - Hogar' },
    { nombre: 'Pallet de microondas - 12 unidades', descripcion: 'Pallet de 12 microondas de diferentes marcas y capacidades. Funcionando.', precio: 1350, categoria: 'Lotes de Liquidación - Electrodomésticos' },
    { nombre: 'Pallet de air fryers - 20 unidades', descripcion: 'Pallet de 20 air fryers de diferentes marcas. Capacidades variadas.', precio: 1200, categoria: 'Lotes de Liquidación - Electrodomésticos' },
    { nombre: 'Lote de licuadoras y mixers - 24 unidades', descripcion: 'Lote de 24 licuadoras y mixers de diferentes marcas. Variedad de modelos.', precio: 950, categoria: 'Lotes de Liquidación - Electrodomésticos' },
    { nombre: 'Lote de cafeteras - 18 unidades', descripcion: 'Lote de 18 cafeteras de diferentes marcas. Espresso, goteo, Keurig.', precio: 1050, categoria: 'Lotes de Liquidación - Electrodomésticos' },
    { nombre: 'Pallet de aspiradoras - 15 unidades', descripcion: 'Pallet de 15 aspiradoras de diferentes marcas y modelos. Roomba, Dyson, etc.', precio: 1400, categoria: 'Lotes de Liquidación - Electrodomésticos' },
    { nombre: 'Lote de estufas - 10 unidades', descripcion: 'Lote de 10 estufas de gas y eléctricas de diferentes marcas.', precio: 2300, categoria: 'Lotes de Liquidación - Línea Blanca' },
    { nombre: 'Lote de refrigeradores - 8 unidades', descripcion: 'Lote de 8 refrigeradores de diferentes marcas y capacidades.', precio: 4800, categoria: 'Lotes de Liquidación - Línea Blanca' },
    { nombre: 'Lote de lavadoras - 8 unidades', descripcion: 'Lote de 8 lavadoras de carga frontal y superior. Diferentes marcas.', precio: 3600, categoria: 'Lotes de Liquidación - Línea Blanca' },
    { nombre: 'Lote de secadoras - 8 unidades', descripcion: 'Lote de 8 secadoras eléctricas y de gas. Diferentes marcas y capacidades.', precio: 3400, categoria: 'Lotes de Liquidación - Línea Blanca' },
    { nombre: 'Lote de dishwashers - 10 unidades', descripcion: 'Lote de 10 lavavajillas de diferentes marcas. Integrados y portátiles.', precio: 2900, categoria: 'Lotes de Liquidación - Línea Blanca' },
    { nombre: 'Pallet mixto de línea blanca - 12 unidades', descripcion: 'Pallet con 12 unidades mixtas de línea blanca. Lavadoras, secadoras, refrigeradores.', precio: 5900, categoria: 'Lotes de Liquidación - Línea Blanca' },
    { nombre: 'Lote de Smart TVs - 12 unidades', descripcion: 'Lote de 12 Smart TVs de diferentes marcas y tamaños. Samsung, LG, TCL, etc.', precio: 2800, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de soundbars - 30 unidades', descripcion: 'Lote de 30 soundbars de diferentes marcas. Bluetooth, con subwoofer incluido.', precio: 1650, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de bocinas Bluetooth - 40 unidades', descripcion: 'Lote de 40 bocinas Bluetooth portátiles de diferentes marcas y tamaños.', precio: 1200, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de monitores - 20 unidades', descripcion: 'Lote de 20 monitores de computadora. Diferentes tamaños y resoluciones.', precio: 1700, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de laptops mixtas - 25 unidades', descripcion: 'Lote de 25 laptops mixtas de diferentes marcas. HP, Dell, Lenovo, Asus.', precio: 4500, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de tablets - 40 unidades', descripcion: 'Lote de 40 tablets de diferentes marcas. iPad, Samsung, Amazon Fire.', precio: 2200, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de impresoras y scanners - 20 unidades', descripcion: 'Lote de 20 impresoras y scanners. HP, Canon, Epson, Brother.', precio: 1350, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de accesorios de PC - 250 piezas', descripcion: 'Lote de 250 accesorios para computadora. Teclados, ratones, cables, hubs.', precio: 780, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de UPS y networking - 60 piezas', descripcion: 'Lote de 60 piezas de UPS, routers, switches y accesorios de red.', precio: 1100, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de smartphones desbloqueados - 30 unidades', descripcion: 'Lote de 30 smartphones desbloqueados de diferentes marcas. Android variados.', precio: 3900, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Caja de accesorios para celular - 500 piezas', descripcion: 'Caja de 500 accesorios para celular. Cases, protectores, cargadores, cables.', precio: 750, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de smartwatch y wearables - 50 unidades', descripcion: 'Lote de 50 smartwatches y wearables. Apple Watch, Samsung Galaxy Watch, Fitbit.', precio: 1650, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de audífonos inalámbricos - 120 piezas', descripcion: 'Lote de 120 audífonos inalámbricos de diferentes marcas. In-ear y over-ear.', precio: 980, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Lote de power banks - 100 piezas', descripcion: 'Lote de 100 power banks de diferentes capacidades y marcas.', precio: 720, categoria: 'Lotes de Liquidación - Electrónica' },
    { nombre: 'Pallet de power tools - 35 unidades', descripcion: 'Pallet de 35 herramientas eléctricas. Taladros, sierras, lijadoras de marcas reconocidas.', precio: 1850, categoria: 'Lotes de Liquidación - Herramientas' },
    { nombre: 'Caja de herramientas manuales - 150 piezas', descripcion: 'Caja de 150 herramientas manuales surtidas. Llaves, destornilladores, martillos.', precio: 650, categoria: 'Lotes de Liquidación - Herramientas' },
    { nombre: 'Lote de iluminación - 80 piezas', descripcion: 'Lote de 80 piezas de iluminación. LEDs, lámparas, reflectores, luces decorativas.', precio: 1150, categoria: 'Lotes de Liquidación - Herramientas' },
    { nombre: 'Lote de abanicos de techo - 30 unidades', descripcion: 'Lote de 30 abanicos de techo de diferentes marcas. Con y sin luz incluida.', precio: 1250, categoria: 'Lotes de Liquidación - Herramientas' },
    { nombre: 'Lote de plomería y grifería - 100 piezas', descripcion: 'Lote de 100 piezas de plomería y grifería. Llaves, regaderas, accesorios de baño.', precio: 900, categoria: 'Lotes de Liquidación - Herramientas' },
    { nombre: 'Lote de equipos de pintura - 20 unidades', descripcion: 'Lote de 20 equipos de pintura. Pistolas, compresores, rodillos de marca.', precio: 1650, categoria: 'Lotes de Liquidación - Herramientas' },
    { nombre: 'Lote de comedores - 10 juegos', descripcion: 'Lote de 10 juegos de comedor completos. Mesa y sillas, diferentes estilos.', precio: 2900, categoria: 'Lotes de Liquidación - Muebles' },
    { nombre: 'Lote de escritorios y sillas - 33 piezas', descripcion: 'Lote de 33 piezas entre escritorios y sillas de oficina/hogar.', precio: 1500, categoria: 'Lotes de Liquidación - Muebles' },
    { nombre: 'Lote de sofás y recliners - 12 unidades', descripcion: 'Lote de 12 sofás y reclinables de diferentes estilos y telas.', precio: 3800, categoria: 'Lotes de Liquidación - Muebles' },
    { nombre: 'Lote de colchones - 20 unidades', descripcion: 'Lote de 20 colchones de diferentes tamaños y marcas. Twin, Full, Queen, King.', precio: 2600, categoria: 'Lotes de Liquidación - Muebles' },
    { nombre: 'Lote de patio furniture - 16 piezas', descripcion: 'Lote de 16 piezas de muebles para patio. Sillas, mesas, hamacas para exteriores.', precio: 2400, categoria: 'Lotes de Liquidación - Muebles' },
    { nombre: 'Truckload de muebles mixtos - 50 piezas', descripcion: 'Truckload con 50 piezas de muebles mixtos. Sala, comedor, recámara, oficina.', precio: 4900, categoria: 'Lotes de Liquidación - Muebles' },
    { nombre: 'Caja de cookware - 100 piezas', descripcion: 'Caja de 100 piezas de utensilios de cocina. Ollas, sartenes, sets completos.', precio: 650, categoria: 'Lotes de Liquidación - Cocina' },
    { nombre: 'Caja de vajilla y cristalería - 120 piezas', descripcion: 'Caja de 120 piezas de vajilla y cristalería. Platos, vasos, copas variadas.', precio: 520, categoria: 'Lotes de Liquidación - Cocina' },
    { nombre: 'Caja de organizadores - 150 piezas', descripcion: 'Caja de 150 organizadores para cocina y hogar. Contenedores, organizadores de cajones.', precio: 480, categoria: 'Lotes de Liquidación - Cocina' },
    { nombre: 'Caja de gadgets de cocina - 200 piezas', descripcion: 'Caja de 200 gadgets de cocina. Utensilios modernos, accesorios y herramientas.', precio: 580, categoria: 'Lotes de Liquidación - Cocina' },
    { nombre: 'Pallet de housewares mixto - 250 piezas', descripcion: 'Pallet con 250 artículos mixtos para el hogar. Cocina, baño, decoración.', precio: 950, categoria: 'Lotes de Liquidación - Cocina' },
    { nombre: 'Lote de cosméticos surtidos - 500 piezas', descripcion: 'Lote de 500 cosméticos surtidos. Maquillaje, skincare y accesorios de belleza.', precio: 1100, categoria: 'Lotes de Liquidación - Belleza' },
    { nombre: 'Caja de toiletries - 400 piezas', descripcion: 'Caja de 400 artículos de higiene y cuidado personal. Champú, jabón, desodorante.', precio: 850, categoria: 'Lotes de Liquidación - Belleza' },
    { nombre: 'Lote de herramientas de cabello - 80 unidades', descripcion: 'Lote de 80 herramientas para cabello. Planchas, rizadoras, secadores de marca.', precio: 980, categoria: 'Lotes de Liquidación - Belleza' },
    { nombre: 'Lote de skincare - 250 piezas', descripcion: 'Lote de 250 productos de skincare. Cremas, serums, mascarillas de marcas reconocidas.', precio: 1250, categoria: 'Lotes de Liquidación - Belleza' },
    { nombre: 'Lote de fragancias - 120 piezas', descripcion: 'Lote de 120 fragancias de marca. Perfumes y colonias para hombre y mujer.', precio: 2400, categoria: 'Lotes de Liquidación - Belleza' },
    { nombre: 'Caja de juguetes surtidos - 200 piezas', descripcion: 'Caja de 200 juguetes surtidos para diferentes edades. Variedad de marcas y tipos.', precio: 700, categoria: 'Lotes de Liquidación - Juguetes' },
    { nombre: 'Caja de peluches - 250 piezas', descripcion: 'Caja de 250 peluches de diferentes tamaños y personajes. Suaves y de calidad.', precio: 650, categoria: 'Lotes de Liquidación - Juguetes' },
    { nombre: 'Lote de juegos de mesa - 120 piezas', descripcion: 'Lote de 120 juegos de mesa y cartas. Clásicos y modernos para toda la familia.', precio: 780, categoria: 'Lotes de Liquidación - Juguetes' },
    { nombre: 'Lote de juguetes educativos - 150 piezas', descripcion: 'Lote de 150 juguetes educativos. STEM, construcción, arte para niños.', precio: 950, categoria: 'Lotes de Liquidación - Juguetes' },
    { nombre: 'Lote de ride-ons y juguetes grandes - 30 unidades', descripcion: 'Lote de 30 ride-ons y juguetes grandes. Triciclos, carros de batería, etc.', precio: 1350, categoria: 'Lotes de Liquidación - Juguetes' },
    { nombre: 'Lote de cochecitos - 20 unidades', descripcion: 'Lote de 20 cochecitos y carriolas para bebé. Diferentes marcas y modelos.', precio: 1400, categoria: 'Lotes de Liquidación - Bebé' },
    { nombre: 'Lote de car seats - 20 unidades', descripcion: 'Lote de 20 asientos de carro para bebé y niño. Diferentes grupos de edad.', precio: 1650, categoria: 'Lotes de Liquidación - Bebé' },
    { nombre: 'Caja de artículos de bebé - 400 piezas', descripcion: 'Caja de 400 artículos para bebé. Ropa, accesorios, juguetes y más.', precio: 950, categoria: 'Lotes de Liquidación - Bebé' },
    { nombre: 'Lote de muebles para bebé - 15 unidades', descripcion: 'Lote de 15 muebles para bebé. Cunas, cambiadores, guardarropas infantiles.', precio: 2200, categoria: 'Lotes de Liquidación - Bebé' },
    { nombre: 'Caja de feeding accessories - 200 piezas', descripcion: 'Caja de 200 accesorios para alimentación de bebé. Biberones, sillas, etc.', precio: 750, categoria: 'Lotes de Liquidación - Bebé' },
    { nombre: 'Caja de camas para mascotas - 80 piezas', descripcion: 'Caja de 80 camas y colchonetas para mascotas. Perros y gatos, diferentes tamaños.', precio: 450, categoria: 'Lotes de Liquidación - Mascotas' },
    { nombre: 'Caja de bowls y feeders - 200 piezas', descripcion: 'Caja de 200 comederos y bebederos para mascotas. Automáticos y manuales.', precio: 650, categoria: 'Lotes de Liquidación - Mascotas' },
    { nombre: 'Caja de juguetes y grooming - 250 piezas', descripcion: 'Caja de 250 juguetes y artículos de grooming para mascotas.', precio: 550, categoria: 'Lotes de Liquidación - Mascotas' },
    { nombre: 'Lote de carriers y kennels - 40 unidades', descripcion: 'Lote de 40 transportadores y kennels para mascotas. Diferentes tamaños.', precio: 980, categoria: 'Lotes de Liquidación - Mascotas' },
    { nombre: 'Caja de ropa para mascotas - 120 piezas', descripcion: 'Caja de 120 prendas de ropa para mascotas. Perros y gatos de diferentes tallas.', precio: 390, categoria: 'Lotes de Liquidación - Mascotas' },
    { nombre: 'Lote de equipos fitness compactos - 30 unidades', descripcion: 'Lote de 30 equipos de fitness compactos. Pesas, bandas, máquinas pequeñas.', precio: 1650, categoria: 'Lotes de Liquidación - Deportes' },
    { nombre: 'Lote de bicicletas y scooters - 20 unidades', descripcion: 'Lote de 20 bicicletas y scooters eléctricos/manuales. Adulto y niño.', precio: 2600, categoria: 'Lotes de Liquidación - Deportes' },
    { nombre: 'Caja de balones y accesorios - 200 piezas', descripcion: 'Caja de 200 balones y accesorios deportivos. Fútbol, básquet, voleibol.', precio: 620, categoria: 'Lotes de Liquidación - Deportes' },
    { nombre: 'Lote de camping gear - 60 piezas', descripcion: 'Lote de 60 artículos de camping. Tiendas, sacos, linternas, accesorios outdoor.', precio: 1200, categoria: 'Lotes de Liquidación - Deportes' },
    { nombre: 'Caja de accesorios de pesca - 120 piezas', descripcion: 'Caja de 120 accesorios de pesca. Cañas, señuelos, anzuelos, equipo variado.', precio: 980, categoria: 'Lotes de Liquidación - Deportes' },
    { nombre: 'Caja de car care - 300 piezas', descripcion: 'Caja de 300 artículos de cuidado del auto. Ceras, limpiadores, accesorios.', precio: 850, categoria: 'Lotes de Liquidación - Automotriz' },
    { nombre: 'Lote de floor mats y accesorios - 120 piezas', descripcion: 'Lote de 120 tapetes y accesorios para auto. Diferentes modelos y marcas.', precio: 650, categoria: 'Lotes de Liquidación - Automotriz' },
    { nombre: 'Lote de jump starters y baterías - 40 unidades', descripcion: 'Lote de 40 arrancadores de emergencia y baterías para auto.', precio: 1450, categoria: 'Lotes de Liquidación - Automotriz' },
    { nombre: 'Lote de luces y audio car - 80 piezas', descripcion: 'Lote de 80 piezas de iluminación y audio para auto. LED, bocinas, radios.', precio: 1250, categoria: 'Lotes de Liquidación - Automotriz' },
    { nombre: 'Lote de neumáticos mixtos - 40 unidades', descripcion: 'Lote de 40 neumáticos de diferentes medidas y marcas. Con buena vida útil.', precio: 2800, categoria: 'Lotes de Liquidación - Automotriz' },
    { nombre: 'Lote de sillas de oficina - 30 unidades', descripcion: 'Lote de 30 sillas de oficina ergonómicas. Diferentes marcas y modelos.', precio: 1200, categoria: 'Lotes de Liquidación - Oficina' },
    { nombre: 'Caja de útiles escolares - 500 piezas', descripcion: 'Caja de 500 útiles escolares surtidos. Lapiceros, libretas, mochilas pequeñas.', precio: 750, categoria: 'Lotes de Liquidación - Oficina' },
    { nombre: 'Lote de printers/copiers - 15 unidades', descripcion: 'Lote de 15 impresoras y copiadoras de diferentes marcas.', precio: 1850, categoria: 'Lotes de Liquidación - Oficina' },
    { nombre: 'Caja de mochilas - 150 piezas', descripcion: 'Caja de 150 mochilas de diferentes marcas, tamaños y estilos.', precio: 680, categoria: 'Lotes de Liquidación - Oficina' },
    { nombre: 'Caja de papel y consumibles - 200 piezas', descripcion: 'Caja de 200 piezas de papel y consumibles de oficina. Resmas, cartuchos, etc.', precio: 590, categoria: 'Lotes de Liquidación - Oficina' },
    { nombre: 'Lote navideño - 200 piezas', descripcion: 'Lote de 200 artículos navideños. Decoraciones, árboles, luces y accesorios.', precio: 950, categoria: 'Lotes de Liquidación - Estacional' },
    { nombre: 'Lote de Halloween - 180 piezas', descripcion: 'Lote de 180 artículos de Halloween. Disfraces, decoraciones y accesorios.', precio: 850, categoria: 'Lotes de Liquidación - Estacional' },
    { nombre: 'Lote de verano y piscina - 120 piezas', descripcion: 'Lote de 120 artículos de verano y piscina. Flotadores, juguetes acuáticos.', precio: 980, categoria: 'Lotes de Liquidación - Estacional' },
    { nombre: 'Lote de calefactores y abanicos - 40 unidades', descripcion: 'Lote de 40 calefactores y abanicos eléctricos de diferentes marcas.', precio: 1450, categoria: 'Lotes de Liquidación - Estacional' },
    { nombre: 'Truckload parcial estacional - 600 piezas', descripcion: 'Truckload de 600 piezas con mercancía estacional mixta. Gran variedad.', precio: 5800, categoria: 'Lotes de Liquidación - Estacional' },
    { nombre: 'Lote de muebles de jardín - 25 piezas', descripcion: 'Lote de 25 piezas de muebles para jardín y exteriores. Resistentes al clima.', precio: 1850, categoria: 'Lotes de Liquidación - Jardín' },
    { nombre: 'Lote de herramientas de jardín - 35 unidades', descripcion: 'Lote de 35 herramientas de jardín. Podadoras, palas, rastrillos, sopladoras.', precio: 2100, categoria: 'Lotes de Liquidación - Jardín' },
    { nombre: 'Lote de maceteros y decoración - 150 piezas', descripcion: 'Lote de 150 maceteros y artículos de decoración para jardín y exteriores.', precio: 720, categoria: 'Lotes de Liquidación - Jardín' },
    { nombre: 'Lote de parrillas y BBQ - 18 unidades', descripcion: 'Lote de 18 parrillas y equipos de BBQ. Gas y carbón, diferentes tamaños.', precio: 1650, categoria: 'Lotes de Liquidación - Jardín' },
    { nombre: 'Lote de almacenamiento outdoor - 20 unidades', descripcion: 'Lote de 20 unidades de almacenamiento para exteriores. Casetas, cajas, estantes.', precio: 1350, categoria: 'Lotes de Liquidación - Jardín' },
    { nombre: 'Lote de equipos de limpieza - 20 unidades', descripcion: 'Lote de 20 equipos de limpieza profesional. Hidrolavadoras, pulidoras, etc.', precio: 2200, categoria: 'Lotes de Liquidación - Comercial' },
    { nombre: 'Lote de smallwares para restaurante - 40 piezas', descripcion: 'Lote de 40 piezas de utensilios para restaurante. Batería de cocina profesional.', precio: 2700, categoria: 'Lotes de Liquidación - Comercial' },
    { nombre: 'Lote de estanterías para almacén - 30 módulos', descripcion: 'Lote de 30 módulos de estanterías metálicas para almacén o tienda.', precio: 3800, categoria: 'Lotes de Liquidación - Comercial' },
    { nombre: 'Lote de blancos para hotel - 300 piezas', descripcion: 'Lote de 300 artículos de ropa de cama para hotel. Sábanas, toallas, almohadas.', precio: 1500, categoria: 'Lotes de Liquidación - Comercial' },
    { nombre: 'Lote para convenience store - 220 piezas', descripcion: 'Lote de 220 artículos para tienda de conveniencia. Snacks, bebidas, artículos varios.', precio: 1900, categoria: 'Lotes de Liquidación - Comercial' },
    { nombre: 'Caja de first aid y wellness - 300 piezas', descripcion: 'Caja de 300 artículos de primeros auxilios y bienestar. Botiquines, vitaminas.', precio: 950, categoria: 'Lotes de Liquidación - Salud' },
    { nombre: 'Lote de massagers y recovery - 80 unidades', descripcion: 'Lote de 80 masajeadores y equipos de recuperación. Pistolas, rodillos, etc.', precio: 1350, categoria: 'Lotes de Liquidación - Salud' },
    { nombre: 'Lote de suministros médicos no Rx - 400 piezas', descripcion: 'Lote de 400 suministros médicos sin receta. Vendas, guantes, oxímetros, etc.', precio: 1800, categoria: 'Lotes de Liquidación - Salud' },
    { nombre: 'Lote de ayudas de movilidad - 30 unidades', descripcion: 'Lote de 30 ayudas de movilidad. Andaderas, sillas de ruedas, bastones.', precio: 2200, categoria: 'Lotes de Liquidación - Salud' },
    { nombre: 'Lote de básculas y diagnósticos hogar - 120 piezas', descripcion: 'Lote de 120 básculas y equipos de diagnóstico para hogar. Tensiómetros, etc.', precio: 980, categoria: 'Lotes de Liquidación - Salud' },
    { nombre: 'Pallet de mercancía mixta retail - 200 piezas', descripcion: 'Pallet de 200 piezas de mercancía mixta de retail. Variedad de categorías.', precio: 900, categoria: 'Lotes de Liquidación - Mixto' },
    { nombre: 'Pallet tipo Target/Walmart mix - 250 piezas', descripcion: 'Pallet de 250 piezas tipo Target/Walmart. Electrodomésticos, ropa, juguetes, hogar.', precio: 1100, categoria: 'Lotes de Liquidación - Mixto' },
    { nombre: 'Lote de shelf pulls premium - 300 piezas', descripcion: 'Lote de 300 artículos premium de shelf pulls. Productos de alta gama sin abrir.', precio: 1350, categoria: 'Lotes de Liquidación - Mixto' },
    { nombre: 'Truckload general merchandise - 1200 piezas', descripcion: 'Truckload completo con 1200 piezas de mercancía general. La mayor variedad disponible.', precio: 10000, categoria: 'Lotes de Liquidación - Mixto' },
  ];

  // Insertar pacas de ropa
  const pacasResult = await prisma.product.createMany({ data: pacasRopa });
  console.log(`✅ ${pacasResult.count} pacas de ropa creadas`);

  // Insertar iPhones
  const iphoneData = iphones.map((p) => ({
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    precioOferta: null as number | null,
    stock: p.stock,
    categoria: 'iPhones',
    activo: true,
  }));
  const iphoneResult = await prisma.product.createMany({ data: iphoneData });
  console.log(`✅ ${iphoneResult.count} iPhones creados`);

  // Insertar lotes de liquidación
  const lotesData = lotes.map((l) => ({
    nombre: l.nombre,
    descripcion: l.descripcion,
    precio: l.precio,
    precioOferta: null as number | null,
    stock: 1,
    categoria: l.categoria,
    activo: true,
  }));
  const lotesResult = await prisma.product.createMany({ data: lotesData });
  console.log(`✅ ${lotesResult.count} lotes de liquidación creados`);

  const totalProductos = pacasResult.count + iphoneResult.count + lotesResult.count;

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Resumen:');
  console.log(`   - Bot configurado: Sofia de Pacas California`);
  console.log(`   - Pacas de ropa: ${pacasResult.count}`);
  console.log(`   - iPhones: ${iphoneResult.count}`);
  console.log(`   - Lotes de liquidación: ${lotesResult.count}`);
  console.log(`   - Total productos: ${totalProductos}`);
  console.log('\n💡 Tip: Ejecuta "npm run prisma:studio" para ver la base de datos en el navegador');
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
