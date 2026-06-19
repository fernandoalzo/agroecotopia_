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
| **Rate Limiting** | rate-limiter-flexible (Redis + in-memory fallback) | 11.1.0 |
| **Embeddings** | Ollama + pgvector (cosine distance) | — |

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
│  │  Security Layer (transversal)                                │   │
│  │  ├─ Security Headers (CSP, HSTS, COOP, XFO, etc.)           │   │
│  │  ├─ WAF (IP blocklist, bot detect, geoblock, attacks)       │   │
│  │  ├─ Rate Limiter (global 200/min + auth 5/min)               │   │
│  │  └─ Anomaly Detection (login behaviour analysis)             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Next.js 16 Request Handler (App Router)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │   │
│  │  │  Pages   │ │ API Rut.│ │ S. Actions│ │ Middleware      │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Socket.IO Server (mismo proceso, mismo puerto)               │   │
│  │  → CORS restringido a config.app.url                          │   │
│  │  → Chat en tiempo real + Notificaciones push                  │   │
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
│  └─────────┘ └──────┘ └───────┘ └──┬───┘ └───┬────┘ └──────────┘  │
│                                     │         │                    │
│                           ┌─────────▼─────────▼──────────┐         │
│                           │   Stock Guardian (Redis)      │         │
│                           │   Locks + Lua + Fallback DB   │         │
│                           └─────────┬────────────────────┘         │
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
│  SEC │  Security Layer (transversal)         │  → Headers, Rate Limit, Anomaly Detect
│       │  server.ts + security-headers.ts     │  → Se aplica a TODAS las respuestas
│       │  + rate-limit.ts + anomaly-detector  │
│       │  + waf/                              │  → WAF: IP blocklist, bot detect, geoblock
├───────┼──────────────────────────────────────┤
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
│ LOCK  │  Stock Guardian (Locks + Lua Redis)  │  → Concurrencia de stock
├───────┼──────────────────────────────────────┤
│  DB   │  Prisma ORM → PostgreSQL             │  → Source of Truth
└───────┴──────────────────────────────────────┘
```

**Reglas de dependencia (estrictas):**
- `UI → CTRL → SVC → REPO → CACHE → LOCK → DB`
- La **Security Layer** (SEC) es transversal — se aplica en `server.ts` antes de que cualquier request toque la app.
- Un componente/página NUNCA importa Prisma, repositorios o servicios directamente.
- Los Server Actions son la única puerta de entrada al backend desde UI.
- Los Servicios no saben que existe caché. Solo los Repositorios usan `CacheService`.
- `CacheService` solo se inyecta en constructores de Repositorios.
- El Stock Guardian (LOCK layer) solo es invocado directamente por Services (OrdersService) cuando necesita coordinar stock. No pasa por Repository porque opera sobre Redis, no sobre DB.

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
│   ├── modules/                      # 12 módulos de dominio + shared
│   │   ├── shared/embedding/         # Capa compartida de embedding vectorial (pgvector + Ollama)
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
│   ├── components/                   # 70+ componentes UI
│   │   ├── ai/                       # AI components (RelatedPosts, RelatedProducts, GenerateDescriptionButton)
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
│   ├── rate-limit.ts                # Rate limiters (Redis + fallback memoria)
│   ├── security-headers.ts          # CSP, HSTS, COOP, etc. + applySecurityHeaders()
│   ├── waf/                         # WAF — Web Application Firewall
│   │   ├── types.ts                 # Tipos del WAF
│   │   ├── geoblock.ts              # Bloqueo geográfico (ISO 3166-1 alpha-2)
│   │   ├── ip-blocklist.ts          # Bloqueo por IP/CIDR
│   │   ├── bot-detection.ts         # Detección de bots, scanners, patrones de ataque
│   │   ├── rules-engine.ts          # Motor de evaluación de reglas
│   │   └── index.ts                 # WAF singleton + applyWafMiddleware()
│   ├── anomaly-detector/            # Login anomaly detection engine
│   │   ├── types.ts                 # Tipos del motor
│   │   ├── redis.ts                 # Cliente Redis dedicado (fast-fail)
│   │   ├── geo.ts                   # Geo-IP resolver (ip-api.com)
│   │   ├── scorer.ts                # Evaluación de 6 señales de riesgo
│   │   ├── store.ts                 # Persistencia de perfiles en Redis
│   │   └── index.ts                 # AnomalyDetector singleton
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
- **Búsqueda semántica:** embeddings vectoriales vía Ollama + pgvector cosine distance. Debounce 300ms en frontend, spinner de carga, fallback automático a ILIKE textual.
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
- **Optimistic Locking:** las transiciones de estado usan `updateMany` con `WHERE estado = ${estadoActual}` para prevenir race conditions sobre la misma orden
- **Stock:** se descuenta SOLO al confirmar (`CONFIRMADO`), se revierte al cancelar (solo si fue previamente descontado). Usa el **Stock Guardian** con Redis locks distribuidos + Lua script atómico para prevenir overbooking. Doble barrera: Redis (capa rápida) + PostgreSQL `updateMany WHERE stock>=qty` (capa definitiva). Fallback a DB si Redis no está disponible (graceful degradation).
- **Notificaciones:** al crear pedido (notifica al vendedor), al cambiar estado (notifica al comprador)

### 6. Payments — MercadoPago
- **Creación de preferencia:** ítems, payer, back_urls, webhook URL
- **Webhook con HMAC-SHA256:** verificación de firma antes de procesar
- **Transiciones:** `approved` → CONFIRMADO, `rejected/cancelled` → CANCELADO

### 7. Product — Productos (con Caché Redis + Búsqueda Semántica)
- **Único módulo con caché distribuida actualmente**
- **Cache-Aside Pattern:** `getOrSet(key, fetcher, ttl)` — si Redis disponible, cachea; si no, consulta DB directamente
- **TTLs:** listas 60s, detalle 120s, categorías 300s, búsquedas 60s
- **Invalidación:** cada mutación (create/update/delete) invalida todo `cache:product:*`
- **Catálogo:** paginado, filtrable por categorías y tienda
- **Búsqueda textual:** multi-campo (nombre, descripción, tag, tienda, categoría) con case-insensitive contains
- **Búsqueda semántica:** embeddings vectoriales vía Ollama + pgvector cosine distance. Feature flag `config.ai.features.semanticSearch`. Fallback automático a búsqueda textual si Ollama no disponible o sin resultados.
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

### 13. StockGuardian — Control de Concurrencia de Stock
- **Propósito:** Prevenir condiciones de carrera en la confirmación de pedidos (`PENDIENTE → CONFIRMADO`). Dos administradores confirmando simultáneamente el mismo producto no pueden producir overbooking.
- **Arquitectura:** Redis locks distribuidos (`SET lock:stock:{pid} UUID EX 5 NX`) + Lua script atómico para check-and-deduct + `updateMany WHERE stock>=qty` en PostgreSQL como barrera final.
- **Ubicación:** `src/backend/modules/stockGuardian/`
- **Redis keys:** `stock:master:{pid}` (stock en tiempo real), `lock:stock:{pid}` (mutex por producto), `lock:confirm:{pedidoId}` (anti-doble-procesamiento)
- **TTL de 5s:** auto-recuperación si el servidor crashea durante la transacción. No tiene relación con el tiempo que el dueño tarda en confirmar (horas/días).
- **Fallback DB:** cuando Redis no está disponible, la barrera DB (`updateMany WHERE stock>=qty`) sigue protegiendo contra overbooking. Degradación gradual silenciosa.
- **Inicialización:** `initializeStockMaster()` en `server.ts` sincroniza `stock:master:{pid}` desde PostgreSQL al arrancar.
- **Semántica:** Comprar no consume stock. Confirmar sí. El primer proceso que ejecute `CONFIRMADO` se lleva el producto, sin importar quién pidió primero.

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

### Stock Guardian (Control de Concurrencia)

El Stock Guardian es un **consumidor de Redis que NO es caché**. Usa Redis para:

- **Distributed Locks:** semáforos por producto (`lock:stock:{pid}`) que serializan confirmaciones concurrentes. Se adquieren en orden alfabético de productIds para prevenir deadlocks.
- **Lua Scripts:** operaciones atómicas de check-and-deduct sin ventanas de race condition (GET + DECRBY en una sola operación single-threaded).
- **Stock Master:** `stock:master:{productId}` como fuente de verdad en tiempo real. Sincronizado desde PostgreSQL al arrancar y bajo demanda (lazy sync).

**Flujo de confirmación de un pedido:**

```
1. Adquirir locks para todos los productos del pedido (orden alfabético)
2. Ejecutar Lua script: verificar stock ≥ qty → DECRBY si hay
3. Transición DB: tryTransitionEstado + updateMany WHERE stock≥qty
4. Liberar locks
```

**Si Redis falla:** skip locks, skip Lua, solo DB (`updateMany WHERE stock>=qty` es atómico en PostgreSQL).

**Arquitectura de doble barrera:**

| Capa | Tecnología | Rol | Si falla |
|------|-----------|-----|----------|
| 1ª | Redis locks | Serializa acceso por producto | DB directo |
| 2ª | Redis Lua | Check + decrement atómico | DB directo |
| 3ª | PostgreSQL `updateMany WHERE stock>=qty` | Update condicional atómico | Rollback + error |

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
| **Optimistic Locking** | Orders state machine | Prevención de race conditions en transiciones de estado |
| **Distributed Lock** | Stock Guardian (`lock:stock:{pid}`) | Mutex distribuido con auto-expiración (TTL 5s) para exclusión mutua |
| **Lua Scripting (Redis)** | Stock Guardian `checkAndDeductStock` | Operación atómica server-side en Redis sin race window |
| **Circuit Breaker** | Stock Guardian | Degradación gradual: Redis → DB fallback → error |
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

### Bridge EventBus → Socket.IO (Auto-Bridge Genérico)

Los Server Actions y Services emiten eventos via `EventEmitter` (eventBus). El `socketHandler.ts` usa un **Auto-Bridge Genérico**: un array `BRIDGE_EVENTS` + loop que enlaza automáticamente cada evento a Socket.IO sin código repetitivo. Si el payload incluye `_room`, se emite solo a esa sala; si no, globalmente. Esto mantiene desacoplados los dominios del transporte real-time y permite agregar nuevos eventos con solo 1 línea en el array + 1 `eventBus.emit()`.

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

Arquitectura de doble capa: **Redis como primario** con **fallback automático a memoria** cuando Redis no está disponible. Cada request reintenta Redis de forma optimista; si Redis falla, degrada silenciosamente a memoria sin interrumpir el servicio.

| Capa | Límite | PREFIX | Propósito |
|------|--------|--------|-----------|
| Global HTTP | 200 requests/minuto/IP | `rateLimitGlobal` | Anti-DDoS general |
| Auth | 5 requests/minuto/IP | `rateLimitAuth` | Protección brute force |
| Socket | 2 mensajes/segundo/socket | — | Anti-spam en chat |

**Cliente Redis dedicado** (`src/lib/rate-limit.ts`): lazyConnect, 2s timeout, sin retry automático. Si Redis no contesta en 2s, la request se procesa con el limiter en memoria. En la siguiente request se reintenta Redis (optimistic retry).

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
  security: {                              // ← Seguridad centralizada
    headersEnabled,                         // Master switch
    csp: { scriptSrc, styleSrc, connectSrc, frameSrc, imgSrc, fontSrc, formAction, extra* },
    hsts: { maxAge, includeSubDomains, preload },
    xFrameOptions, xContentTypeOptions, referrerPolicy, xXSSProtection,
    crossOriginOpenerPolicy, crossOriginResourcePolicy,
    permissionsPolicy: { camera, microphone, geolocation, payment },
    rateLimit: { global: { points, duration }, auth: {...}, socket: {...} },
    crypto: { bcryptSaltRounds },
    anomalyDetection: { mode, thresholds, weights, geoIp, alerts },
  },
  chat: { enableE2EE },
  cache: { redisUrl, enabled, defaultTTL, ttl: { productList, productDetail, categories, ... } },
  ai: { enabled, provider, models, apiKeys, features },  // ← Secrets centralizados
  forum: { rules, labels, validation },
  marketplace: { maxProductsPerStore, maxStoresPerUser, adminDefaultStoreName },
  embedding: { dimensions, batchSize },
  ollama: { baseUrl, embeddingModel, timeout },
} as const;
```

