# AGENTS.md — Agroecotopia

This file governs all AI agent behavior in this codebase. Every agent (Copilot, Cursor, Claude, opencode, etc.) **MUST** read and follow these rules before touching any file. These are not suggestions — they are architectural law. Violations will produce code that fails code review.

---

## Stack at a Glance

| Concern | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + class-variance-authority + tailwind-merge + framer-motion |
| Async state | @tanstack/react-query v5 |
| Sync state | React Context API |
| Components | shadcn/ui (Radix UI primitives + lucide-react icons + sonner toasts) |
| Forms | react-hook-form + @hookform/resolvers + zod v4 |
| Auth | NextAuth.js v5 Beta + @auth/prisma-adapter |
| Database | PostgreSQL + Prisma ORM v6 (prismaSchemaFolder, 16 schema files) |
| Real-time | Socket.IO v4.8 (server) + socket.io-client v4.8 (client) |
| Server | Custom `server.ts` (Next.js + Socket.IO on one port, via `tsx`) |
| Cache | Redis via ioredis (singleton + health check + graceful fallback) |
| E2EE | tweetnacl (Curve25519 + XSalsa20-Poly1305) + IndexedDB (idb) |
| Payments | Modular Factory/Strategy pattern (6 methods: advisor, mercadopago, nequi, pse, wompi, crypto) |
| AI | DeepSeek / OpenAI / Ollama providers with RAG, vision, moderation, forecasting |
| Embeddings | pgvector (4096d) via generic `EmbeddingRepository` + `EmbeddingService` |
| Rate limiting | rate-limiter-flexible |
| Logging | Centralized Logger (auto file detection via stack trace, no console.*) |

---

## Layered Architecture — The Only Allowed Dependency Direction

```
UI (pages & components)
  ↓
CTRL (Server Actions — .actions.ts)
  ↓
SVC (Business Logic — .service.ts)
  ↓
REPO (Data Access — .repository.ts)
  ↓
CACHE (Redis — CacheService)
  ↓
DB (Prisma / PostgreSQL)
```

**Every layer may only import from the layer directly below it.** Cross-layer imports are a hard violation:

- UI must not import Prisma, repositories, or services directly.
- Controllers must not call repositories directly.
- Services must not call CacheService directly — only repositories do.
- CacheService is injected into repositories via constructor, never into services or UI.
- UI components must never call Server Actions for data fetching — the parent `page.tsx` fetches and passes data/callbacks as props.

---

## Directory Map

```
src/
├── app/                            — Pages, layouts, API routes (App Router)
│   ├── api/v1/                     — External API Route Handlers
│   └── (routes)/                   — login, products, checkout, admin, etc.
├── backend/
│   ├── cache/                      — Redis cache layer
│   │   ├── index.ts                — Barrel: CacheService, CacheKeys, isRedisAvailable
│   │   ├── client.ts               — Singleton Redis client (ioredis, globalThis + process)
│   │   ├── cache.service.ts        — get, set, del, delPattern, getOrSet (Cache-Aside)
│   │   ├── key-builder.ts          — CacheKeys (product, order, envio, forum, etc.)
│   │   └── types.ts                — CacheOptions, CacheValue
│   ├── db/                         — Prisma singleton (globalThis + process dual storage)
│   ├── modules/                    — Domain modules (18 domains)
│   │   ├── [domain]/
│   │   │   ├── index.ts            — IoC: instantiate repo + service + cache
│   │   │   ├── [domain].actions.ts — CTRL layer ("use server")
│   │   │   ├── [domain].service.ts — SVC layer
│   │   │   └── [domain].repository.ts — REPO layer (CacheService injected)
│   │   ├── shared/embedding/       — Generic pgvector infrastructure
│   │   └── stockGuardian/          — Distributed stock concurrency control
│   └── prisma/schema/              — 16 domain-split Prisma schema files
├── frontend/
│   ├── components/
│   │   ├── ui/                     — shadcn primitives (Button, Card, Dialog, etc.)
│   │   ├── ai/                     — AI components (Dumb, props-only)
│   │   └── [domain]/               — Domain-specific UI
│   │       └── schemas/            — Zod validation schemas (standalone files)
│   ├── context/                    — React Context providers
│   ├── hooks/                      — Custom React hooks
│   └── architecture/languages/     — i18n configs and translations (es / en)
├── lib/                            — Auth guards, rate-limit, validations
├── types/                          — Centralized TypeScript types
├── utils/                          — Logger, eventBus, PaymentsMethods/
└── config/config.ts                — Single source for all env vars (frozen object)
```

