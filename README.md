# Agroecotopia — Marketplace Agroecológico

Plataforma de comercio electrónico B2C y B2B enfocada en productos agroecológicos colombianos. Construida con Next.js 16, PostgreSQL, Redis y Socket.IO, desplegada en Render con conectividad privada entre servicios.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.1 |
| **Lenguaje** | TypeScript (strict mode) | ~5.x |
| **UI** | React + Tailwind CSS v4 + Framer Motion | 19.2.4 / 4 / 12.38 |
| **Componentes Base** | shadcn/ui + Radix UI Primitives + Lucide Icons | — |
| **Base de Datos** | PostgreSQL (Supabase) + Prisma ORM | 6.19.2 |
| **Autenticación** | NextAuth.js v5 (JWT) + Google OAuth + Credentials | 5.0.0-beta.30 |
| **Tiempo Real** | Socket.IO (monolítico, mismo puerto HTTP) | 4.8.3 |
| **Caché Distribuido** | Redis via ioredis (graceful fallback) | 5.11.1 |
| **Pagos** | MercadoPago SDK | 2.12.1 |
| **Validación** | Zod + react-hook-form | 4.3.6 / 7.72 |
| **State (Cliente)** | TanStack React Query (async) + Context API (sync) | 5.95.2 |
| **Encriptación Chat** | TweetNaCl (Curve25519 + XSalsa20-Poly1305) | 1.0.3 |
| **Server Runtime** | tsx (servidor custom) | 4.22.3 |
| **Rate Limiting** | rate-limiter-flexible (in-memory) | 11.1.0 |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Cliente (Browser)                          │
│  React 19 + Tailwind v4 + Framer Motion + TanStack Query            │
└───────────────────┬─────────────────────────────────────────────────┘
                    │ HTTP / WebSocket
┌──────────────────▼─────────────────────────────────────────────────┐
│                  Custom Server (server.ts)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Next.js 16 Request Handler (App Router)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │   │
│  │  │  Pages   │ │ API Rut.│ │ S. Actions│ │ Middleware      │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Socket.IO Server (mismo proceso, mismo puerto)               │   │
│  │  → Chat en tiempo real + Notificaciones push                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Rate Limiter Middleware (global 200/min + auth 5/min)        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────────────────┘
                    │
┌──────────────────▼─────────────────────────────────────────────────┐
│                    Backend Modular (src/backend/)                    │
│                                                                      │
│  ┌─────────┐ ┌──────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌──────────┐  │
│  │  Auth   │ │ Chat │ │ Forum │ │Orders│ │Product │ │ Store    │  │
│  │ Actions │ │Actns │ │ Actns │ │Actns │ │ Actns  │ │ Actns    │  │
│  │ Service │ │Svc   │ │ Svc   │ │Svc   │ │ Svc    │ │ Svc      │  │
│  │         │ │Repo  │ │ Repo  │ │Repo  │ │ Repo   │ │ Repo     │  │
│  └─────────┘ └──────┘ └───────┘ └──────┘ └───┬────┘ └──────────┘  │
│                                                │                    │
│                          ┌─────────────────────▼──────────┐         │
│                          │   Cache Layer (Redis)           │         │
│                          │   CacheService + key-builder    │         │
│                          │   Graceful fallback si no Redis │         │
│                          └─────────────────────┬──────────┘         │
│                                                │                    │
│                          ┌─────────────────────▼──────────┐         │
│                          │   Prisma ORM (Source of Truth) │         │
│                          │   PostgreSQL (Supabase)        │         │
│                          └────────────────────────────────┘         │
└───────────────────┬─────────────────────────────────────────────────┘
                    │
┌──────────────────▼─────────────────────────────────────────────────┐
│  Infraestructura Externa                                            │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │ Supabase  │  │ Redis      │  │ Google OAuth│  │ MercadoPago │ │
│  │ PostgreSQL│  │ (Render)   │  │             │  │             │ │
│  └───────────┘  └────────────┘  └────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Capas del Backend