**Regla:** `process.env.X` NUNCA se usa directamente. Siempre `config.*`. El objeto completo es `as const` (deeply readonly) para prevenir mutaciones accidentales.

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

# ── Security Headers ──────────────────────────────
SECURITY_HEADERS_ENABLED=true                          # Master switch headers de seguridad
CSP_SCRIPT_SRC="'self' 'unsafe-inline' 'unsafe-eval'"  # Orígenes permitidos para scripts
CSP_STYLE_SRC="'self' 'unsafe-inline'"                 # Orígenes permitidos para estilos
CSP_CONNECT_SRC="'self' https: wss:"                   # Orígenes para fetch/XHR/WS
CSP_FRAME_SRC="'self'"                                 # Orígenes permitidos en iframes
CSP_IMG_SRC="'self' data: blob: https: http:"          # Orígenes para imágenes
CSP_FONT_SRC="'self' data:"                            # Orígenes para fuentes
CSP_FORM_ACTION="'self'"                               # Destinos permitidos en forms
CSP_EXTRA_SCRIPT_SRC=""                                # Scripts extra (comma-separated)
CSP_EXTRA_CONNECT_SRC=""                               # Conexiones extra (comma-separated)
CSP_EXTRA_FRAME_SRC=""                                 # Frames extra (comma-separated)
HSTS_MAX_AGE=63072000                                  # 2 años en segundos
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
X_FRAME_OPTIONS=DENY
X_CONTENT_TYPE_OPTIONS=nosniff
REFERRER_POLICY=strict-origin-when-cross-origin
X_XSS_PROTECTION=0
COOP_POLICY=same-origin
CORP_POLICY=same-origin
PERMISSIONS_CAMERA=()
PERMISSIONS_MICROPHONE=()
PERMISSIONS_GEOLOCATION=()
PERMISSIONS_PAYMENT=(self)

