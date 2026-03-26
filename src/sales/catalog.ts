// Gestión del catálogo de productos
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { formatearMoneda } from '../utils/helpers';
import type { Product } from '@prisma/client';

// Obtener todos los productos activos
export async function obtenerProductosActivos(): Promise<Product[]> {
  try {
    return await prisma.product.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' },
    });
  } catch (error) {
    logger.error('Error al obtener productos:', error);
    return [];
  }
}

// Obtener producto por ID
export async function obtenerProductoPorId(id: string): Promise<Product | null> {
  try {
    return await prisma.product.findUnique({ where: { id } });
  } catch (error) {
    logger.error(`Error al obtener producto ${id}:`, error);
    return null;
  }
}

// Formatear catálogo como texto para el prompt de IA
export async function formatearCatalogoParaIA(): Promise<string> {
  try {
    const productos = await obtenerProductosActivos();

    if (productos.length === 0) {
      return 'No hay productos disponibles en este momento.';
    }

    const categorias = new Map<string, Product[]>();

    for (const producto of productos) {
      const cat = producto.categoria || 'General';
      if (!categorias.has(cat)) {
        categorias.set(cat, []);
      }
      categorias.get(cat)!.push(producto);
    }

    const lineas: string[] = [];

    for (const [categoria, prods] of categorias) {
      lineas.push(`\n📦 ${categoria.toUpperCase()}:`);
      for (const prod of prods) {
        const precioBase = Number(prod.precio);
        const precioOferta = prod.precioOferta ? Number(prod.precioOferta) : null;

        let lineaPrecio = formatearMoneda(precioBase);
        if (precioOferta && precioOferta < precioBase) {
          lineaPrecio = `~~${lineaPrecio}~~ → ${formatearMoneda(precioOferta)} 🔥 OFERTA`;
        }

        const stockInfo = prod.stock <= 5 && prod.stock > 0
          ? ` (⚠️ Solo quedan ${prod.stock}!)`
          : prod.stock === 0
          ? ' (❌ Sin stock)'
          : '';

        lineas.push(`  • ${prod.nombre} - ${lineaPrecio}${stockInfo}`);
        lineas.push(`    ${prod.descripcion}`);
      }
    }

    return lineas.join('\n');
  } catch (error) {
    logger.error('Error al formatear catálogo:', error);
    return 'Error al cargar el catálogo.';
  }
}

// Obtener productos con poco stock (para crear urgencia)
export async function obtenerProductosPocaStock(limite = 5): Promise<Product[]> {
  try {
    return await prisma.product.findMany({
      where: {
        activo: true,
        stock: { gt: 0, lte: limite },
      },
      orderBy: { stock: 'asc' },
    });
  } catch (error) {
    logger.error('Error al obtener productos con poco stock:', error);
    return [];
  }
}

// Obtener productos en oferta
export async function obtenerProductosEnOferta(): Promise<Product[]> {
  try {
    return await prisma.product.findMany({
      where: {
        activo: true,
        precioOferta: { not: null },
      },
    });
  } catch (error) {
    logger.error('Error al obtener productos en oferta:', error);
    return [];
  }
}

// Actualizar stock de un producto
export async function actualizarStock(productId: string, cantidad: number): Promise<void> {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: cantidad } },
    });
    logger.info(`Stock actualizado para producto ${productId}: -${cantidad}`);
  } catch (error) {
    logger.error(`Error al actualizar stock del producto ${productId}:`, error);
  }
}

// Crear producto
export async function crearProducto(datos: {
  nombre: string;
  descripcion: string;
  precio: number;
  precioOferta?: number;
  stock: number;
  imagenUrl?: string;
  categoria?: string;
}): Promise<Product> {
  return await prisma.product.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio: datos.precio,
      precioOferta: datos.precioOferta,
      stock: datos.stock,
      imagenUrl: datos.imagenUrl,
      categoria: datos.categoria,
    },
  });
}