---

## Rules Every Agent Must Follow

### 1. Never Use `console.log`

Import the centralized logger and create a child instance at module scope:

```typescript
import logger from "@/utils/logger";
const log = logger.child();
```

The `child()` call auto-detects the caller file path from the stack trace. Then use `log.info`, `log.warn`, `log.error`, `log.debug`. Never use `console.*` anywhere in application code.

### 2. Data Source Tagging in Logs

Every log line that relates to data loading must start with `[cache]` or `[db]`:

```typescript
log.debug("[cache] HIT: cache:product:id:prod_001");
log.debug("[cache] MISS: cache:product:list:0:20 — fetching from [db]");
log.debug("[db] Querying product by id:", { id });
log.info("[db] Creating new product:", { name: data.name });
```

### 3. Never Use `process.env` Directly

All environment variables are accessed through `src/config/config.ts`. Never write `process.env.WHATEVER` in application code. Use `config.*` or `getRequiredConfig()` for required values.

### 4. Server Actions Must Be Protected

All Server Actions mutating data must be wrapped with auth guards from `src/lib/auth-guards.ts`. Six guards are available:

| Guard | Use Case |
|---|---|
| `withAuth(action)` | Any authenticated user |
| `withAdmin(action)` | Admin-only operations |
| `withSeller(action)` | Seller-only operations |
| `withAdminOrSeller(action)` | Admin or seller |
| `withStoreOwner(storeId, action)` | Admin OR store owner (dynamic ownership check) |
| `validateSessionHealth()` | Returns boolean — session health check |

All guards pass a typed `GuardSession` object (`{ user: { id, role, name, email } }`) to the callback. Never implement manual role checks inside actions.

```typescript
"use server";
import { withAdmin } from "@/lib/auth-guards";

export const deleteProduct = withAdmin(async (session, id: string) => {
  // session.user.id, session.user.role available
});
```

### 5. Components Are Dumb — Pages Fetch

UI components under `src/frontend/components/` must never call Server Actions for data fetching or call Prisma directly. They receive data and callbacks as props. The parent `page.tsx` (Server or Client Component) is responsible for all data fetching and passing results down.

**Exceptions**: Event handlers like `onSubmit` that call mutations via Server Actions are allowed — the callback is passed down as a prop from the page.

### 6. Forms Must Prevent Double Submission