# ── Rate Limiting ─────────────────────────────────
RATE_LIMIT_GLOBAL_POINTS=200
RATE_LIMIT_GLOBAL_DURATION=60
RATE_LIMIT_AUTH_POINTS=5
RATE_LIMIT_AUTH_DURATION=60
RATE_LIMIT_SOCKET_POINTS=2
RATE_LIMIT_SOCKET_DURATION=1

# ── Anomaly Detection ─────────────────────────────
ANOMALY_DETECTION_MODE=monitor       # disabled | monitor | enforce
ANOMALY_SUSPECT_THRESHOLD=0.4
ANOMALY_BLOCK_THRESHOLD=0.7
ANOMALY_GEO_ENABLED=true             # Geo-IP vía ip-api.com
ANOMALY_ALERT_USER=true              # Notificar al usuario en eventos SUSPECT
ANOMALY_ALERT_ADMIN=true             # Registrar en stream admin de Redis

# ── Crypto ────────────────────────────────────────
BCRYPT_SALT_ROUNDS=10                # 10=~80ms, 12=~320ms, 14=~1.2s

# ── WAF (Web Application Firewall) ────────────────
WAF_MODE=monitor                     # disabled | monitor | enforce
WAF_GEO_ENABLED=true                 # Geo-IP para geoblocking
WAF_GEO_BLOCKED_COUNTRIES=""         # Países bloqueados (ISO 3166-1, comma-separated)
WAF_GEO_ALLOWLIST=""                 # Solo estos países permitidos (comma-separated)
WAF_IP_BLOCKLIST_ENABLED=true
WAF_IP_BLOCKLIST_CIDRS=""            # CIDRs bloqueados (comma-separated, ej: "1.2.3.4/32,5.6.0.0/16")
WAF_BOT_DETECTION_ENABLED=true
WAF_BOT_BLOCK_KNOWN=true             # Bloquear scanners conocidos
WAF_BOT_BLOCK_EMPTY_UA=true          # Bloquear User-Agent vacío
WAF_BOT_THRESHOLD=80                 # Threshold para detección ML (reservado)
WAF_RATE_LIMIT_ENABLED=true
WAF_RATE_LIMIT_POINTS=100            # Requests por ventana
WAF_RATE_LIMIT_DURATION=60            # Ventana en segundos
WAF_RULES_ENABLED=true
WAF_BLOCK_SENSITIVE_PATHS=true       # Bloquear /.env, /admin, etc.
WAF_BLOCK_ATTACK_PATTERNS=true       # Bloquear SQLi, XSS, path traversal