```
┌──────────────────────────────────────────────┐
│  UI   │  Pages y Componentes React           │
├───────┼──────────────────────────────────────┤
│  CTRL │  Server Actions (".actions.ts")      │  → Capa de transporte
├───────┼──────────────────────────────────────┤
│  SVC  │  Lógica de negocio (".service.ts")   │  → No sabe de HTTP/Next
├───────┼──────────────────────────────────────┤
│ REPO  │  Acceso a datos (".repository.ts")   │  → Prisma + Cache
├───────┼──────────────────────────────────────┤
│ CACHE │  Redis distribuido (CacheService)    │  → Fallback silencioso
├───────┼──────────────────────────────────────┤
│  DB   │  Prisma ORM → PostgreSQL             │  → Source of Truth
└───────┴──────────────────────────────────────┘
```

**Reglas de dependencia (estrictas):**
- `UI → CTRL → SVC → REPO → CACHE → DB`
- Un componente/página NUNCA importa Prisma, repositorios o servicios directamente.
- Los Server Actions son la única puerta de entrada al backend desde UI.
- Los Servicios no saben que existe caché. Solo los Repositorios usan `CacheService`.
- `CacheService` solo se inyecta en constructores de Repositorios.

---

## Estructura del Proyecto

```
src/
├── app/                              # Next.js App Router
│   ├── (routes)/                     # /productos, /checkout, /login, /comunidad, etc.
│   ├── admin/                        # /admin/dashboard, /admin/chat
│   ├── api/                          # API Route Handlers
│   │   ├── v1/auth/[...nextauth]     # NextAuth.js
│   │   ├── webhooks/mercadopago      # Webhook MP
│   │   ├── place-order               # Crear pedido
│   │   ├── calculate-shipping        # Calcular envío
│   │   ├── calculate-taxes           # Calcular impuestos
│   │   └── chat/e2ee/                # Endpoints E2EE
│   ├── Providers.tsx                 # Árbol de providers global
│   └── loading.tsx                   # Loading state global
│
├── backend/                          # Backend encapsulado
│   ├── cache/                        # Sistema de caché Redis
│   │   ├── client.ts                 # Cliente Redis singleton + health check
│   │   ├── cache.service.ts          # CacheService (getOrSet, delPattern)
│   │   ├── key-builder.ts            # Constructor de keys con hash
│   │   └── types.ts                  # Tipos compartidos
│   ├── db/
│   │   └── prisma.ts                 # Singleton PrismaClient (globalThis)
│   ├── modules/                      # 12 módulos de dominio
│   │   ├── auth/                     # Autenticación
│   │   ├── chat/                     # Chat + Socket.IO + E2EE
│   │   ├── forum/                    # Foro comunitario
│   │   ├── notifications/            # Sistema de notificaciones event-driven
│   │   ├── orders/                   # Pedidos + máquina de estados
│   │   ├── payments/                 # MercadoPago
│   │   ├── product/                  # Productos (con caché Redis)
│   │   ├── promotion/                # Promociones y descuentos
│   │   ├── shipping/                 # Zonas y tarifas de envío
│   │   ├── stats/                    # Estadísticas del home
│   │   ├── store/                    # Tiendas + solicitudes + impuestos
│   │   └── user/                     # Usuarios (repositorio base)
│   ├── middlewares/                  # Middleware HTTP
│   └── prisma/schema/                # 12 archivos .prisma (multi-schema)
│
├── frontend/                         # Frontend encapsulado
│   ├── components/                   # 69+ componentes UI
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── auth/, chat/, checkout/,  # Feature components
│   │   ├── home/sections/            # Landing page (WelcomeStage, ProductsStage, etc.)
│   │   ├── shared/productos/         # ProductCard, ProductModal
│   │   ├── seller/                   # Panel de vendedor
│   │   ├── notifications/           # Campana de notificaciones
│   │   └── admin/store/             # Admin panel de tiendas
│   ├── context/                      # 4 React Contexts
│   │   ├── SocketContext.tsx         # Conexión Socket.IO
│   │   ├── CartContext.tsx           # Carrito (localStorage)
│   │   ├── LanguageContext.tsx       # i18n ES/EN
│   │   └── NotificationContext.tsx   # Notificaciones + Socket
│   ├── hooks/                        # 6 custom hooks
│   │   ├── useProductsLogic.ts      # CRUD + filtros + paginación
│   │   ├── useNotifications.ts      # Wrapper NotificationContext
│   │   ├── useSocketRefresh.ts      # Refresco event-driven (Zero Polling)
│   │   ├── useDebounce.ts           # Debounce genérico
│   │   ├── use-toast.ts             # Sistema de toasts
│   │   └── use-mobile.tsx           # Detección mobile
│   └── styles/globals.css           # Tailwind v4 + tema OKLCH
│
├── config/
│   └── config.ts                     # Config centralizada (env vars tipadas)
├── lib/
│   ├── auth-guards.ts               # 5 HOCs RBAC (withAuth, withAdmin, etc.)
│   ├── admin-init.ts                # Bootstrap admin + tienda default
│   ├── rate-limit.ts                # Rate limiters singleton
│   ├── validations/                 # Schemas Zod (auth, checkout)
│   └── utils.ts                     # cn(), formatPrice()
├── types/                           # Tipos TypeScript centralizados
└── utils/
    ├── auth.ts                      # Config NextAuth.js
    ├── eventBus.ts                  # EventEmitter singleton
    ├── logger.ts                    # Logger con colores + captura automática de caller
    ├── promotions.ts               # Cálculo de descuentos
    ├── ratingSystem.ts             # Rating bayesiano para foro
    └── PaymentsMethods/            # 5 handlers de pago (Factory Pattern)
        ├── advisor/, nequi/, mercadopago/, pse/, wompi/
        ├── factory.ts              # PaymentHandlerFactory
        └── types.ts                # Tipos centralizados de pagos
```

