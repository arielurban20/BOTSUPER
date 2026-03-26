# 🤖 BOTSUPER - Super Bot de Ventas para WhatsApp

> **Bot de ventas inteligente con IA para WhatsApp Business** — Parece una persona real, nunca se rinde y siempre busca cerrar la venta. Conectado a PostgreSQL en Railway.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Railway](https://img.shields.io/badge/Deploy-Railway-purple)](https://railway.app)
[![OpenAI](https://img.shields.io/badge/IA-OpenAI%20GPT--4-green)](https://openai.com)

---

## 📋 Descripción

**BOTSUPER** es un bot de ventas ultra-persuasivo para WhatsApp que:

- 🧠 **Parece una persona real** — Powered by OpenAI GPT-4, tiene nombre, personalidad y responde de forma natural
- 💪 **Nunca se rinde** — Sistema de seguimiento automático con 6 niveles si el cliente no responde
- 🎯 **Cierra ventas** — Usa técnicas probadas: urgencia, escasez, prueba social, bonos
- 🔥 **Maneja objeciones** — Responde inteligentemente a "es muy caro", "lo pienso", "no me interesa"
- 🗄️ **Base de datos completa** — PostgreSQL en Railway con historial, pipeline, pedidos y más
- 📱 **WhatsApp Business API oficial** — Usa la API de Meta (100% oficial)

---

## ✨ Características Principales

### 🧠 Cerebro de IA
- Respuestas generadas con **OpenAI GPT-4o-mini** (o GPT-4o)
- **Nunca dice que es un bot** — Si le preguntan, responde como persona
- Se adapta al tono del cliente (formal/informal)
- Recuerda el contexto completo de la conversación (hasta 20 mensajes)
- Detecta automáticamente el nombre del cliente en el chat

### 🎯 Pipeline de Ventas (7 Etapas)
```
NUEVO → INTERESADO → NEGOCIANDO → OBJECION → CIERRE → VENDIDO → PERDIDO
```
- Transiciones automáticas basadas en análisis de IA
- Estadísticas en tiempo real por etapa

### 💬 Manejo de Objeciones Inteligente
| Objeción | Respuesta del Bot |
|----------|-------------------|
| "Es muy caro" | Ofrece cuotas, muestra el valor, descuento especial |
| "Lo voy a pensar" | Crea urgencia, ofrece bonus por decidir hoy |
| "No me interesa" | Pregunta qué busca, ofrece alternativas |
| "Ya tengo uno" | Muestra ventajas superiores, pregunta si está satisfecho |
| "No tengo dinero" | Opciones de financiamiento, versión económica |
| "Después te escribo" | Crea urgencia, ofrece reservar precio |
| "No confío" | Garantías, testimonios, tranquiliza |

### ⏰ Sistema de Seguimiento Automático (6 Niveles)
| Nivel | Tiempo | Tipo de mensaje |
|-------|--------|----------------|
| 1️⃣ | 30 minutos | Mensaje casual de re-engagement |
| 2️⃣ | 4 horas | Testimonio de cliente satisfecho |
| 3️⃣ | 24 horas | Oferta especial por tiempo limitado |
| 4️⃣ | 48 horas | Aviso de poco stock |
| 5️⃣ | 72 horas | Último intento con mejor oferta |
| 6️⃣ | 1 semana | Reconexión suave |

### 🏆 Técnicas de Cierre Automáticas
1. **Escasez** → "Solo quedan 3 unidades"
2. **Urgencia** → "Esta oferta es solo por hoy"
3. **Alternativo** → "¿Plan básico o premium?"
4. **Resumen** → Resume beneficios y pregunta "¿Procedemos?"
5. **Testimonio** → Caso de éxito de otro cliente
6. **Bonus** → "Si comprás ahora te incluyo envío gratis"

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|-----------|-----|
| **Node.js 18+ / TypeScript** | Backend del servidor |
| **Express.js** | Servidor HTTP y webhook |
| **PostgreSQL** | Base de datos (Railway) |
| **Prisma ORM** | Manejo de base de datos |
| **OpenAI GPT** | Inteligencia artificial |
| **WhatsApp Business API** | Mensajería oficial de Meta |
| **node-cron** | Seguimientos automáticos |
| **Winston** | Logging profesional |
| **Docker Compose** | Desarrollo local |

---

## 📦 Requisitos Previos

Antes de instalar, necesitás tener:

1. **Node.js 18+** — [Descargar aquí](https://nodejs.org)
2. **Cuenta de Meta Developer** con WhatsApp Business API configurada
3. **Cuenta de Railway** — [railway.app](https://railway.app)
4. **API Key de OpenAI** — [platform.openai.com](https://platform.openai.com)
5. **Git** instalado

---

## 🚀 Instalación Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/arielurban20/BOTSUPER.git
cd BOTSUPER
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Abre el archivo `.env` y completa todos los valores (ver sección [Configuración](#-configuración)).

### 4. Configurar la base de datos

```bash
# Aplicar el schema a tu base de datos PostgreSQL
npm run prisma:push

# Generar el cliente de Prisma
npm run prisma:generate

# Cargar datos de ejemplo (productos, configuración del bot)
npm run prisma:seed
```

### 5. Compilar TypeScript

```bash
npm run build
```

### 6. Iniciar el servidor

```bash
# Producción
npm start

# Desarrollo (con hot reload)
npm run dev
```

---

## ⚙️ Configuración

### 📱 Configuración de WhatsApp Business API (Meta)

#### Paso 1: Crear App en Meta Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Clic en **"Mis apps"** → **"Crear app"**
3. Seleccionar **"Negocios"** como tipo
4. Completar el nombre de la app

#### Paso 2: Agregar WhatsApp

1. En el panel de tu app, busca **"WhatsApp"** y clic en **"Configurar"**
2. Completa la información de tu cuenta de negocios

#### Paso 3: Obtener credenciales

En **WhatsApp > Configuración de la API**:

- **Token de acceso temporal**: Cópialo → `WHATSAPP_TOKEN`
- **ID del número de teléfono**: Cópialo → `WHATSAPP_PHONE_ID`

> ⚠️ Para producción, necesitarás generar un **Token de acceso permanente** desde la sección de Configuración del Sistema.

#### Paso 4: Configurar el Webhook

1. Ve a **WhatsApp > Configuración**
2. En la sección **Webhook**, clic en **"Editar"**
3. Completa:
   - **URL de callback**: `https://tu-dominio.railway.app/webhook`
   - **Token de verificación**: El mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`
4. Suscribirse al campo: `messages`

### 🗄️ Configuración de Railway PostgreSQL

#### Paso 1: Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Clic en **"New Project"**
3. Seleccionar **"Provision PostgreSQL"**

#### Paso 2: Obtener la URL de conexión

1. Clic en tu base de datos PostgreSQL
2. Ve a la pestaña **"Connect"**
3. Copia la **"Postgres Connection URL"**
4. Pégala en tu `.env` como `DATABASE_URL`

El formato es: `postgresql://postgres:PASSWORD@roundhouse.proxy.rlwy.net:PORT/railway`

#### Paso 3: Aplicar el schema

```bash
npm run prisma:push
```

### 🤖 Configuración de OpenAI

1. Ve a [platform.openai.com](https://platform.openai.com)
2. **API Keys** → **"Create new secret key"**
3. Copia la key y pégala en `OPENAI_API_KEY`

> 💡 **Recomendación**: Usa `gpt-4o-mini` para empezar (más barato) y `gpt-4o` para mejor calidad.

---

## 🚂 Despliegue en Railway

### Opción 1: Desde GitHub (Recomendada)

1. En Railway, clic en **"New Project"** → **"Deploy from GitHub repo"**
2. Conecta tu cuenta de GitHub y selecciona `BOTSUPER`
3. Railway detectará automáticamente que es Node.js
4. En **"Variables"**, agrega todas las variables de tu `.env`
5. En **"Settings"** → **"Start Command"**: `npm start`

### Opción 2: Con Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up

# Agregar variables de entorno
railway variables set WHATSAPP_TOKEN=xxx
railway variables set DATABASE_URL=xxx
# ... agregar todas las variables
```

### Configuración post-deploy

1. En Railway, ve a tu servicio → **"Settings"** → **"Domains"**
2. Genera un dominio público (algo como `botsuper.railway.app`)
3. Actualiza el webhook en Meta con esta URL: `https://botsuper.railway.app/webhook`

---

## 🎨 Personalización del Bot

### Cambiar nombre y personalidad

Edita las variables de entorno:

```env
BOT_NAME=Carlos          # Nombre del bot
BUSINESS_NAME=Tu Tienda  # Tu negocio
BOT_PERSONALITY=amigable, directo, experto en tecnología
```

### Cambiar productos del catálogo

Puedes agregar productos directamente en la base de datos usando Prisma Studio:

```bash
npm run prisma:studio
```

O modificando el archivo `prisma/seed.ts` con tus productos.

### Ajustar horarios de atención

```env
HORARIO_INICIO=9   # 9:00 AM
HORARIO_FIN=18     # 6:00 PM
```

### Modificar prompts de la IA

Edita `src/ai/prompts.ts` para personalizar la personalidad del bot, las técnicas de venta y los mensajes de seguimiento.

### Agregar respuestas de objeciones

Edita `src/ai/objections.ts` → `RESPUESTAS_OBJECION` para agregar tus propias respuestas.

---

## 📊 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Inicia con hot reload

# Producción
npm run build            # Compila TypeScript
npm start                # Inicia el servidor

# Base de datos
npm run prisma:generate  # Genera cliente Prisma
npm run prisma:push      # Aplica schema a la DB
npm run prisma:migrate   # Ejecuta migraciones
npm run prisma:studio    # Panel visual de la DB
npm run prisma:seed      # Carga datos de ejemplo

# Calidad de código
npm run typecheck        # Verifica tipos TypeScript
npm run lint             # Linter de código
```

---

## 🏗️ Estructura del Proyecto

```
BOTSUPER/
├── prisma/
│   ├── schema.prisma          # Esquema BD (8 tablas)
│   └── seed.ts                # Datos de ejemplo
│
├── src/
│   ├── index.ts               # Servidor Express principal
│   │
│   ├── config/
│   │   └── env.ts             # Variables de entorno validadas
│   │
│   ├── database/
│   │   └── prisma.ts          # Cliente Prisma singleton
│   │
│   ├── whatsapp/
│   │   ├── webhook.ts         # Endpoints GET/POST del webhook
│   │   ├── sender.ts          # Envío de mensajes (texto, botones, imágenes)
│   │   └── messageProcessor.ts # Procesamiento de mensajes entrantes
│   │
│   ├── ai/
│   │   ├── brain.ts           # Cerebro IA - genera respuestas con OpenAI
│   │   ├── prompts.ts         # System prompts vendedor ultra-persuasivo
│   │   └── objections.ts      # Detección y manejo de objeciones
│   │
│   ├── sales/
│   │   ├── pipeline.ts        # Pipeline de ventas (7 estados)
│   │   ├── followup.ts        # Seguimientos automáticos (6 niveles + cron)
│   │   ├── closer.ts          # Técnicas de cierre automáticas
│   │   └── catalog.ts         # Gestión del catálogo de productos
│   │
│   ├── services/
│   │   ├── customer.ts        # Gestión de clientes
│   │   ├── conversation.ts    # Historial de conversaciones
│   │   └── order.ts           # Pedidos y estadísticas de ventas
│   │
│   └── utils/
│       ├── logger.ts          # Logger con Winston
│       └── helpers.ts         # Funciones auxiliares
│
├── .env.example               # Template de variables de entorno
├── docker-compose.yml         # PostgreSQL local para desarrollo
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗄️ Esquema de Base de Datos

### Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `customers` | Clientes con teléfono, nombre, email, notas, etiquetas |
| `conversations` | Historial completo de todos los mensajes |
| `products` | Catálogo de productos con precios, stock, imágenes |
| `orders` | Pedidos con estado, total, notas |
| `order_items` | Items individuales de cada pedido |
| `sales_pipeline` | Estado actual de cada cliente en el funnel |
| `follow_ups` | Seguimientos programados y ejecutados |
| `bot_config` | Configuración del bot (nombre, horarios, mensajes) |

---

## 📈 Estadísticas y Monitoreo

El bot expone endpoints para monitoreo:

```bash
# Estado del servidor
GET https://tu-bot.railway.app/health

# Estadísticas completas
GET https://tu-bot.railway.app/estadisticas
```

Respuesta de estadísticas:
```json
{
  "ventas": {
    "totalVentas": 47,
    "ventasHoy": 3,
    "ingresosTotal": 58450.00,
    "ingresosHoy": 1299.99
  },
  "clientes": {
    "total": 234,
    "nuevosHoy": 12,
    "activosEstaSemana": 89
  },
  "pipeline": {
    "NUEVO": 45,
    "INTERESADO": 67,
    "NEGOCIANDO": 23,
    "OBJECION": 12,
    "CIERRE": 8,
    "VENDIDO": 47,
    "PERDIDO": 32
  }
}
```

---

## 🔧 Desarrollo Local con Docker

Para desarrollar localmente sin necesitar Railway:

```bash
# Iniciar PostgreSQL local
docker-compose up -d

# Configurar .env para local
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/botsuper

# Aplicar schema
npm run prisma:push

# Cargar datos de ejemplo
npm run prisma:seed

# Iniciar en modo desarrollo
npm run dev
```

Para exponer el webhook al público (necesario para Meta) usa **ngrok**:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto local
ngrok http 3000

# Usar la URL https de ngrok en Meta Developers
# Ejemplo: https://abc123.ngrok.io/webhook
```

---

## 🐛 Troubleshooting (Solución de Problemas)

### El webhook no se verifica

**Causa**: El `WHATSAPP_VERIFY_TOKEN` no coincide o la URL es incorrecta.

**Solución**:
1. Verifica que `WHATSAPP_VERIFY_TOKEN` sea idéntico en Meta y en tu `.env`
2. Asegúrate de que tu servidor esté accesible públicamente
3. La URL debe ser exactamente: `https://tu-dominio/webhook`

### El bot no responde mensajes

**Causa**: Puede ser un problema con el token de WhatsApp o con OpenAI.

**Solución**:
1. Verifica los logs: `railway logs` o `npm run dev` para ver errores
2. Confirma que `WHATSAPP_TOKEN` esté vigente (los tokens temporales expiran)
3. Verifica que `OPENAI_API_KEY` tenga créditos disponibles

### Error de base de datos

**Causa**: La `DATABASE_URL` es incorrecta o la DB no está disponible.

**Solución**:
1. Verifica la URL en Railway > PostgreSQL > Connect
2. Asegúrate de haber ejecutado `npm run prisma:push`
3. Prueba la conexión con `npm run prisma:studio`

### Los seguimientos no se envían

**Causa**: El servidor puede estar fuera del horario configurado o el cron no está corriendo.

**Solución**:
1. Verifica `HORARIO_INICIO` y `HORARIO_FIN` en `.env`
2. Confirma que el servidor está corriendo (no en Railway Free que se duerme)
3. Revisa la tabla `follow_ups` en Prisma Studio para ver si hay pendientes

### Error de TypeScript al compilar

```bash
npm run typecheck
```

Busca los errores y corrígelos. Los más comunes son tipos faltantes o imports incorrectos.

---

## 🔐 Seguridad

- **Tokens**: Nunca commitees el `.env` al repositorio (ya está en `.gitignore`)
- **Webhook**: Meta envía un header `X-Hub-Signature-256` — implementa verificación en producción
- **Rate Limiting**: La API de WhatsApp tiene límites — el bot los respeta automáticamente
- **Logs**: Los logs se guardan en `/logs` — nunca incluyen información sensible

---

## 📞 Soporte y Contribuciones

¿Encontraste un bug o querés agregar una funcionalidad? Abrí un issue o pull request en:
[github.com/arielurban20/BOTSUPER](https://github.com/arielurban20/BOTSUPER)

---

## 📄 Licencia

MIT License — Libre para uso personal y comercial.

---

<div align="center">

**Hecho con 💪 para vender más y mejor**

*¿Listo para que tu bot venda las 24 horas? ¡Let's go!* 🚀

</div>