# ── AI / Embeddings ───────────────────────────────
AI_ENABLED=false
AI_PROVIDER=deepseek                 # deepseek | openai | ollama
DEEPSEEK_API_KEY="..."
OPENAI_API_KEY="..."
OLLAMA_API_KEY="..."
AI_MODEL_CHAT=deepseek-chat
AI_MODEL_EMBEDDING=deepseek-embedding
EMBEDDING_DIMENSIONS=4096
EMBEDDING_BATCH_SIZE=10
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

Todas las políticas de seguridad se centralizan en `src/config/config.ts` → `config.security.*`. Ningún valor está hardcodeado; el 100% es sobreescribible vía variables de entorno.

### HTTP Security Headers

Aplicados en **todas las respuestas** (incluyendo 429, 401, 500) mediante `res.writeHead` wrapper en `server.ts`. First-writer-wins: si Next.js ya seteó un header, no se sobreescribe.

| Header | Valor | Efecto |
|--------|-------|--------|
| **Content-Security-Policy** | `default-src 'self'` + directivas detalladas | Control granular de recursos (scripts, estilos, conexiones, frames) |
| **Strict-Transport-Security** | `max-age=63072000; includeSubDomains; preload` | HTTPS forzado 2 años, todos los subdominios, preload list |
| **X-Frame-Options** | `DENY` | Bloquea clickjacking — la página no se puede incrustar en iframes |
| **X-Content-Type-Options** | `nosniff` | Evita MIME-type sniffing |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Controla información enviada en headers Referer |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), payment=(self)` | Restringe APIs del navegador (reduce fingerprinting) |
| **Cross-Origin-Opener-Policy** | `same-origin` | Aísla la ventana contra ataques Spectre via cross-origin opens |
| **Cross-Origin-Resource-Policy** | `same-origin` | Bloquea carga cross-origin de recursos estáticos |
| **X-XSS-Protection** | `0` | Desactiva el legacy XSS Auditor (obsoleto) |

CSP permite `'unsafe-inline'` para scripts (requerido por Next.js RSC payload inline scripts) y `'unsafe-eval'` (para Webpack HMR en desarrollo). En producción eliminar `'unsafe-eval'` si no se usa.

### Rate Limiting (Redis + Memoria)

| Capa | Redis | Fallback | Límite |
|------|-------|----------|--------|
| Global HTTP | RateLimiterRedis | RateLimiterMemory | 200 req/min/IP |
| Auth | RateLimiterRedis | RateLimiterMemory | 5 req/min/IP |
| Socket | RateLimiterRedis | RateLimiterMemory | 2 msg/s/socket |

Cliente Redis dedicado con `lazyConnect`, timeout 2s, sin retry automático. En cada request reintenta Redis (optimistic retry).

### Anomaly Detection Engine

Sistema de detección de login anomalo en `src/lib/anomaly-detector/` que evalúa 6 señales en cada inicio de sesión:

| Señal | Peso | Qué detecta |
|-------|------|-------------|
| **IP desconocida** | 30% | IP nunca antes vista para este usuario |
| **Anomalía geográfica** | 25% | Distancia >1000km desde el último login (haversine) |
| **Horario atípico** | 15% | Hora del día fuera del rango habitual del usuario |
| **Dispositivo no registrado** | 10% | User-Agent fingerprint no reconocido |
| **Reputación de IP** | 10% | Ratio de intentos fallidos vs exitosos |
| **Velocidad** | 10% | Múltiples fallos antes del éxito (≥3 intentos fallidos) |

**Tres modos de operación** (configurable vía `ANOMALY_DETECTION_MODE`):
- `disabled` → motor apagado, cero overhead
- `monitor` → detecta, registra, notifica — NUNCA bloquea
- `enforce` → detecta, registra, notifica — BLOQUEA logins con score >0.7

**Fail-open:** si Redis no está disponible, el motor se desactiva silenciosamente y permite todos los logins (mejor bloquear un ataque perdido que denegar acceso a un usuario legítimo por fallo de infraestructura).

Geolocalización vía ip-api.com (free tier, sin API key, 45 req/min) con caché local en Map.

### WAF (Web Application Firewall)

Capa de seguridad perimetral en `src/lib/waf/` que evalúa cada request HTTP contra 5 grupos de reglas configurables, antes de que llegue al handler de Next.js. Se ejecuta en `server.ts` como middleware, leyendo la configuración directamente de la base de datos.

| Regla | Dependencia | Velocidad | Qué bloquea |
|-------|-------------|-----------|-------------|
| **IP Blocklist** | Ninguna | O(n) CIDR match | IPs/CIDRs en lista negra configurable |
| **Bot Detection** | Ninguna | Solo headers | Scanners (nmap, sqlmap, nikto), bots desconocidos, User-Agent vacío |
| **Sensitive Paths** | Ninguna | Path prefix | `/.env`, `/.git`, `/admin`, `/wp-admin`, `/actuator`, `/vendor`, etc. |
| **Attack Patterns** | Ninguna | Regex | SQLi, XSS, path traversal, LFI, command injection en path y query string |
| **Geoblock** | ip-api.com | I/O (cacheado) | Países bloqueados o no permitidos (ISO 3166-1 alpha-2) |

**Tres modos de operación** (configurable vía `WAF_MODE`):
- `disabled` → WAF no se inicializa, cero overhead
- `monitor` → evalúa todas las reglas, logea bloques, setea header `X-WAF-Monitor`, NUNCA deniega
- `enforce` → evalúa + logea + BLOQUEA requests que matchean reglas

**Orden de evaluación** (más rápido primero): IP Blocklist → Bot Detection → Sensitive Paths → Attack Patterns → Geoblock. Las primeras 4 no requieren I/O. Geoblock (la única con I/O) se evalúa al final y cachea resultados por IP.

**Custom Server Middleware**: En el servidor custom (`server.ts`) las reglas se ejecutan via `applyWafMiddleware()`, asegurando que toda la protección provenga exclusivamente de la base de datos sin depender de variables de entorno duras.

### Otras Medidas

| Aspecto | Implementación |
|---------|---------------|
| **Autenticación** | JWT stateless + bcrypt (10-12 rounds, configurable via `BCRYPT_SALT_ROUNDS`) |
| **Autorización** | 5 HOCs RBAC (withAuth, withAdmin, withSeller, withAdminOrSeller, withStoreOwner) |
| **Validación** | Zod en todos los boundaries cliente-servidor, esquemas standalone en `schemas/` |
| **Webhooks** | HMAC-SHA256 signature verification (MercadoPago) |
| **Chat** | E2EE opcional (Curve25519 + XSalsa20-Poly1305 via TweetNaCl) |
| **Stored XSS** | `rehype-sanitize` en ReactMarkdown del foro (`ForumQuestionDetail`, `ForumAnswerCard`) |
| **API Routes** | Autenticación `auth()` requerida en endpoints sensibles (`calculate-shipping`, `calculate-taxes`) |
| **Socket.IO CORS** | Restringido a `config.app.url` (origen único), `credentials: true` |
| **Server Actions** | Siempre `"use server"` + auth guard + rate limit + doble-submit prevention |
| **AI Secrets** | Centralizados en `config.ai.apiKeys` — cero `process.env` en módulos AI |
| **Logger** | Prohibido `console.log` — usar `logger.child()` con data source tagging (`[cache]`, `[db]`, `🤖`) |

### Referencias

- OWASP Secure Headers Project
- Mozilla Observatory
- PCI DSS v4.0 Requirement 6.6
- AWS Well-Architected Framework — Security Pillar

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

# 🚀 FASE IA — Agroecotopia AI-First

## Visión General — Capa de Inteligencia Artificial Transversal

La plataforma está preparada arquitectónicamente para integrar una **capa de IA transversal** que potencia todos los módulos existentes sin romper la separación de capas. Cada componente de IA se comunica con el backend mediante el mismo patrón definido: `eventBus` para eventos asíncronos, Server Actions para invocación, y Socket.IO para actualizaciones en tiempo real.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGROECOTOPIA AI LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Percepción    │  Razonamiento   │  Predicción    │  Generación │
│  (visión, NLP) │  (reglas, grafos)│  (ML models)  │  (LLM, img) │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  Módulos existentes (backend modular + eventBus + Socket.IO)     │
│  product │ orders │ forum │ chat │ notifications │ payments ...  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Motor de Recomendaciones Inteligente (Product Module)

### 1.1 Recomendación Contextual Multi-factor
Embeddings vectoriales (`pgvector` en PostgreSQL) de cada producto basado en:
- Nombre, descripción, categoría, tags
- Historial de compras del usuario
- Estación del año / clima (productos de temporada)
- Región del comprador (productos locales recomendados)

```
product.repository.ts → getRecommendations(userId, context)
  → CacheService.getOrSet("ai:recommendations:{userId}:{context}")
     → fallback: pgvector cosine similarity query
  → eventBus.emit("recommendations:updated", { userId })
  → useSocketRefresh escucha y refresca UI