---

## Módulos del Backend (12 Dominios)

### 1. Auth — Autenticación y Autorización
- **Providers:** Google OAuth (PKCE) + Credentials (email/password con bcrypt)
- **Estrategia:** JWT stateless (sin sesiones en DB)
- **Roles:** `admin`, `seller`, `user`
- **Guards RBAC:** `withAuth`, `withAdmin`, `withSeller`, `withAdminOrSeller`, `withStoreOwner(storeId)` — Higher-Order Functions que envuelven Server Actions
- **Flujo:** Login/Register → Zod validation → Rate limiting (5/min) → NextAuth callback → JWT con id + role

### 2. Chat — Mensajería en Tiempo Real
- **Arquitectura:** Socket.IO en el mismo proceso HTTP (monolítico)
- **Tipos de conversación:** `SUPPORT` (1:1 con admin), `ORDER` (por pedido entre comprador-vendedor)
- **E2EE Opcional:** Signal Protocol (Curve25519 + XSalsa20-Poly1305 via TweetNaCl). Auto-healing con escrow de claves privadas en DB.
- **Rate limiting:** 2 mensajes/segundo por socket
- **Eventos:** `join_room`, `send_message`, `receive_message`, `typing`, `delete_conversation`

### 3. Forum — Foro Comunitario
- Posts con labels, respuestas anidadas (parentId), votación (upvote/downvote)
- Búsqueda full-text PostgreSQL + filtro por labels
- Ordenamiento: newest / popular (rating total)
- Top contributors vía raw SQL (puntos = posts×10 + answers×5)
- Caché in-memory: trending labels (5 min), community stats (5 min)
- Notificaciones automáticas a admins (nuevo post) y usuarios relevantes (nuevas respuestas)

### 4. Notifications — Sistema Event-Driven
- **Pipeline:** `DomainEvent` (audit log) → `Notification` (lógica) → `NotificationRecipient` (delivery)
- **3 tipos de audiencia:** `INDIVIDUAL` (usuario específico), `GROUP` (grupo de usuarios), `BROADCAST` (todos)
- **Lazy Materialization para BROADCAST:** $O(1)$ sin importar el número de usuarios — los destinatarios se crean bajo demanda al leer
- **Bridge Socket.IO:** `notificationsService` emite eventos via `eventBus` → `socketHandler.ts` los reenvía al canal privado del usuario (`user:{userId}:notifications`)
- **Purge:** limpieza programada de notificaciones leídas antiguas
- **Interacción:** `actionUrl` en metadata permite navegación directa desde la notificación

