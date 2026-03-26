// Script de seed - Carga productos de ejemplo en la base de datos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

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
      nombreNegocio: 'TechStore Argentina',
      nombreBot: 'Sofía',
      personalidad: 'amigable, persuasiva, profesional, empática',
      horarioInicio: 8,
      horarioFin: 21,
      mensajeBienvenida:
        '¡Hola! Soy Sofía de TechStore Argentina 👋 ¿En qué puedo ayudarte hoy? Tenemos increíbles productos esperándote 😊',
      mensajeFueraHorario:
        '¡Hola! Gracias por escribirnos 😊 Nuestro horario de atención es de 8:00 a 21:00 hs. Te respondo en cuanto volvamos. ¡Hasta pronto!',
    },
  });

  console.log(`✅ Configuración del bot creada: ${botConfig.nombreBot}`);

  // Crear productos de ejemplo
  const productos = await prisma.product.createMany({
    data: [
      {
        nombre: 'iPhone 15 Pro Max 256GB',
        descripcion:
          'El smartphone más avanzado de Apple. Chip A17 Pro, cámara 48MP, titanio, Dynamic Island. Garantía oficial 1 año.',
        precio: 1299.99,
        precioOferta: 1199.99,
        stock: 8,
        categoria: 'Smartphones',
        imagenUrl: 'https://example.com/iphone15pro.jpg',
        activo: true,
      },
      {
        nombre: 'Samsung Galaxy S24 Ultra 512GB',
        descripcion:
          'Galaxy AI con S Pen integrado. Cámara 200MP, pantalla 6.8" AMOLED, batería 5000mAh. El más completo de Samsung.',
        precio: 1149.99,
        precioOferta: 999.99,
        stock: 5,
        categoria: 'Smartphones',
        imagenUrl: 'https://example.com/s24ultra.jpg',
        activo: true,
      },
      {
        nombre: 'MacBook Pro M3 14"',
        descripcion:
          'Laptop profesional con chip M3. 16GB RAM, 512GB SSD, pantalla Liquid Retina XDR. Para profesionales exigentes.',
        precio: 1899.99,
        precioOferta: null,
        stock: 3,
        categoria: 'Laptops',
        imagenUrl: 'https://example.com/macbookpro.jpg',
        activo: true,
      },
      {
        nombre: 'AirPods Pro 2da Generación',
        descripcion:
          'Auriculares con cancelación activa de ruido, audio espacial adaptativo y chip H2. La mejor experiencia de audio inalámbrica.',
        precio: 249.99,
        precioOferta: 199.99,
        stock: 20,
        categoria: 'Accesorios',
        imagenUrl: 'https://example.com/airpodspro.jpg',
        activo: true,
      },
      {
        nombre: 'iPad Pro M2 11" WiFi 256GB',
        descripcion:
          'La tablet más potente del mundo. Pantalla Liquid Retina, chip M2, compatible con Apple Pencil 2 y Magic Keyboard.',
        precio: 799.99,
        precioOferta: 749.99,
        stock: 6,
        categoria: 'Tablets',
        imagenUrl: 'https://example.com/ipadpro.jpg',
        activo: true,
      },
      {
        nombre: 'Apple Watch Series 9 45mm',
        descripcion:
          'Smartwatch más avanzado. Pantalla siempre activa, monitoreo de salud avanzado, GPS, resistente al agua.',
        precio: 399.99,
        precioOferta: 349.99,
        stock: 12,
        categoria: 'Wearables',
        imagenUrl: 'https://example.com/watch9.jpg',
        activo: true,
      },
      {
        nombre: 'Cargador MagSafe 15W',
        descripcion:
          'Cargador inalámbrico magnético original de Apple. Carga rápida hasta 15W para iPhone 12 en adelante.',
        precio: 39.99,
        precioOferta: null,
        stock: 50,
        categoria: 'Accesorios',
        imagenUrl: 'https://example.com/magsafe.jpg',
        activo: true,
      },
      {
        nombre: 'Funda iPhone 15 Pro Silicona',
        descripcion:
          'Funda original de silicona compatible con MagSafe. Protección premium, tacto suave, disponible en varios colores.',
        precio: 49.99,
        precioOferta: null,
        stock: 30,
        categoria: 'Accesorios',
        imagenUrl: 'https://example.com/funda.jpg',
        activo: true,
      },
    ],
  });

  console.log(`✅ ${productos.count} productos creados`);

  // Crear cliente de ejemplo
  const cliente = await prisma.customer.create({
    data: {
      telefono: '5491112345678',
      nombre: 'Juan García',
      email: 'juan@example.com',
      etiquetas: ['interesado_iphone', 'cliente_potencial'],
      notas: 'Interesado en iPhone 15. Tiene presupuesto de $1200.',
    },
  });

  console.log(`✅ Cliente de ejemplo creado: ${cliente.nombre}`);

  // Crear pipeline para el cliente de ejemplo
  await prisma.salesPipeline.create({
    data: {
      customerId: cliente.id,
      etapa: 'INTERESADO',
    },
  });

  console.log('✅ Pipeline de ejemplo creado');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Resumen:');
  console.log(`   - Bot configurado: Sofía de TechStore Argentina`);
  console.log(`   - Productos creados: ${productos.count}`);
  console.log(`   - Clientes de ejemplo: 1`);
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