```

### 1.2 Búsqueda Semántica ✅ Implementada
Búsqueda vectorial reemplazando parcialmente `ILIKE` con embeddings + pgvector cosine distance para productos y foro:
- **Shared layer:** `src/backend/modules/shared/embedding/` — `EmbeddingRepository` (SQL pgvector), `EmbeddingService` (Ollama), `orderByIds` utility
- **Productos:** `ProductEmbeddingService.searchSimilar()` con filtros por storeId y categorías, threshold 0.6
- **Foro:** `ForumPostEmbeddingService.searchSimilar()` con filtro por labels, threshold 0.48, debounce 300ms + spinner en frontend
- **Fallback:** si Ollama no disponible o sin resultados → búsqueda textual ILIKE
- **Config:** `config.ai.features.semanticSearch` (true por defecto), modelo `qwen3-embedding:8b` vía Ollama

### 1.3 Pricing Dinámico Asistido
Sugiere precios óptimos basados en:
- Historial de ventas del producto
- Precios de la competencia (web scraping programado)
- Elasticidad de demanda
- Estacionalidad

```typescript
// src/backend/modules/ai/pricing/pricing.service.ts
export class AIPricingService {
  async suggestPrice(productId: string): Promise<{
    suggested: number;
    confidence: number;
    reasoning: string;
  }>;
}
```

---

## 2. Asistente Virtual Inteligente (Chat + Chat Widget)

### 2.1 Chatbot Híbrido (Agente IA) ✅ Implementado
El `ChatWidget` integra un **AI Agent** con capacidades de streaming:
- **Respuestas en Tiempo Real (Streaming)**: Generación progresiva de texto usando `async function*` (soportado nativamente por React 19 en Server Actions).
- **RAG (Retrieval-Augmented Generation)**: 3 Retrievers activos que inyectan contexto sobre la plataforma, foro (pgvector) y productos (pgvector).
- **Arquitectura Multimodelo**: Soporte intercambiable para Ollama (Local) y DeepSeek (Cloud) mediante el patrón `AIProviderFactory`.

```
ChatWidget (UI) → aiStreamChatAction (Server Action)
  → AIService.ragStreamChat()
    → RAGService.retrieve() [Platform + Forum + Products]
    → OllamaProvider.streamChat() → chunk yield