### 5. Orders — Pedidos
- **Cada tienda recibe su propio pedido** (un checkout puede generar N pedidos, uno por tienda)
- **Máquina de estados:** `PENDIENTE → CONFIRMADO → EN_PREPARACION → EN_CAMINO → ENTREGADO`. También `→ CANCELADO` desde PENDIENTE o CONFIRMADO.
- **Optimistic Locking:** las transiciones de estado usan `updateMany` con `WHERE estado = ${estadoActual}` para prevenir race conditions
- **Stock:** se descuenta al confirmar, se revierte al cancelar (solo si fue descontado)
- **Notificaciones:** al crear pedido (notifica al vendedor), al cambiar estado (notifica al comprador)

### 6. Payments — MercadoPago
- **Creación de preferencia:** ítems, payer, back_urls, webhook URL
- **Webhook con HMAC-SHA256:** verificación de firma antes de procesar
- **Transiciones:** `approved` → CONFIRMADO, `rejected/cancelled` → CANCELADO

### 7. Product — Productos (con Caché Redis)
- **Único módulo con caché distribuida actualmente**
- **Cache-Aside Pattern:** `getOrSet(key, fetcher, ttl)` — si Redis disponible, cachea; si no, consulta DB directamente
- **TTLs:** listas 60s, detalle 120s, categorías 300s, búsquedas 60s
- **Invalidación:** cada mutación (create/update/delete) invalida todo `cache:product:*`
- **Catálogo:** paginado, filtrable por categorías y tienda
- **Búsqueda:** multi-campo (nombre, descripción, tag, tienda, categoría) con case-insensitive contains
- **Serialización:** Prisma Decimal → Number para el cliente

### 8. Promotion — Promociones
- **Scopes:** `ENTIRE_STORE`, `SPECIFIC_PRODUCTS`, `SINGLE_PRODUCT`
- **Tipos:** `PERCENTAGE` (1-100%), `FIXED_AMOUNT`
- **Validación:** fecha de expiración futura, requiere productos para scopes específicos
- **Cálculo de descuento:** utility centralizada en `src/utils/promotions.ts`

### 9. Shipping — Envíos
- **Zonas de envío** por tienda con lista de ciudades
- **Tarifas:** `TARIFA_FIJA` (plana) o `POR_PESO` (con precio por kg extra)
- **Umbral de envío gratis** configurable por tienda
- **Cálculo:** agrupa carrito por tienda, busca zona por ciudad destino, aplica tarifa

### 10. Stats — Estadísticas
- Consultas simples de conteo para el home: usuarios, posts del foro, productos

### 11. Store — Tiendas
- **Flujo de solicitud:** Usuario solicita → Admin revisa y aprueba/rechaza → Slug automático → Usuario promovido a seller → Tienda creada
- **Slug:** URL-friendly desde el nombre, con contador para duplicados
- **Transacción atómica:** crear tienda + actualizar solicitud + promover rol (opcional)
- **Impuestos:** tasas porcentuales por tienda, usadas en el cálculo de pedidos
- **Rate limiting:** una solicitud pendiente por usuario

### 12. User — Usuarios (Repositorio Base)
- Métodos CRUD básicos usados por AuthService

---

## Sistema de Caché Distribuido (Redis)

### Arquitectura

```
┌──────────┐    getOrSet(key, fetcher, ttl)
│ Service  │    ──────────────────────────────►  ┌──────────────┐
│ (no sabe │                                       │ Repository   │
│  de cache│    ◄────────────── data ──────────── │ (inyecta     │
└──────────┘                                       │  CacheService)│
                                                   └──────┬───────┘
                                              ┌───────────┼───────────┐
                                              │           │           │
                                         Redis OK    Cache Miss   Redis Down
                                              │           │           │
                                          ┌──▼───┐   ┌──▼───┐   ┌──▼───┐
                                          │ Redis│   │ DB   │   │ DB   │
                                          │      │   │(fetch)│   │(fetch)│
                                          └──────┘   └──┬───┘   └──────┘
                                                        │
                                                    ┌──▼───┐
                                                    │ Redis│
                                                    │(set) │
                                                    └──────┘
```

### Graceful Degradation

El sistema está diseñado para que la aplicación funcione **sin Redis**:

| Escenario | Log | Comportamiento |
|-----------|-----|----------------|
| Redis no configurado | `REDIS_URL no configurada. Caché deshabilitado.` | App funciona, sin caché |
| Redis se cae en runtime | `Redis: error de conexión: ...` | App sigue funcionando, caché se desactiva |
| Redis reconecta | `Redis conectado exitosamente.` | Caché se reactiva automáticamente |
| Cache HIT | `Cache HIT: cache:product:id:prod_001` | Data desde Redis (rápido) |
| Cache MISS | — | Data desde PostgreSQL, se guarda en Redis |