Every form submission handler must:
1. Track `isSubmitting` state (or use react-hook-form's built-in `formState.isSubmitting`).
2. Return early if already submitting.
3. Set `isSubmitting = true` before the async call, reset in `finally`.
4. Disable the submit button with `disabled={isSubmitting}` and provide visual feedback.

### 7. Zod Schemas Live in Their Own Files

Validation schemas must be placed in `src/frontend/components/[domain]/schemas/[name].schema.ts`. They must never be inlined inside component files. For i18n, export a **factory function** receiving the `t` translations object that returns the schema instance. Also export the inferred TypeScript type.

```typescript
// src/frontend/components/products/schemas/product.schema.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
```

### 8. No Polling — Use the Event Bus

`setInterval`-based polling is forbidden. All real-time data refresh must use the global `eventBus` (`src/utils/eventBus.ts`) on the server side and `useSocketRefresh()` on the client. Never emit Socket.IO events directly from services or actions — emit to `eventBus` and let `socketHandler.ts` bridge them.

### 9. Real-Time Events Must Be Room-Scoped

Never use `io.emit()` for events that belong to a specific user or entity. Always scope to a room by injecting `_room` into the event payload:

```typescript
eventBus.emit("order:status_updated", {
  pedidoId: id,
  estado: newState,
  _room: `order:${id}`,
});
```

The Auto-Bridge in `socketHandler.ts` will route it automatically. Available room types: `conversation_{id}`, `forum:post:{id}`, `order:{id}`, `user:{userId}:notifications`.

### 10. AI Module Logs Require the 🤖 Emoji

Every `log.*` call inside `src/backend/modules/ai/` must begin with `🤖`:

```typescript
log.info("🤖 [DeepSeek] Chat completed", { tokens, elapsed });
log.warn("🤖 [AI] Module unavailable. Check config.");
```

No exceptions. This applies to all files under `ai/` including providers, RAG, moderation, vision, and forecasting submodules.

### 11. No Direct Browser Interaction for Testing

Agents must not open browsers, click UI, or verify behavior through visual inspection. Implement the code, then wait for the developer to test and report back.

### 12. Prisma Enum Changes Must Sync to `src/types/`

The files in `src/types/` contain hand-maintained mirrors of Prisma enums (`as const` objects + `keyof typeof` types). Whenever a Prisma schema enum is modified (value added, renamed, or removed), the corresponding type file **must** be updated in the same PR/commit.

The source Prisma schema is annotated in a comment at the top of each type file. Every agent changing a `.prisma` enum MUST:

1. Identify which type file mirrors it (check the source comment).
2. Update the `as const` object and the inferred type in lockstep.
3. Run `tsc --noEmit` to verify consistency.

Failure to sync will cause silent runtime bugs when runtime code uses the stale `const` object to construct values that Prisma rejects.

---



## Creating a New Domain Module

Follow this exact sequence — never skip a step:

1. Create `src/backend/modules/[domain]/[domain].repository.ts`
2. Create `src/backend/modules/[domain]/[domain].service.ts`
3. Create `src/backend/modules/[domain]/[domain].actions.ts` (with `"use server"` + auth guards)
4. Create `src/backend/modules/[domain]/index.ts` — IoC wiring:

```typescript
import { DomainRepository } from "./domain.repository";
import { DomainService } from "./domain.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const domainRepository = new DomainRepository(cacheService);
export const domainService = new DomainService(domainRepository);
```

If the module has read-heavy operations, integrate `CacheService` in the repository (see Caching Rules below).

**Active domain modules (18):** ai, auth, bodega, chat, envio, forum, notifications, orders, payments, product, promotion, shipping, shared/embedding, stats, stockGuardian, store, user

---

## Caching Rules (Redis / CacheService)

### Architecture

```
Service Layer (SVC) → No sabe que existe caché
    ↓
Repository Layer (REPO) → CacheService inyectado vía constructor
    ↓
  ┌────────────────┬──────────────────┐
  │ Redis (Cache)  │ Prisma (DB)      │
  │ TTLs (30-300s) │ Source of Truth  │
  └────────────────┴──────────────────┘
```

### CacheService API

| Method | Signature | Behavior When Redis Unavailable |
|---|---|---|
| `get` | `get<T>(key): Promise<T \| null>` | Returns `null` |
| `set` | `set<T>(key, value, ttl?): Promise<void>` | No-op |
| `del` | `del(key): Promise<void>` | No-op |
| `delPattern` | `delPattern(pattern): Promise<void>` | SCAN + DEL by glob pattern, no-op if unavailable |
| `getOrSet` | `getOrSet<T>(key, fetcher, ttl?): Promise<T>` | Executes `fetcher()` directly (bypasses cache) |

### Cache-Aside Pattern (STRICT LAW)

**All READ methods** must use `cacheService?.getOrSet()`:

```typescript
async getProductById(id: string) {
  const key = CacheKeys.product.byId(id);
  return this.cacheService?.getOrSet(
    key,
    () => prisma.product.findUnique({ where: { id } }),
    config.cache.ttl.productDetail,
  ) ?? null;
}
```

**All WRITE methods** must invalidate the full domain pattern:

```typescript
async updateProduct(id: string, data: UpdateProductDto) {
  const product = await prisma.product.update({ where: { id }, data });
  await this.cacheService?.delPattern(CacheKeys.product.allPattern);
  return product;
}
```

### Key Naming Convention

```
cache:{domain}:{entity}:{identifier}
```

| Key Builder | Pattern | Example |
|---|---|---|
| `CacheKeys.product.byId(id)` | `cache:product:id:{id}` | `cache:product:id:prod_001` |
| `CacheKeys.product.list(skip, take, cats, store)` | `cache:product:list:{skip}:{take}:{hash}` | `cache:product:list:0:20:a1b2` |
| `CacheKeys.product.categories` | `cache:product:categories` | — |
| `CacheKeys.product.allPattern` | `cache:product:*` | Used for invalidation |
| `CacheKeys.order.byId(id)` | `cache:order:id:{id}` | — |
| `CacheKeys.order.byUser(userId)` | `cache:order:user:{userId}` | — |
| `CacheKeys.order.allPattern` | `cache:order:*` | Used for invalidation |
| `CacheKeys.forum.post(id)` | `cache:forum:post:{id}` | — |
| `CacheKeys.forum.allPattern` | `cache:forum:*` | Used for invalidation |
| `CacheKeys.envio.byId(id)` | `cache:envio:id:{id}` | — |
| `CacheKeys.envio.allPattern` | `cache:envio:*` | Used for invalidation |

### IoC Injection Pattern

The `CacheService` is always declared optional in the repository constructor:

```typescript
constructor(private cacheService?: CacheService) {}
```

This enables graceful degradation — the module works without Redis. Use optional chaining: `this.cacheService?.getOrSet(...)`.

### TTL Strategy

| Data Type | TTL | Change Frequency |
|---|---|---|
| Product/Order lists | 60s | High |
| Product/Order detail | 120s | Medium |
| Categories | 300s (5 min) | Very low |
| Community stats | 300s | Very low |
| Search results | 60s | High |
| Stock locks | 5s | Real-time |

All defined in `config.cache.ttl.*`.

---

## Database Architecture (Prisma Multi-Schema)

Uses the `prismaSchemaFolder` preview feature. **16 schema files** in `src/backend/prisma/schema/`:

| File | Key Models | Key Enums |
|---|---|---|
| `schema.prisma` | Generator + datasource (PostgreSQL) | — |
| `auth.model.prisma` | `User`, `Account`, `Session`, `VerificationToken` | `Role: admin, user, seller` |
| `product.model.prisma` | `Product` (has storeId, categories M:N) | — |
| `order.model.prisma` | `Pedido`, `DetallePedido`, `Bodega` | `PedidoEstado: PENDIENTE, CONFIRMADO, EN_PREPARACION, EN_CAMINO, EN_BODEGA, ENTREGADO, CANCELADO`; `TipoEntrega: ENVIO, RECOJO_EN_BODEGA` |
| `store.model.prisma` | `Store`, `StoreRequest`, `StoreTax`, `StoreConfig` | `StoreStatus: ACTIVE, SUSPENDED, CLOSED`; `StoreRequestStatus: PENDING, APPROVED, REJECTED` |
| `notification.model.prisma` | `DomainEvent`, `Notification`, `NotificationRecipient`, `Group`, `GroupMember` | `AudienceType: INDIVIDUAL, GROUP, BROADCAST`; `RecipientStatus: PENDING, DELIVERED, READ` |
| `chat.model.prisma` | `Conversation`, `Message` | `ConversationType: SUPPORT, ORDER` |
| `envio.model.prisma` | `Envio`, `EnvioEvento` | `EnvioEstado: PREPARANDO, DESPACHADO, EN_TRANSITO, EN_REPARTO, ENTREGADO, FALLIDO, DEVUELTO` |
| `shipping.model.prisma` | `StoreShippingZone`, `StoreShippingRate` | `TipoTarifaEnvio: TARIFA_FIJA, POR_PESO` |
| `promotion.model.prisma` | `Promotion` | `DiscountType: PERCENTAGE, FIXED_AMOUNT`; `PromotionScope: ENTIRE_STORE, SPECIFIC_PRODUCTS, SINGLE_PRODUCT` |
| `categoria.model.prisma` | `Categoria` | — |
| `forum.model.prisma` | `ForumPost`, `ForumAnswer`, `ForumRating` | — |
| `e2ee.model.prisma` | `E2EEDevice`, `E2EEPreKey` | — |
| `cryptocurrency.model.prisma` | `Cryptocurrency` | — |
| `productEmbedding.model.prisma` | `ProductEmbedding` (`vector(4096)`) | — |
| `forumPostEmbedding.model.prisma` | `ForumPostEmbedding` (`vector(4096)`) | — |

---

## Stock Guardian — Distributed Concurrency Control

Stock is **not decremented when an order is created**. It is only decremented on `PENDIENTE → CONFIRMADO` transition. This is the sole point of race condition resolution.

The `StockGuardianService` (`src/backend/modules/stockGuardian/`) implements a **three-layer defense**:

### Layer 1 — Distributed Locks (Redis SET NX EX)
- Sorts product IDs alphabetically to prevent deadlocks.
- `SET lock:stock:{productId} <UUID> EX 5 NX` per product.
- Retries up to 3 times with 200ms exponential backoff.
- Falls through to DB if Redis unavailable.

### Layer 2 — Atomic Check + Decrement (Lua Script)
- Lua script iterates `KEYS`, checks each `stock:master:{productId}` >= ARGV quantity.
- Atomic `DECRBY` all if check passes.
- **Redis is the guardian, DB is the source of truth.**

### Layer 3 — PostgreSQL Safety Net
- Repository's `updateStock` uses `WHERE stock >= qty` to prevent overselling at DB level.
- Final safety net if Redis is unavailable.

**Key patterns:** `stock:master:{productId}` (master stock), `lock:stock:{productId}` (distributed lock), `lock:confirm:{pedidoId}` (prevent double confirm).

---

## Event-Driven Data Refresh (Zero-Polling Rule)

### Server Side — `eventBus`
- Services and Actions emit domain events via `eventBus` (`src/utils/eventBus.ts`):
  ```typescript
  import eventBus from "@/utils/eventBus";
  eventBus.emit("order:created", { pedidoId, storeId, ownerId, _room: `order:${pedidoId}` });
  ```
- Services/Actions must **never** interact with Socket.IO directly. Only `socketHandler.ts` bridges events.

### Client Side — `useSocketRefresh`
- Subscribes to socket events and calls a `refresh` callback when they fire.
- **Does NOT call `refresh` on mount** — consumers handle initial data loading via `useEffect`.
- Wrap the `refresh` callback in `useCallback` to prevent infinite loops.

```tsx
const loadData = useCallback(async () => {
  const data = await getDashboardData();
  setData(data);
}, []);

useEffect(() => { loadData(); }, [loadData]);

useSocketRefresh({
  socket,
  enabled: true,
  refresh: loadData,
  events: ["order:created", "order:status_updated"],
});
```

### Auto-Bridge Genérico (socketHandler.ts)

Events listed in `BRIDGE_EVENTS` are auto-wired via `eventBus.on()` + `io.emit()`. If the payload contains `_room`, it's room-scoped (`io.to(room).emit()`); otherwise global (`io.emit()`).

**Current BRIDGE_EVENTS:** `store_request_updated`, `unread_count_updated`, `forum:post_created`, `forum:answer_created`, `forum:answer_edited`, `forum:answer_deleted`, `forum:post_updated`, `forum:post_deleted`, `forum:answer_accepted`, `forum:item_rated`, `order:created`, `product:stock_updated`, `order:status_updated`, `order:status_updated_user`, `envio:created`, `envio:status_updated`, `notification_read_state_changed`

To add a new real-time event:
1. Add event name to `BRIDGE_EVENTS` array in `socketHandler.ts`.
2. Emit from service/action via `eventBus.emit("name", payload)`.
3. Optionally include `_room` for room-scoped delivery.
4. On the client, join the room and use `useSocketRefresh()`.

---

## Notifications — Event-Driven System

### Dispatching Rule

Whenever a business event requires notifying users, **always** use `notificationsService.dispatchNotification()`. Never write directly to the `Notification` table.

### Dispatch Pipeline

1. Create immutable `DomainEvent` (audit log).
2. Create `Notification` (logical unit linked to event).
3. Resolve audience via `AudienceResolver`:
   - `INDIVIDUAL` → `[audienceRef]` (single user).
   - `GROUP` → All member IDs from group.
   - `BROADCAST` → Empty array (**lazy materialization** — no recipients created; notifications merged at query time).
4. Exclude actor (no self-notification).
5. Create `NotificationRecipient` rows (bulk insert; skipped for BROADCAST).
6. Emit via `eventBus` to Socket.IO bridge.

### DispatchNotificationParams

```typescript
{
  eventType: string;        // e.g., "order_created"
  actorId: string;          // Who triggered it
  entityType: string;       // e.g., "Pedido"
  entityId: string;
  payload?: Record<string, unknown>;
  notification: {
    type: string;
    title: string;
    message: string;
    audienceType: "INDIVIDUAL" | "GROUP" | "BROADCAST";
    audienceRef?: string;
    metadata?: { actionUrl?: string };  // Required for interactive navigation
  };
}
```

Notifications that route users **must** include `metadata.actionUrl`.

---

## Payment Methods — Modular Factory/Strategy Pattern

Every payment integration lives in `src/utils/PaymentsMethods/[payment_id]/`.

### Directory Structure per Method

```
[payment_id]/
├── config.ts     — Visual UI metadata (implements PaymentMethodConfig)
├── handler.ts    — Logic class (implements PaymentHandler with process method)
└── index.ts      — Barrel export
```

### PaymentMethodConfig

```typescript
interface PaymentMethodConfig {
  id: "advisor" | "mercadopago" | "nequi" | "pse" | "wompi" | "crypto";
  icon: LucideIcon;
  color: string;
  bgColor: string;
  labelKey: keyof Translations["checkout"];
  isMute: boolean;  // true = disabled/fallback handler
}
```

### PaymentHandler

```typescript
interface PaymentHandler {
  process(context: PaymentHandlerContext): Promise<void>;
}
```

### Factory Usage

```typescript
import { PaymentHandlerFactory } from "@/utils/PaymentsMethods";

const handler = PaymentHandlerFactory.getHandler("mercadopago");
await handler.process(context);
```

**SOLID Open-Closed Principle:** The Checkout Page interacts only with `PaymentHandlerFactory.getHandler(methodId)`. It must never contain `if/else` branching for payment types. Disabled methods use a "Mute" fallback handler.

**Active methods (in PAYMENT_METHODS array):** advisor, mercadopago, crypto. Nequi, PSE, Wompi exist but have `isMute: true` (disabled).

---

## Real-Time Chat System

### Architecture
- **1-to-1 support model**: each user has one conversation.
- **Conversation** model: one per user (`userId @unique`).
- **Message** model: belongs to Conversation, tracks `senderRole` (user/admin), `isRead`, optional E2EE fields.

### Socket Events

**Client → Server:** `join_room`, `leave_room`, `typing`, `send_message`, `delete_conversation`, `request_key_sync`, `join_post`, `leave_post`, `join_order`, `leave_order`, `join_notifications`, `leave_notifications`

**Server → Client:** `receive_message`, `new_message_notification`, `user_typing`, `conversation_deleted`, `key_sync_needed`, `chat_error`, plus all bridged domain events

### E2EE Encryption (TweetNaCl.js)
- Key agreement: Curve25519 (X25519 `nacl.box.keyPair()`)
- Symmetric encryption: XSalsa20-Poly1305 (`nacl.box()`)
- Identity keys: Ed25519 (`nacl.sign.keyPair()`)
- **Self-Healing Recovery:** Private keys are escrowed on the server (`/api/chat/e2ee/register`). If IndexedDB is empty (new browser, incognito), the client auto-recovery fetches keys from `/api/chat/e2ee/bundle/{userId}` (security-gated by `isSelf` check).
- **One-Time PreKeys:** 20 prekeys generated on registration for asynchronous offline key agreement (Perfect Forward Secrecy).
- **Global toggle:** Controlled by `config.chat.enableE2EE` (`NEXT_PUBLIC_ENABLE_E2EE` env var). When disabled, messages are sent in plaintext (`type: 0`). When enabled, message delivery blocks until `isE2EEReady`.

### Provider Tree

```
SessionProvider (basePath: /api/v1/auth)
  → ThemeProvider (next-themes, class, defaultTheme: light)
    → LanguageProvider (es/en)
      → QueryClientProvider (@tanstack/react-query)
        → CartProvider
          → SocketProvider (socket.io-client, connects to window.location.origin)
            → NotificationProvider (with injected actions)
              → TooltipProvider (Radix UI)
                → ScrollToAnchor, PageFocusTracker, AppChromeData
                → {children}
                → Sonner (toast notifications)
```

---

## AI Module

### Architecture
- **Provider Factory:** Supports DeepSeek, OpenAI, Ollama. Configured via `AI_PROVIDER` env var.
- **RAG Service:** Retrievers for forum posts, products, and platform content. Uses pgvector semantic search.
- **Features:** Semantic search, chatbot, vision, moderation, translation, demand forecasting, pricing.
- All feature-gated by `config.ai.features.*` env vars.
- **Logging:** All logs must start with `🤖` emoji (rule 10).

### Activation Checklist

Before enabling AI:
- [ ] `AI_ENABLED=true`
- [ ] `AI_PROVIDER` set to `deepseek`, `openai`, or `ollama`
- [ ] Provider-specific env vars configured (e.g., `OLLAMA_BASE_URL`, `DEEPSEEK_API_KEY`)
- [ ] Feature flags in `config.ai.features.*` set as needed
- [ ] Embedding dimensions match schema (`vector(4096)`)

### Provider Types
```typescript
interface AIProvider {
  name: ProviderName;
  availableFeatures: AIFeature[];
  embed(text: string): Promise<{ embedding: number[] }>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  isAvailable(): Promise<boolean>;
}
```

---

## Embedding Infrastructure (pgvector)

### Shared Generic Module (`src/backend/modules/shared/embedding/`)

```typescript
EmbeddingRepository  — Table-agnostic (constructor: tableName, entityIdColumn)
  → upsert(entityId, embedding)       — INSERT ... ON CONFLICT DO UPDATE
  → delete(entityId)
  → findByEntityId(entityId)
  → searchSimilar(embedding, limit, minSimilarity)  — Raw SQL with <=> cosine distance

EmbeddingService  — Provider-agnostic (constructor: repository, provider, options)
  → generateForEntity(entityId, text)
  → generateAll(fetchPending)         — Batch process pending
  → searchSimilar(query, limit, minSimilarity)  — embed query + search
  → isAvailable()                     — Cached check (60s TTL)
```

### Domain-Specific Wrappers
- `ProductEmbeddingService` — builds text from name, description, tag, categories.
- `ForumPostEmbeddingService` — builds text from title, body, labels.

---

## Server Startup

The app does **not** use `next dev` or `next start`. It runs via:

```bash
tsx server.ts   # dev and production
```

`server.ts` creates a single HTTP server that:
1. Applies rate limiting middleware on every request.
2. Delegates HTTP to the Next.js request handler.
3. Mounts Socket.IO on the **same** HTTP server.
4. On boot: runs `ensureAdminExists()`, `initializeStockMaster()` (syncs stock to Redis).

Rate limiting uses `rate-limiter-flexible`. Socket.IO rate limiter is applied per `socket.id` on `send_message`.

---

## Types Directory (`src/types/`)

| File | Content |
|---|---|
| `auth.types.ts` | `AuthMode = "login" \| "register"`, `FormField` |
| `cart.ts` | `CartItem`, `CartContextType` |
| `product.ts` | `Product` interface |
| `orders.ts` | `PedidoEstado` const + type |
| `store.ts` | `Store`, `StoreRequest`, `StoreCreateInput` |
| `notification.types.ts` | `AudienceType`, `RecipientStatus`, `DispatchNotificationParams`, `NotificationDetail`, `VirtualBroadcastNotification` |
| `next-auth.d.ts` | Module augmentation for `next-auth` (adds `role` to `Session.user` and `JWT`) |
| `index.ts` | Barrel re-exports |

---

## Internationalization

- Supports Spanish (`es`) and English (`en`) via `LanguageContext`.
- Translation files in `src/frontend/architecture/languages/`.
- All user-facing strings **must** use the `t` object from `useLanguage()`:
  ```tsx
  const { t, language, setLanguage } = useLanguage();
  // Use t.checkout.paymentOptionMercadoPago
  ```
- Hardcoded user-facing strings are a violation.

---

## Centralized Configuration

All environment variables accessed through `src/config/config.ts`:

```typescript
export const config = {
  env, isProduction, isDevelopment, isTest,
  enableLogging, logLevel,
  app: { name, url, port },
  websocket: { url },
  auth: { secret, trustHost, google: { clientId, clientSecret }, admin: { email, password } },
  database: { url, directUrl },
  mercadopago: { accessToken, webhookSecret },
  cache: { redisUrl, enabled, defaultTTL: 60, ttl: { productList: 60, productDetail: 120, categories: 300, ... } },
  chat: { enableE2EE: true },
  forum: { rules, labels, validation },
  marketplace: { maxProductsPerStore: 50, maxStoresPerUser: 5 },
  ai: { enabled, provider, models, features },
  ollama: { baseUrl, embeddingModel, timeout },
  embedding: { dimensions: 4096, batchSize: 10 },
} as const;
```

**Never use `process.env.*` directly.** Use `config.*` or `getRequiredConfig(value, name)`.

---

## Quick Violation Checklist

Before submitting any change, verify none of the following are present:

- [ ] `console.log` / `console.warn` / `console.error` anywhere in app code
- [ ] `process.env.*` used directly outside `src/config/config.ts`
- [ ] A UI component calling a Server Action for fetching data directly
- [ ] A UI component importing Prisma or a repository
- [ ] A service or action importing `CacheService`
- [ ] A cross-layer import (e.g., Controller → Repository, Service → Cache)
- [ ] A Zod schema defined inline inside a component file (must be standalone in `schemas/`)
- [ ] A form without double-submit protection
- [ ] `io.emit()` used for a user- or entity-specific event (must use `_room`)
- [ ] `setInterval` used for data refresh (use `useSocketRefresh` instead)
- [ ] A new backend domain module missing its `index.ts` IoC file
- [ ] A log inside `src/backend/modules/ai/` missing the `🤖` emoji
- [ ] Stock decremented at order creation time (only allowed at `CONFIRMADO` transition)
- [ ] A hardcoded user-facing string (must use `t` from `useLanguage()`)
- [ ] A Server Action mutating data without an auth guard (`withAuth`, `withAdmin`, etc.)
- [ ] A service or action emitting Socket.IO events directly (must use `eventBus`)
- [ ] A broadcast notification without considering lazy materialization (BROADCAST uses O(1) dispatch)
- [ ] A prisma query not wrapped in `CacheService.getOrSet()` for read-heavy repository methods
- [ ] A write method in a cached repository missing `delPattern()` invalidation
- [ ] A payment method added without the full `config.ts` + `handler.ts` + `index.ts` structure
- [ ] `server.ts` modified to use `next dev` or `next start` instead of `tsx server.ts`