```

### 2.2 Voz a Texto (Modo Manos Libres)
Agricultores en campo usan comandos de voz:
- Speech-to-Text → Búsqueda semántica → Resultado narrado
- Integrable vía Web Speech API (navegador) o API externa

---

## 3. Visión por Computadora para Productos

### 3.1 Clasificación Automática de Imágenes
Cuando un vendedor sube una foto de producto, la IA:
1. Detecta baja calidad (borrosa, mal iluminada)
2. Sugiere categorías automáticas
3. Genera tags descriptivos
4. Extrae texto de etiquetas/envases (OCR)

### 3.2 Búsqueda por Imagen
El comprador sube una foto → búsqueda inversa → productos similares:

```
POST /api/ai/vision/search  →  Embedding visual  →  pgvector  →  resultados
```

### 3.3 Moderación de Imágenes
Detección automática de contenido inapropiado antes de publicar.

---

## 4. Agricultura de Precisión — Módulo AI Expert

### 4.1 Sistema Experto para el Foro (Forum Module)
**RAG sobre el foro comunitario:**
- Cuando un usuario pregunta, el sistema busca en posts/respuestas anteriores y sugiere respuestas
- Detecta preguntas duplicadas y enlaza a la respuesta existente
- Clasifica automáticamente posts con labels (plagas, riego, nutrición...)

### 4.2 Diagnóstico de Plagas (Computer Vision)
Usuario sube foto de planta enferma → modelo identifica plaga/enfermedad → recomienda productos del catálogo:

```
forum/post/create → AI analiza imagen → detecta plaga
  → sugiere productos relacionados → enlaza al checkout