### Cómo agregar caché a un nuevo módulo

```typescript
// 1. Agregar keys en key-builder.ts
export const CacheKeys = {
  orders: {
    byId: (id: string) => `cache:orders:id:${id}`,
    allPattern: `cache:orders:*`,
  },
};

// 2. Configurar TTL en config.ts
ttl: { orderDetail: 120 }

// 3. Inyectar en el Repository
constructor(private cacheService?: CacheService) {}

// 4. Cachear métodos READ
async getOrderById(id: string) {
  return this.cacheService?.getOrSet(
    CacheKeys.orders.byId(id),
    () => prisma.pedido.findUnique({ where: { id } }),
    config.cache.ttl.orderDetail,
  ) ?? null;
}

// 5. Invalidar en métodos WRITE
async updateOrder(id, data) {
  const result = await prisma.pedido.update({ where: { id }, data });
  await this.cacheService?.delPattern(CacheKeys.orders.allPattern);
  return result;
}

// 6. Actualizar IoC (index.ts)
const cacheService = new CacheService();
export const orderRepository = new OrderRepository(cacheService);
```

---

## Sistema de Notificaciones (Event-Driven)

```
┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│ Server Action│────►│ dispatchNoti-│────►│ AudienceResolver  │
│ (orders,     │     │ fication()   │     │ (Strategy Pattern)│
│  forum, etc) │     └──────┬───────┘     └─────────┬─────────┘
└──────────────┘            │                        │
                            │                        ▼
                            │              ┌──────────────────┐
                            │              │ Materializar     │
                            │              │ Recipients en DB │
                            │              └────────┬─────────┘
                            │                        │
                            ▼                        ▼
                     ┌──────────────┐      ┌──────────────────┐
                     │ eventBus     │──────│ Socket.IO        │
                     │ (EventEmitter)│     │ (io.emit a room) │
                     └──────────────┘      └──────────────────┘
```

- **INDIVIDUAL y GROUP:** se crean registros físicos en `NotificationRecipient` inmediatamente
- **BROADCAST:** $O(1)$ — no crea recipients hasta que el usuario lee la notificación (lazy materialization)

---

## Patrones de Diseño Implementados

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| **Layered Architecture** | Todo el backend | Separación de responsabilidades UI/CTRL/SVC/REPO/DB |
| **Repository Pattern** | `*.repository.ts` | Abstracción de acceso a datos |
| **Dependency Injection (Manual)** | `index.ts` (IoC) | Inversión de dependencias sin framework |
| **Singleton** | Prisma, Redis, Logger, RateLimit, EventBus | Instancia única con soporte HMR |
| **Cache-Aside** | `CacheService.getOrSet()` | Caché distribuido con fallback a DB |
| **Strategy Pattern** | `PaymentsMethods/` + `audience-resolver.ts` | Algoritmos intercambiables (pago, audiencia) |
| **Factory Pattern** | `PaymentHandlerFactory` | Creación de handlers de pago sin if-else |
| **Higher-Order Function (HOF)** | `auth-guards.ts` | Wrappers RBAC para Server Actions |
| **Event-Driven Architecture** | Notificaciones + EventBus | Comunicación asíncrona desacoplada |
| **Observer Pattern** | Socket.IO + EventBridge | Tiempo real push-based |
| **Lazy Materialization** | Notificaciones BROADCAST | $O(1)$ dispatch para broadcast a N usuarios |
| **Optimistic Locking** | Orders state machine | Prevención de race conditions en transiciones |
| **Optimistic UI Updates** | NotificationContext | Actualización instantánea + sync con servidor |
| **Composite Pattern** | Server Actions | Múltiples queries en una sola acción (evita waterfall) |
| **Strategy Pattern (Auth)** | Auth guards | Roles intercambiables sin modificar lógica |

---

## Autenticación y Control de Acceso

### Guards RBAC (Higher-Order Functions)