```

---

## 5. Business Intelligence Predictivo

### 5.1 Predicción de Demanda (Stats + Orders Modules)
Basado en datos históricos + estacionalidad + clima:
- Predice productos con alta demanda la próxima semana
- Sugiere a vendedores cuándo reabastecer
- Recomienda ajustes de stock preventivos

```typescript
// src/backend/modules/ai/forecasting/demand.service.ts
eventBus.on("order:confirmed", () => demandService.updateModel());
```

### 5.2 Customer Lifetime Value (CLV)
Identifica clientes de alto valor potencial y sugiere:
- Cupones personalizados
- Notificaciones específicas
- Prioridad en atención al cliente

### 5.3 Detección de Abandono de Carrito
Si un usuario agrega productos al carrito y no compra en 30min:
1. AI evalúa probabilidad de conversión
2. Envía notificación push personalizada vía `NotificationProvider`
3. Ofrece descuento selectivo si el modelo detecta precio como barrera

---

## 6. Automatización Inteligente de Operaciones

### 6.1 AI Agent para Logística (Shipping Module)
- **Optimización de tarifas**: combinación óptima basada en peso, distancia, velocidad
- **Estimación precisa de entrega**: predicción usando datos históricos

### 6.2 Moderación del Foro Automática ✅ Implementada
- **Análisis en tiempo real**: LLM analiza el texto antes de persistir en BD exigiendo respuesta en JSON estricto.
- **Detección proactiva**: Detecta spam, lenguaje de odio, intentos de fraude y contenido peligroso.
- **Degradación Elegante**: Si el modelo falla, permite la publicación pasivamente para no interrumpir el servicio.

### 6.3 Traducción Automática (i18n Dinámico)
El sistema actual (ES/EN) se expande a **N idiomas** vía traducción automática:
- Posts del foro, descripciones de productos, notificaciones

---

## 7. AI para Sellers (Store Module)

### 7.1 Generación de Descripciones de Producto ✅ Implementada
Botón "Generar con IA" en los modales de creación y edición de productos (`ProductCreateModal`, `ProductEditModal`, `ProductDetailPanel`).
- **Input:** nombre, categorías y tag del producto (tomados del formulario en tiempo real)
- **Output:** descripción profesional en español generada por LLM (Ollama/DeepSeek)
- **UX:** spinner de carga + feedback de error; el texto generado se inyecta directamente en el textarea
- **Backend:** `AIService.generateProductDescription()` construye un system prompt + user prompt y llama al provider activo
- **Server Action:** `aiGenerateDescriptionAction` (validación `withAuth`, gated por módulo AI activo)
- **Componente Dumb:** `GenerateDescriptionButton` en `src/frontend/components/ai/` — recibe `onGenerate`/`onGenerated` como props, no importa Server Actions directamente

### 7.2 Score de Calidad del Producto
Evalúa automáticamente si un producto tiene:
- Buena descripción ✅
- Imagen de calidad ✅
- Precio competitivo ✅
- Stock suficiente ✅
- Categoría correcta ✅

Devuelve un score 0-100 y sugerencias de mejora.

### 7.3 Copiloto para Vendedores (Seller Panel)
Asistente conversacional dentro del panel `mi-tienda`:
- "¿Cuántas ventas tuve esta semana?"
- "¿Qué producto se vende más?"
- "Recomiéndame qué promoción crear"

---

## 8. Integración Técnica — Módulo AI

### 8.1 Estructura Propuesta

```text
src/backend/modules/ai/
├── index.ts                       ← IoC: Instancia condicional de servicios AI (AI_ENABLED)
├── ai.actions.ts                  ← Server Actions (incluye aiStreamChatAction)
├── ai.service.ts                  ← Orquestador central (Chat, Streaming, Embeddings)
├── ai.repository.ts               ← Caché de respuestas LLM (Redis)
├── providers/
│   ├── factory.ts                 ← Factory Pattern para proveedores
│   ├── ollama.ts                  ← Proveedor Ollama (streaming soportado)
│   ├── deepseek.ts                ← Proveedor DeepSeek
│   └── openai.ts                  ← Proveedor OpenAI (stub)
├── nlp/
│   ├── rag.service.ts             ← Retrieval-Augmented Generation (RAG)
│   ├── platform-content.ts        ← Base de conocimientos estática
│   └── translation.service.ts     ← Traducción automática (stub)
├── moderation/
│   └── content-moderation.service.ts ← Moderación automática
├── forecasting/
│   ├── demand.service.ts          ← Predicción de demanda (stub)
│   └── pricing.service.ts         ← Pricing dinámico (stub)
└── vision/
    └── vision.service.ts          ← Computer Vision (stub)
```

### 8.2 Integración con la Arquitectura Existente

| Componente existente | Cómo lo potencia la IA |
|----------------------|------------------------|
| `product.repository.ts` + `CacheKeys` | Embeddings cacheados + vector search |
| `eventBus` | Eventos `ai:recommendation:ready`, `ai:forecast:updated` |
| `useSocketRefresh` | Clientes reciben recomendaciones en tiempo real |
| `NotificationProvider` | Notificaciones inteligentes predictivas |
| `CartContext` | Abandono de carrito detectado por IA |
| `ForumService` | RAG sobre el foro + detección de plagas en imágenes |
| `ChatWidget` | Chatbot híbrido + escalamiento inteligente |
| `OrdersService` | Predicción de demanda + optimización de stock |
| `StockGuardian` | Stock predictivo (no solo reactivo) |
| `ShippingService` | Estimación inteligente de entrega |
| `StorePaymentSection` | Pricing dinámico sugerido por IA |

### 8.3 Feature Flags para Gradual Rollout

```typescript
// src/config/config.ts — feature flags activos
ai: {
  enabled: process.env.AI_ENABLED === 'true',
  provider: process.env.AI_PROVIDER || 'ollama',
  features: {
    semanticSearch: true,          // ✅ Búsqueda vectorial (productos + foro)
    visualSearch: false,
    chatbot: true,                 // ✅ Chatbot híbrido con RAG + streaming
    demandForecasting: false,
    moderation: true,              // ✅ Moderación automática del foro
    translation: false,
    forecasting: false,
    pricing: false,
  },
  models: {
    embedding: 'deepseek-embedding',
    chat: 'deepseek-chat',
  },
}
```

La generación de descripciones no tiene feature flag propio; se activa automáticamente cuando el módulo AI está habilitado (`AI_ENABLED=true`) y el provider responde.

### 8.4 Roadmap de Implementación

| Fase | Features | Impacto esperado |
|------|----------|------------------|
| **1. Inmediata** (semanas) | ✅ **Búsqueda semántica** + ✅ **Chatbot RAG c/ Streaming** + ✅ **Moderación foro** + ✅ **Descripciones automáticas** | −40% consultas repetitivas, +eficiencia vendedores |
| **2. Corto plazo** (1-2 meses) | Recomendaciones + Traducción | +25% conversión, alcance EN |
| **3. Medio plazo** (3-4 meses) | Visión (clasificación + búsqueda por imagen) + Predicción demanda | Reducción overstock, mejor UX |
| **4. Largo plazo** (6+ meses) | Diagnóstico plagas + Voz + Pricing dinámico + CLV | Diferenciador competitivo total |

---

## Licencia

Proyecto privado — Agroecotopia.