```typescript
// Uso típico en Server Actions:
export async function deleteProductAction(id: string) {
  return withAdmin(async () => {
    // Solo admines pueden ejecutar esto
    await productService.deleteProduct(id);
    return { success: true };
  });
}

export async function updateStoreProductAction(storeId: string, data: any) {
  return withStoreOwner(storeId, async () => {
    // Solo el dueño de esta tienda puede ejecutar
    await productService.updateStoreProduct(storeId, data);
    return { success: true };
  });
}
```

| Guard | Permite | Uso |
|-------|---------|-----|
| `withAuth(fn)` | Cualquier usuario autenticado | Perfil, carrito, checkout |
| `withAdmin(fn)` | Solo admins | Panel admin, gestión global |
| `withSeller(fn)` | Solo vendedores | Gestión de tienda propia |
| `withAdminOrSeller(fn)` | Admins o vendedores | Vistas mixtas |
| `withStoreOwner(storeId, fn)` | Dueño de la tienda o admin | Edición de productos/tienda |

### JWT Callbacks

```typescript
// next-auth callbacks:
jwt({ token, user }) → agrega id, email, name, role al token
session({ session, token }) → expone id + role en session.user
```

---

## Tiempo Real (Socket.IO)

### Arquitectura Monolítica

El servidor Socket.IO corre en el **mismo proceso HTTP** que Next.js, en el mismo puerto:

```
server.ts
├── http.createServer()
│   ├── Next.js request handler (app.getRequestHandler())
│   └── Socket.IO init (initSocketServer)
└── listen(config.app.port)
```

Ventaja: sin CORS, sin puerto extra, sin procesos separados, sin proxy.

### Eventos del Socket

| Evento | Dirección | Propósito |
|--------|-----------|-----------|
| `join_room` | Cliente → Servidor | Unirse a conversación |
| `send_message` | Cliente → Servidor | Enviar mensaje (persiste en DB) |
| `receive_message` | Servidor → Sala | Nuevo mensaje (broadcast) |
| `new_message_notification` | Servidor → Global | Badge de no leídos |
| `typing` | Bidireccional | Indicador de escritura |
| `join_notifications` | Cliente → Servidor | Unirse a canal de notificaciones |
| `store_request_updated` | Servidor → Global | Refresco de solicitudes |
| `notification_dispatched` | Servidor → Usuario | Notificación en tiempo real |

### Bridge EventBus → Socket.IO

Los Server Actions emiten eventos via `EventEmitter` (eventBus). El `socketHandler.ts` escucha y reenvía a los clientes vía Socket.IO. Esto mantiene desacoplados los dominios del transporte real-time.

---

## Pagos (MercadoPago)

### Flujo de Pago

1. Cliente hace checkout → Server Action crea preferencia MP → Cliente redirigido a MP
2. MP procesa pago → Webhook POST a `/api/webhooks/mercadopago`
3. Servidor verifica firma HMAC-SHA256 → Actualiza estado del pedido
4. Cliente vuelve a la tienda → Puede ver estado actualizado

### Verificación de Webhook

```typescript
// HMAC-SHA256 signature validation
const expectedSignature = crypto
  .createHmac("sha256", config.mercadopago.webhookSecret)
  .update(JSON.stringify(req.body))
  .digest("hex");
```

### Payment Methods (Factory Pattern)

5 métodos de pago en `src/utils/PaymentsMethods/`:
- **Advisor** — Pago con asesoría
- **Nequi** — Pago Nequi
- **MercadoPago** — Pasarela principal
- **PSE** — Pago PSE
- **Wompi** — Pago Wompi

Cada método = `{ config.ts, handler.ts, index.ts }` — autónomo, extensible sin modificar el checkout.

---

## Encriptación Extremo a Extremo (Chat E2EE)

### Protocolo

Basado en Signal Protocol usando TweetNaCl:
- **Curve25519 (X25519):** acuerdo de llaves
- **XSalsa20-Poly1305:** encriptación autenticada simétrica

### Componentes

| Componente | Propósito |
|-----------|-----------|
| `identityKey` | Identidad del dispositivo (largo plazo) |
| `signedPreKey` | Llave pre-firmada (mediano plazo) |
| `one-time PreKeys` | 20 llaves desechables para PFS (Perfect Forward Secrecy) |
| `sessionKey` | Llave de sesión derivada del handshake X25519 |

### Self-Healing Recovery

Si un usuario cambia de navegador o usa incógnito (IndexedDB vacío):
1. Detecta que no hay llaves locales
2. Consulta `/api/chat/e2ee/bundle/[userId]`
3. El endpoint devuelve las llaves privadas **solo si** `session.user.id === userId`
4. Restaura las llaves en IndexedDB local
5. Puede desencriptar el historial sin romper la sesión de otros dispositivos

### Toggle Centralizado

```typescript
config.chat.enableE2EE // Controlado por NEXT_PUBLIC_ENABLE_E2EE
```

Si deshabilitado: mensajes en texto plano, sin registro de dispositivo, sin handshake criptográfico.

---

## Rate Limiting

Tres capas independientes usando `rate-limiter-flexible` con almacenamiento en memoria:

| Capa | Límite | PREFIX | Propósito |
|------|--------|--------|-----------|
| Global HTTP | 200 requests/minuto/IP | `rateLimitGlobal` | Anti-DDoS general |
| Auth | 5 requests/minuto/IP | `rateLimitAuth` | Protección brute force |
| Socket | 2 mensajes/segundo/socket | — | Anti-spam en chat |

---

## Base de Datos (Prisma Multi-Schema)

### Modelos

| Archivo | Modelos | Propósito |
|---------|---------|-----------|
| `auth.model.prisma` | User, Account, Role enum | Autenticación |
| `product.model.prisma` | Product | Catálogo de productos |
| `categoria.model.prisma` | Categoria | Categorización |
| `order.model.prisma` | Pedido, DetallePedido, PedidoEstado enum | Órdenes de compra |
| `chat.model.prisma` | Conversation, Message, ConversationType enum | Mensajería |
| `e2ee.model.prisma` | E2EEDevice, E2EEPreKey | Llaves criptográficas |
| `forum.model.prisma` | ForumPost, ForumAnswer, ForumRating | Foro comunitario |
| `notification.model.prisma` | DomainEvent, Notification, NotificationRecipient, Group, GroupMember | Notificaciones |
| `store.model.prisma` | Store, StoreRequest, StoreTax, StoreStatus, StoreRequestStatus enums | Tiendas |
| `shipping.model.prisma` | StoreShippingZone, StoreShippingRate, TipoTarifaEnvio enum | Envíos |
| `promotion.model.prisma` | Promotion, DiscountType, PromotionScope enums | Promociones |

### Singleton Prisma

```typescript
// src/backend/db/prisma.ts
// Patrón: globalThis + process (doble storage para Turbopack HMR)
// Conexión automática + ensureAdminExists() en init no-bloqueante
```

---

## Configuración Centralizada

Todas las variables de entorno se acceden exclusivamente a través de `src/config/config.ts`:

```typescript
export const config = {
  env, isProduction, isDevelopment, isTest,
  app: { name, url, port },
  websocket: { url },
  auth: { secret, trustHost, google: { clientId, clientSecret }, admin: { email, password } },
  database: { url, directUrl },
  mercadopago: { accessToken, webhookSecret },
  chat: { enableE2EE },
  cache: { redisUrl, enabled, defaultTTL, ttl: { productList, productDetail, categories, ... } },
  forum: { rules, labels, validation },
  marketplace: { maxProductsPerStore, maxStoresPerUser, adminDefaultStoreName },
} as const;
```

**Regla:** `process.env.X` NUNCA se usa directamente. Siempre `config.*`.

---

## Variables de Entorno

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Agrotopia
PORT=3000
NODE_ENV=development
LOG_LEVEL=DEBUG

# Base de Datos (Supabase)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/db"

# Autenticación
AUTH_SECRET="generar-con-openssl-rand-base64-33"
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Admin por defecto (se crea en primer inicio)
ADMIN_EMAIL="admin@ejemplo.com"
ADMIN_PASSWORD="..."

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_WEBHOOK_SECRET="..."

# Redis (opcional — sin Redis la app funciona igual)
REDIS_URL="redis://default:password@host:6379"
CACHE_ENABLED="true"
```

---

## Puesta en Marcha

### Requisitos

- Node.js 20+
- npm
- PostgreSQL (o cuenta Supabase)
- Redis (opcional, para caché)

### Instalación

```bash
# Clonar e instalar
git clone <repo>
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Inicializar BD
npx prisma generate
npx prisma db push

# Iniciar desarrollo
npm run dev   # → tsx server.ts (puerto 3000)
```

### Comandos Principales

```bash
npm run dev       # Desarrollo con tsx (hot reload)
npm run build     # Build de producción (next build)
npm start         # Producción (tsx server.ts)
npm run lint      # ESLint
npx prisma studio # UI de administración de BD
npx tsc --noEmit  # Type check manual
```

### Despliegue en Render

1. Conectar repositorio
2. Crear servicio Web Service con:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
3. Crear servicio Redis (Redis en Render)
4. Conectar Redis al Web Service via **Private Network** (misma región)
5. Configurar variables de entorno en Render Dashboard
6. El servidor custom `server.ts` maneja HTTP + Socket.IO en un solo puerto

---

## Logging

Sistema de logging centralizado con captura automática del archivo caller:

```typescript
import logger from "@/utils/logger";

// child() sin argumentos captura automáticamente el filename del stack trace
const log = logger.child("src/backend/modules/product/product.service.ts");

log.error("Mensaje de error", { detalle: "valor" });  // Rojo
log.warn("Advertencia");                               // Amarillo
log.info("Información");                                // Verde
log.debug("Debug");                                     // Cyan
```

**Regla:** NUNCA usar `console.log` directamente. Siempre usar el logger centralizado.

---

## ESLint — Reglas de Arquitectura

El proyecto incluye reglas ESLint personalizadas que **impiden violaciones arquitectónicas**:

- ❌ Services no pueden importar Prisma
- ❌ API Routes no pueden acceder a Prisma directamente
- ❌ UI/Frontend no pueden importar `@/backend/db/*`
- ❌ Componentes hijos no pueden importar `@/backend/modules/**`

---

## Frontend — Componentes y Estado

### Providers Tree (orden de anidación)

```
SessionProvider (next-auth)
  → ThemeProvider (next-themes)
    → LanguageProvider (i18n)
      → QueryClientProvider (TanStack Query)
        → CartProvider (carrito + localStorage)
          → SocketProvider (Socket.IO)
            → NotificationProvider (notificaciones)
              → TooltipProvider (Radix)
                → Suspense (ScrollToAnchor)
                  → PageFocusTracker
                    → AppChromeData (Navbar + ChatWidget)
```

### Estado

| Tipo | Herramienta | Casos de uso |
|------|------------|-------------|
| **Async (servidor)** | TanStack React Query | Productos, pedidos, foro, datos de BD |
| **Sync (UI/local)** | React Context | Carrito, idioma, socket, notificaciones |
| **Tiempo real** | Socket.IO (via SocketContext) | Chat, notificaciones push, badges |
| **Persistencia local** | localStorage | Carrito, preferencia de idioma |
| **Cache navegador** | IndexedDB (via `idb`) | Llaves E2EE del chat |

---

## Seguridad

| Aspecto | Implementación |
|---------|---------------|
| **Autenticación** | JWT stateless + bcrypt (10 rounds) |
| **Autorización** | 5 HOCs RBAC (withAuth, withAdmin, etc.) |
| **Validación** | Zod en todos los boundaries cliente-servidor |
| **Rate Limiting** | 3 capas: global (200/m), auth (5/m), socket (2/s) |
| **Headers HTTP** | HSTS, X-Frame-Options DENY, X-Content-Type-Options, etc. |
| **Webhooks** | HMAC-SHA256 signature verification |
| **Chat** | E2EE opcional (Signal Protocol) |
| **ESLint** | Reglas que previenen violaciones de arquitectura |
| **Server Actions** | Siempre en `"use server"` + auth guard |

---

## Testing

Actualmente no hay suite de tests automatizados. La arquitectura está diseñada para tests unitarios en servicios:

```typescript
// Los Service son pura lógica de negocio, inyectan Repository vía constructor:
// → Fáciles de mockear en tests unitarios
// → No dependen de Next.js, HTTP, o infraestructura
```

Para agregar tests, enfocarse en `*.service.ts` (lógica pura) y `*.actions.ts` (orquestación).

---

## Licencia

Proyecto privado — Agroecotopia.
