---
name: developer
description: Project specifications and architectural guidelines for maintaining integrity and consistent code structure.
---

# Project Architecture & Developer Guidelines (Leyes de Arquitectura)

This skill defines the technical standards and architectural patterns for the **Agroecotopia** project. All developers (human and AI) MUST strictly follow these guidelines. These rules are **LAW** and must not be bypassed under any circumstances to ensure a professional, 10/10 architecture.

## 1. Core Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first) + framer-motion.
- **State Management**: `@tanstack/react-query` (Async state) + React Context API (Sync state).
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (base) + Radix UI + Custom Components.
- **Auth**: NextAuth.js (v5 Beta) + `@auth/prisma-adapter`.
- **Database**: PostgreSQL + Prisma ORM (`@prisma/client`, `prismaSchemaFolder` preview feature).
- **Real-time**: [Socket.IO](https://socket.io/) v4.8 (`socket.io` + `socket.io-client`).
- **Server**: Custom `server.ts` — Monolithic HTTP server unifying Next.js + Socket.IO on a single port (runs via `tsx`).
- **Cache Distribuido**: Redis via `ioredis` (Singleton con `globalThis` + health check + graceful fallback). Capa de caché desacoplada en `src/backend/cache/`.

---

## 2. Layered Modular Architecture (Next.js + Hexagonal)

The project follows a strict **modular layered architecture**. The backend is encapsulated inside `src/backend/modules/[domain]/` to enforce separation of concerns. Each layer has a single responsibility and can **only call the layer immediately below it**.

### 2.1 Layer Overview

```
┌─────────────────────────────────────────────────────┐
│  UI   │  Components & Pages (React/Next.js)         │
├───────┼─────────────────────────────────────────────┤
│  CTRL │  Server Actions (`.actions.ts`)             │
├───────┼─────────────────────────────────────────────┤
│  SVC  │  Business Logic (`.service.ts`)             │
├───────┼─────────────────────────────────────────────┤
│  REPO │  Data Access (`.repository.ts`)             │
├───────┼─────────────────────────────────────────────┤
│ CACHE │  Redis Cache Layer (`CacheService`)         │
├───────┼─────────────────────────────────────────────┤
│  DB   │  Infrastructure (Prisma DB)                 │
└───────┴─────────────────────────────────────────────┘
```

### 2.2 Layer Details & File Locations

| Layer | Path | Naming Convention | Description |
|-------|------|-------------------|-------------|
| **UI** | `src/app/`, `src/frontend/components/` | `page.tsx`, `PascalCase.tsx` | Pages, layouts, and React components. |
| **Controller** | `src/backend/modules/[domain]/` | `[domain].actions.ts` | Server Actions (Transport layer). Exposed to UI. |
| **Service** | `src/backend/modules/[domain]/` | `[domain].service.ts` | Pure business logic. Agnostic of Next.js HTTP/Actions. |
| **Repository** | `src/backend/modules/[domain]/` | `[domain].repository.ts` | Data access (Prisma queries + caching via `CacheService`). |
| **Cache** | `src/backend/cache/` | `cache.service.ts`, `client.ts` | Redis caching layer. Used exclusively by Repository layer. Graceful fallback si Redis no está disponible. |
| **Database** | `src/backend/prisma/`, `src/backend/db/` | `schema.prisma` | DB schemas and client instances. |

### 2.3 Dependency Rules (STRICT LAW)

> [!CAUTION]
> **NEVER violate the dependency direction.** Each layer can ONLY import from the layer directly below it:
> - `UI` (Client/Server Components) → `CTRL` (Server Actions)
> - `CTRL` (Server Actions) → `SVC` (Business Logic)
> - `SVC` → `REPO` (Data Access)
> - `REPO` → `CACHE` (Redis Cache Layer)
> - `CACHE` → `DB` (Prisma)
> - `REPO` → `DB` (Prisma, cache miss o Redis no disponible)
>
> **BOUNDARY RESTRICTION RULE**: Cross-layer imports (e.g., `UI` → `REPO`, `CTRL` → `REPO`, `SVC` → `CACHE`) are **strictly forbidden**. UI components MUST NOT import Prisma clients or perform DB queries directly. El `CacheService` solo se inyecta en los Repositorios, nunca en Services o Controllers. 
> 
> **PAGE PARENT DATA FETCHING RULE (DUMB COMPONENTS)**: Nunca, pero nunca, se accede a recursos del backend (Server Actions para fetching de datos o mutaciones) directamente desde componentes hijos (`src/frontend/components/`). Los componentes UI siempre deben ser **Dumb Components** (Componentes Tontos / Presentacionales). El acceso al backend y la lógica de estado DEBE realizarse siempre a través del componente Page Padre (`page.tsx`), quien se encarga de realizar las llamadas y pasar la información (data) y las acciones (callbacks) como `props` a estos componentes hijos.

---

## 3. Directory Structure

```text
src/
├── app/                          ← UI (App Router: pages & layouts)
│   ├── api/                      ← External API Route Handlers (v1)
│   ├── (routes)/                 ← (login, products, checkout, etc.)
│
├── backend/                      ← Encapsulated Backend Architecture
│   ├── cache/                    ← Redis Cache Layer (Distributed Cache System)
│   │   ├── index.ts              ← Barrel exports (CacheService, CacheKeys, isRedisAvailable)
│   │   ├── client.ts             ← Redis singleton con health check + graceful fallback
│   │   ├── cache.service.ts      ← CacheService (get, set, del, delPattern, getOrSet)
│   │   ├── key-builder.ts        ← CacheKeys con naming convention y hashing de filtros
│   │   └── types.ts              ← Tipos compartidos (CacheOptions, CacheValue)
│   ├── db/                       ← DB Clients (e.g., Prisma singleton)
│   ├── modules/                  ← Domain Modules (auth, product, user, etc.)
│   │   └── [domain]/             
│   │       ├── index.ts          ← IoC: instancia Repository + Service + CacheService
│   │       ├── [domain].actions.ts      ← CTRL layer
│   │       ├── [domain].service.ts      ← SVC layer
│   │       └── [domain].repository.ts   ← REPO layer (usa CacheService inyectado)
│   └── prisma/                   ← Prisma schema and migrations
│
├── frontend/                     ← Encapsulated Frontend Architecture
│   ├── components/               ← UI (Shared & Feature Components)
│   │   ├── ui/                   ← shadcn / primitives
│   │   └── [domain]/             ← Domain specific UI (auth, products, checkout)
│   ├── context/                  ← React Context providers (sync state)
│   ├── hooks/                    ← Custom React hooks
│   ├── assets/                   ← Static assets
│   ├── architecture/             ← i18n and architectural configurations
│   └── styles/                   ← Global and component-specific styles
│
├── lib/                          ← Utility functions and guards (auth-guards.ts)
├── types/                        ← Centralized TypeScript types
└── utils/                        ← Constants & static data
```

---

## 4. Authentication & Security (Auth Guards)

The app uses `next-auth` (v5 Beta).

### RBAC & Server Action Security
- **Law**: Never trust client inputs. Protect all mutating Server Actions using **Auth Guards**.
- Use the utilities from `src/lib/auth-guards.ts` (e.g., `withAdmin`, `withAuth`) to wrap your Server Actions. 
- Do not perform role checks manually inside every action. Delegate to the auth guard to ensure DRY principles.

---

## 5. State Management & Data Fetching

- **Asynchronous State (Server Data)**: Always use `@tanstack/react-query` for fetching, caching, and synchronizing server data in client components.
- **Synchronous State (UI/Local)**: Use React Context (e.g., `CartContext`, `LanguageContext`) only for global synchronous UI state that doesn't originate directly from the database.
- **Real-time State**: Use Socket.IO via `useSocket()` from `SocketContext` for WebSocket-driven live data (chat messages, typing indicators, notifications).
- **Data Mutations**: Use Server Actions (`.actions.ts`) triggered either natively via form `action` or via React Query's `useMutation`.

---

## 6. Theme, Styling & UI

- The application uses `next-themes` (Light/Dark mode) and Tailwind CSS v4.
- Use `shadcn/ui` components from `src/frontend/components/ui/` as building blocks.
- **Premium Aesthetic Rule**: Do not create generic, simple MVPs. Use smooth gradients, hover effects, and `framer-motion` to maintain a professional, dynamic design.
- **Form Validation**: Always use `react-hook-form` coupled with `zod` (`@hookform/resolvers`) for robust form state and validation.
- **Standalone Validation Schemas (STRICT LAW)**: All Zod validation schemas MUST be defined in their own standalone files under `src/frontend/components/[domain]/schemas/` (e.g., `answer.schema.ts`, `post.schema.ts`). Schemas MUST NOT be inlined inside component files. For i18n support, export the schema as a **factory function** that accepts the `t` translations object and returns the schema instance. Also export the inferred TypeScript type for use with `useForm`. This ensures schemas are testable, reusable, auditable, and decoupled from component lifecycle.
- **Double-Submit Prevention (STRICT LAW)**: All forms and submission buttons MUST implement a loading state (e.g., `isSubmitting`) to prevent multiple rapid submissions (double-submit). You must:
  1. Have an `isSubmitting` state (or `isLoading` from react-query/form).
  2. Abort the submit handler early if `isSubmitting` is true.
  3. Set it to `true` before the async operation and use a `finally` block to reset it to `false`.
  4. Disable the submit button (`disabled={isSubmitting}`) and provide visual feedback (e.g., change text to "Guardando...", adjust opacity, change cursor).

---

## 7. Testing & Quality Assurance (Standard)

To maintain and scale a professional architecture:
- **Unit Testing**: Business logic inside `*.service.ts` must be built to be testable in isolation. 
- **Type Safety**: Avoid `any` types. Rely exclusively on Prisma-generated types or strictly defined Zod schemas.

---

## 8. Modular Payment Methods (Factory & Strategy Pattern)

To keep checkout logic completely decoupled and easily extensible, all payment integrations MUST follow the **Modular Strategy & Factory Pattern**. 

### 8.1 Directory & Submodule Layout
Every payment method is a self-contained module under `src/utils/PaymentsMethods/` consisting of:
- `config.ts`: Visual and UI configurations (`PaymentMethodConfig` interface).
- `handler.ts`: Core processing logic class implementing `PaymentHandler` (`process` method).
- `index.ts`: Barrel file exporting both configurations and handler classes.

```text
src/utils/PaymentsMethods/
├── types.ts          ← Central payment types & contexts
├── factory.ts        ← Factory class (PaymentHandlerFactory)
├── index.ts          ← Main index composing & exporting PAYMENT_METHODS array
└── [payment_id]/     ← Isolated submodule folder (e.g., advisor, mercadopago, wompi)
    ├── config.ts     ← Visual UI metadata
    ├── handler.ts    ← Execution logic class
    └── index.ts      ← Submodule exports barrel
```

### 8.2 Architectural Principles (STRICT LAW)
- **SOLID Open-Closed Principle (OCP)**: The Checkout Page (`src/app/checkout/page.tsx`) is closed to modifications when adding or changing payment methods. It MUST only interact with `PaymentHandlerFactory.getHandler(methodId)`.
- **Explicit Imports (Cache Protection)**: To prevent VSCode/Cursor TypeScript caching conflicts with deleted files, always use explicit path imports for configuration and handlers inside factory and main index (e.g., `import { AdvisorPaymentHandler } from "./advisor/handler"`).
- **Graceful Failure**: If a payment method is under construction or disabled, it should use a fallback "Mute" handler rather than breaking the build or containing if-else conditionals in the checkout UI.

---

## 9. Operational Rules

- **Browser Interaction**: Never interact directly with the browser to test or verify changes. Focus exclusively on the code implementation.
- **Verification**: Wait for the user to perform manual tests and provide feedback on the changes before proceeding with further adjustments.
- **New Modules**: When creating a new backend domain module, always follow the full pattern: `index.ts` (IoC) → `[domain].repository.ts` → `[domain].service.ts` → `[domain].actions.ts`. Si el módulo tiene operaciones de lectura intensivas, DEBE integrar `CacheService` en el Repository (ver [Sección 14 — Distributed Caching System](#14-distributed-caching-system-redis)).
- **Server Actions**: All Server Actions must be in files marked with `"use server"` at the top and wrapped with appropriate auth guards.
- **Centralized Logging (STRICT LAW)**: Never use `console.log`, `console.warn`, or `console.error` directly in the application code. Always import the centralized logger from `@/utils/logger` and instantiate a contextualized child logger at the top of the file simply using `const log = logger.child();`. The logger will automatically detect and extract the calling filename from the stack trace *exactly once* during module initialization (avoiding any performance overhead during log calls). Then, use this child logger (`log.info`, `log.warn`, `log.error`, `log.debug`, or `log.log`) to display all messages in the console. This guarantees maximum performance, absolute context transparency, and clean logging with zero hardcoded file names.

---

## 10. Custom `server.ts` — Monolithic Server Architecture

> [!CAUTION]
> The application does **NOT** use `next dev` or `next start`. It runs through a **custom TypeScript HTTP server** at the project root (`server.ts`) executed via `tsx`. This is the most important architectural decision in the project.

### 10.1 How It Works

`server.ts` creates a single HTTP server that:
1. Delegates all HTTP requests to the Next.js request handler (`app.getRequestHandler()`).
2. Mounts a Socket.IO server on the **same HTTP server** via `initSocketServer(httpServer, prisma)`.
3. Listens on a **single port** (3000 by default) for both HTTP and WebSocket traffic.

### 10.2 Why This Approach (Alternatives Rejected)

| Alternative | Why Rejected |
|---|---|
| Separate Socket.IO server (different port) | Requires CORS config, 2 processes, 2 ports, complex deployment |
| Next.js API Route for WebSockets | Not officially supported in App Router, unstable |
| **Custom `server.js`** ✅ | One process, one port, shared Prisma, simple deployment |

### 10.3 Scripts

```json
{
  "dev": "tsx server.ts",
  "build": "next build",
  "start": "tsx server.ts"
}
```

> [!IMPORTANT]
> The script `"chat-server": "node scripts/chat-server.js"` in `package.json` is a **legacy artifact** from the old separated architecture. It is NOT used. Do NOT reference it.

### 10.4 Prisma Dual-Instance Pattern

- **`server.ts`**: Creates its own `new PrismaClient()` and injects it into `initSocketServer(httpServer, prisma)` — used exclusively for WebSocket event persistence.
- **Server Actions / Service Layer**: Uses the singleton from `src/backend/db/prisma.ts` (with `globalThis` pattern).

Both instances connect to the same database.

---

## 11. Real-Time Chat System Architecture

The chat implements a **1-to-1 support model**: each user has exactly one conversation with the admin team.

### 11.1 Data Models (Prisma)

Defined in `src/backend/prisma/schema/chat.model.prisma`:

**`Conversation`** — One per user (`userId @unique`):

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Unique ID |
| `userId` | `String @unique` | **1 conversation per user** (1:1 relation) |
| `user` | `User` | Relation with `onDelete: Cascade` |
| `messages` | `Message[]` | All messages in the conversation |

**`Message`** — Belongs to a conversation:

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Unique ID |
| `content` | `String` | Message body |
| `senderId` | `String` | ID of sender (user or admin) |
| `senderRole` | `Role @default(user)` | Enum: `user` or `admin` |
| `conversationId` | `String` | FK to `Conversation` |
| `isRead` | `Boolean @default(false)` | Read status |

### 11.2 Socket Handler (`src/backend/modules/chat/socketHandler.ts`)

**Client → Server Events:**

| Event | Payload | Behavior |
|---|---|---|
| `join_room` | `{ conversationId }` | Socket joins room `conversation_{id}` |
| `leave_room` | `{ conversationId }` | Socket leaves room |
| `typing` | `{ conversationId, senderId, isTyping }` | Forwards `user_typing` to room (excludes sender) |
| `send_message` | `{ conversationId, content, senderId, senderRole }` | **Persists** message to DB via injected Prisma + broadcasts |
| `delete_conversation` | `{ conversationId }` | Emits `conversation_deleted` to room |

**Server → Client Events:**

| Event | Target | Description |
|---|---|---|
| `receive_message` | Room `conversation_{id}` | New message (emitted after DB persist) |
| `new_message_notification` | **GLOBAL** (`io.emit`) | Notifies ALL clients (used by admin panel + navbar badge) |
| `user_typing` | Room (excluding sender) | Typing status |
| `conversation_deleted` | Room `conversation_{id}` | Conversation was deleted |
| `error` | Sender socket only | Error sending message |

**Critical Design Decisions:**
- **Persistence in socket handler**: Messages are created inside the socket handler using the injected Prisma client, NOT through Server Actions. Server Actions handle only reads and conversation management (create, delete, mark as read).
- **Dual Emission on `send_message`**: Emits `receive_message` to the room AND `new_message_notification` globally, so the admin panel tracks all conversations without joining every room.

### 11.3 Frontend Chat Components

| Component | File | Role |
|---|---|---|
| **SocketProvider** | `src/frontend/context/SocketContext.tsx` | Global React Context. Single WebSocket connection per browser session. Connects to `window.location.origin` (same port as Next.js thanks to the monolithic server) |
| **ChatWidget** | `src/frontend/components/chat/ChatWidget.tsx` | Floating chat widget for **regular users**. Rendered globally from `Providers.tsx`. Self-hides on `/admin/*` routes and for admin users |
| **AdminChatPage** | `src/app/admin/chat/page.tsx` | Full admin chat panel. Two-panel layout: sidebar (conversations list + user search with pagination) + message area |
| **Navbar** | `src/frontend/components/Navbar.tsx` | Integrates unread badge for admins via `new_message_notification` events + 4-second polling fallback |

### 11.4 Provider Tree (`Providers.tsx`)

The `SocketProvider` wraps the entire application and the `ChatWidget` is rendered globally:

```
SessionProvider → ThemeProvider → LanguageProvider → QueryClientProvider
  → CartProvider → SocketProvider → TooltipProvider
    → {children}
    → ChatWidget (global, self-hides for admin/unauthenticated)
    → Sonner (toast notifications)
```

### 11.5 Multi-Device E2EE Encryption & Self-Healing Recovery

To ensure absolute confidentiality of support conversations, the chat implements End-to-End Encryption (E2EE) using Curve25519 (X25519) for key agreement and XSalsa20-Poly1305 for authenticated symmetric encryption via the `tweetnacl` library.

To solve the classic out-of-sync key issue when switching browsers or using incognito tabs (where IndexedDB is empty), a **Self-Healing Recovery Escrow** system is implemented:
- **Private Key Backup**: Upon first-time device registration, the client uploads base64-encoded copies of its `identityPrivateKey` and `signedPreKeyPrivateKey` to PostgreSQL securely via `/api/chat/e2ee/register`.
- **Automatic Detection and Recovery**: In `SignalService.registerDevice()`, if the browser detects an empty IndexedDB or a signature mismatch with the server, it does not generate brand-new keys. Instead, it makes a secure query to `/api/chat/e2ee/bundle/[userId]`.
- **Security Gateway (`isSelf`)**: The Next.js API route only exposes the recovery `privateKeys` block if the authenticated session user (`session.user.id`) matches the requested bundle. No third party can ever retrieve another user's private keys.
- **Transparent Restoration**: The client downloads its private keys, writes them locally into IndexedDB, and restores the ability to decrypt message history automatically. This prevents invalidating other active browsers or breaking the communication channel.
- **One-Time PreKeys**: The client generates and hosts 20 one-time PreKeys on the server to allow asynchronous offline key agreement. These keys are consumed and deleted instantly upon session initiation to preserve Perfect Forward Secrecy (PFS).

### 11.6 On-Demand Encryption Toggle (Centralized Configuration)

The E2EE encryption features a global switch controllable by developers via environment variables (`NEXT_PUBLIC_ENABLE_E2EE`):
- **Centralized Access**: Exposed in `src/config/config.ts` via `config.chat.enableE2EE`.
- **Behavior when Disabled**:
  - `SignalService.registerDevice()` immediately exits (preventing unnecessary DB/server writes).
  - `SignalService.encryptMessage()` returns the original plaintext message with type `0` (`type: 0`), bypassing the E2EE pipeline.
  - The frontend (`ChatWidget` and `AdminChatPage`) detects E2EE is disabled and sends messages directly over Socket.IO in plaintext (`isEncrypted: false`).
- **Fail-Closed Security**: If E2EE is **enabled** in the configuration, the chat components block message delivery until `isE2EEReady` is `true`, and abort sending if encryption fails. Silent fallback to plaintext is never allowed when E2EE is active.
- **Backward Compatibility**: Even if encryption is disabled for new messages, the frontend will still attempt to decrypt historical encrypted messages stored in the database if the corresponding local keys are available in IndexedDB.

---

## 12. Database Architecture (Prisma Multi-Schema)

The project uses the `prismaSchemaFolder` preview feature to split schemas into domain-specific files:

```
src/backend/prisma/schema/
├── schema.prisma          ← Generator + Datasource config (PostgreSQL)
├── auth.model.prisma      ← User, Account, Role enum
├── product.model.prisma   ← Product
├── order.model.prisma     ← Pedido, DetallePedido, PedidoEstado enum
└── chat.model.prisma      ← Conversation, Message
```

**Key enums:**
- `Role`: `admin | user`
- `PedidoEstado`: `PENDIENTE | CONFIRMADO | EN_PREPARACION | EN_CAMINO | ENTREGADO | CANCELADO`

**Prisma singleton** (`src/backend/db/prisma.ts`):
- Uses `globalThis` pattern to prevent multiple instances in development.
- Automatically runs `ensureAdminExists()` on initialization (non-blocking).

---

## 13. IoC Container Pattern (Dependency Injection)

Every domain module has an `index.ts` that instantiates the layers with manual DI. Cuando el módulo requiere caché, se inyecta `CacheService` en el Repository:

```typescript
// src/backend/modules/[domain]/index.ts
import { DomainRepository } from "./domain.repository";
import { DomainService } from "./domain.service";
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();

export const domainRepository = new DomainRepository(cacheService);
export const domainService = new DomainService(domainRepository);
```

**Reglas de inyección del CacheService**:
- **Siempre** instanciar `CacheService` como singleton local en el `index.ts` del módulo.
- **Solo** inyectar en el constructor del Repository.
- **Nunca** inyectar en Services, Actions, o componentes UI.
- El constructor del Repository debe declarar `cacheService` como opcional:
  ```typescript
  constructor(private cacheService?: CacheService) {}
  ```
  Esto permite que el módulo funcione sin caché si es necesario, y habilita el uso de optional chaining (`this.cacheService?.getOrSet(...)`).

**Active domain modules and their layers:**

| Module | Repository | Service | Actions | Socket Handler | IoC (`index.ts`) | Cache |
|---|---|---|---|---|---|---|
| `auth` | ✗ (uses `user.repository`) | `auth.service.ts` | `auth.actions.ts` | ✗ | ✓ | ✗ |
| `user` | `user.repository.ts` | ✗ | ✗ | ✗ | ✓ | ✗ |
| `product` | `product.repository.ts` | `product.service.ts` | `product.actions.ts` | ✗ | ✓ | ✅ |
| `orders` | `orders.repository.ts` | `orders.service.ts` | `orders.actions.ts` | ✗ | ✓ | ✗ |
| `payments` | ✗ | `payments.service.ts` | `payments.actions.ts` | ✗ | ✓ | ✗ |
| `chat` | `chat.repository.ts` | `chat.service.ts` | `chat.actions.ts` | `socketHandler.ts` | ✓ | ✗ |

---

## 14. Distributed Caching System (Redis)

> [!CAUTION]
> The caching system is a **core architectural layer** that sits between the Repository and Database layers. All read-heavy data access MUST go through `CacheService` to reduce database load and improve response times. Este sistema está diseñado con **Graceful Degradation**: si Redis no está disponible, la aplicación sigue funcionando sin caché.

### 14.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Service Layer (SVC)                                      │
│  → No sabe que existe caché. Solo llama al Repository.    │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│  Repository Layer (REPO)                                  │
│  → Inyecta CacheService vía constructor                   │
│  → READ methods: usa cacheService.getOrSet(key, fetcher)  │
│  → WRITE methods: invalida con cacheService.delPattern()  │
└──────────┬───────────────────────────────┬────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  Redis (Cache)       │    │  Prisma/PostgreSQL (DB)      │
│  → Si disponible     │    │  → Siempre Source of Truth   │
│  → TTL configurables │    │  → Consultado en cache miss  │
│  → Autoinvalida      │    │  → Consultado si Redis caído │
└──────────────────────┘    └──────────────────────────────┘
```

### 14.2 File Structure

```
src/backend/cache/
├── index.ts              ← Barrel exports
├── client.ts             ← Redis singleton + health check
├── cache.service.ts      ← CacheService class
├── key-builder.ts        ← CacheKeys builder con naming convention
└── types.ts              ← Types compartidos
```

### 14.3 Redis Client (`client.ts`) — Singleton Pattern

Sigue el mismo patrón que `prisma.ts` usando `globalThis` + `process` para survival de HMR:

```typescript
// Comportamiento esperado:
// 1. REDIS_URL configurada + conexión exitosa → isRedisAvailable = true
// 2. REDIS_URL configurada + conexión fallida  → isRedisAvailable = false (log warning)
// 3. REDIS_URL vacía                           → isRedisAvailable = false (log info)
// 4. Redis se cae en runtime                   → isRedisAvailable = false (auto-recuperación)
// 5. Redis se reconecta                        → isRedisAvailable = true
```

**Event listeners que gobiernan la disponibilidad:**
- `connect` / `ready` → `isRedisAvailable = true`
- `error` / `close` / `reconnecting` → `isRedisAvailable = false`
- **Máximo 5 reintentos** con backoff progresivo (200ms → 2s)

### 14.4 CacheService — API Reference

El `CacheService` se inyecta en los Repositorios y nunca debe usarse desde Services o Controllers.

| Método | Firma | Descripción | Si Redis no disponible |
|--------|-------|-------------|----------------------|
| `get` | `get<T>(key: string): Promise<T \| null>` | Obtener valor del caché | Retorna `null` |
| `set` | `set<T>(key: string, value: T, ttl?: number): Promise<void>` | Guardar valor con TTL | No-op |
| `del` | `del(key: string): Promise<void>` | Eliminar clave específica | No-op |
| `delPattern` | `delPattern(pattern: string): Promise<void>` | SCAN + DEL por patrón (ej: `cache:product:*`) | No-op |
| `getOrSet` | `getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>` | **Cache-Aside**: get → si miss → fetcher → set → return | Ejecuta fetcher directamente |

### 14.5 Cache-Aside Pattern (STRICT LAW)

**Todos los métodos READ** en los Repositorios DEBEN usar este patrón:

```typescript
async getProductById(id: string): Promise<Product | null> {
  const key = CacheKeys.product.byId(id);
  return this.cacheService?.getOrSet(
    key,
    async () => {
      log.debug("Buscando producto por id:", { id });
      return prisma.product.findUnique({ where: { id }, include: { ... } });
    },
    config.cache.ttl.productDetail,  // TTL específico
  ) ?? null;
}
```

**Todos los métodos WRITE** (create, update, delete) DEBEN invalidar el caché:

```typescript
async updateProduct(id: string, data: any): Promise<Product> {
  const product = await prisma.product.update({ where: { id }, data });
  await this.cacheService?.delPattern(CacheKeys.product.allPattern);
  return product;
}
```

### 14.6 Key Naming Convention (`key-builder.ts`)

```
cache:{dominio}:{entidad}:{identificador}
```

| Key Pattern | Ejemplo | Uso |
|-------------|---------|-----|
| `cache:product:list:{skip}:{take}:{cats}:{store}` | `cache:product:list:0:20:a1b2:store_01` | Listas paginadas |
| `cache:product:id:{id}` | `cache:product:id:prod_001` | Producto individual |
| `cache:product:search:{query}:{skip}:{take}:{cats}:{store}` | `cache:product:search:hello:0:20:a1b2:` | Búsquedas |
| `cache:product:categories` | `cache:product:categories` | Catálogo de categorías |
| `cache:product:*` | — | Patrón de invalidación global |

Los filtros largos (arrays de categorías) se pasan por un **hash determinístico** (32-bit → base36) para evitar keys excesivamente largas.

### 14.7 TTL Strategy (Configurable)

Los TTLs se definen en `src/config/config.ts` y deben ajustarse según la volatilidad de los datos:

| Tipo de dato | TTL recomendado | Frecuencia de cambio |
|-------------|----------------|---------------------|
| Listados paginados | 60s | Alta (cambian con cada mutación) |
| Detalle individual | 120s | Media |
| Categorías | 300s (5 min) | Muy baja |
| Conteos | 120s | Media |
| Búsquedas | 60s | Alta |

### 14.8 Invalidación por Mutación (STRICT LAW)

Siempre que un método WRITE modifique datos, DEBE invalidar el caché usando `delPattern` con el patrón del dominio completo:

```typescript
await this.cacheService?.delPattern("cache:product:*");
```

Esto es intencionalmente amplio (invalida todo el dominio) porque:
1. **Seguridad**: garantiza que no queden datos obsoletos
2. **Simplicidad**: evita errores de keys olvidadas
3. **Rendimiento**: con TTLs de 60-120s, el impacto es mínimo

**Caso especial**: métodos auxiliares de solo lectura interna (ej: `getProductByIdAndStore`) que se usan para validaciones dentro del Service, NO necesitan cache — su frecuencia de uso es baja y no justifica la sobrecarga.

### 14.9 IoC Injection Pattern (STRICT LAW)

```typescript
// src/backend/modules/[domain]/index.ts
import { CacheService } from "@/backend/cache";

const cacheService = new CacheService();
export const domainRepository = new DomainRepository(cacheService);
export const domainService = new DomainService(domainRepository);
```

Reglas:
- **Siempre** instanciar `CacheService` en el `index.ts` del módulo (no compartir entre módulos a menos que se justifique)
- **Solo** aceptar `CacheService` como parámetro opcional en el constructor del Repository: `constructor(private cacheService?: CacheService)`
- **Nunca** inyectar `CacheService` en Services, Actions, o componentes

### 14.10 Adding Cache to a New Module — Checklist

- [ ] 1. Agregar keys en `src/backend/cache/key-builder.ts`
- [ ] 2. Agregar TTLs en `src/config/config.ts` (si son diferentes a los default)
- [ ] 3. Inyectar `CacheService` via constructor en el Repository
- [ ] 4. Envolver métodos READ con `this.cacheService?.getOrSet(key, fetcher, ttl)`
- [ ] 5. Invalidar métodos WRITE con `this.cacheService?.delPattern(pattern)`
- [ ] 6. Actualizar el `index.ts` del módulo para instanciar e inyectar `CacheService`
- [ ] 7. Verificar que `tsc --noEmit` compile sin errores
- [ ] 8. Verificar en logs que el caché funciona: `Cache HIT: ...` / `Cache invalidated: ...`

### 14.11 Graceful Degradation — Qué Esperar

| Escenario | Log | Comportamiento |
|-----------|-----|----------------|
| Redis no configurado | `REDIS_URL no configurada. Caché deshabilitado.` | App funciona 100%, sin caché |
| Redis arranca después de la app | `Redis conectado exitosamente.` | Cache se activa automáticamente |
| Redis se cae en runtime | `Redis: error de conexión: ...` | App sigue funcionando, caché deshabilitado hasta reconexión |
| Redis reconecta | `Redis conectado exitosamente.` | Cache se reactiva automáticamente |
| Cache HIT | `Cache HIT: cache:product:id:prod_001` | Data servida desde Redis (rápido) |
| Cache invalidado | `Cache invalidated: cache:product:*` | Data fresca en próxima request |

### 14.12 Environment Variables

```bash
# Caching (Redis) — deshabilitado si REDIS_URL está vacío
REDIS_URL="redis://default:password@host:6379"
CACHE_ENABLED="true"
```

---

## 15. Centralized Configuration

All environment variables are accessed through `src/config/config.ts`:

```typescript
export const config = {
  env, isProduction, isDevelopment, isTest,
  app: { url },
  auth: { secret, trustHost, google: { clientId, clientSecret }, admin: { email, password } },
  database: { url, directUrl },
  mercadopago: { accessToken, webhookSecret },
  cache: {
    redisUrl, enabled, defaultTTL,
    ttl: { productList, productDetail, categories, categoryCounts, searchResults },
  },
};
```

**Rule**: Never use `process.env.VARIABLE` directly in application code. Always access through `config.*` or use `getRequiredConfig()` for mandatory values.

**Cache configuration variables** (`src/config/config.ts`):
- `config.cache.redisUrl` — `REDIS_URL` env var
- `config.cache.enabled` — `CACHE_ENABLED` env var (default `true`)
- `config.cache.defaultTTL` — TTL global por defecto (60s)
- `config.cache.ttl.*` — TTLs específicos por tipo de dato (productList, productDetail, categories, etc.)

---

## 16. Internationalization (i18n)

- The app supports **Spanish (es)** and **English (en)** via `LanguageContext`.
- Translation files live in `src/frontend/architecture/languages/`.
- All user-facing text MUST use the `t` object from `useLanguage()`, never hardcoded strings.
- The chat system has its own inline translations (inside `ChatWidget.tsx`).

---

## 17. Event-Driven Data Refresh Architecture (Zero-Polling Rule)

To maintain a professional, high-performance architecture, **polling via `setInterval` is STRICTLY FORBIDDEN**. All automatic data refreshing must be push-based using the global `eventBus` and WebSockets.

### 16.1 Server-Side Event Emission (`eventBus`)
- The backend utilizes a global singleton `eventBus` (`src/utils/eventBus.ts`) to decouple domain logic from WebSockets.
- **Law**: Server Actions MUST NOT interact with Socket.IO directly. Instead, when a mutation occurs that requires clients to refresh data (e.g., approving an order, receiving a new store request), the Server Action must emit a specific event via the event bus:
  ```typescript
  eventBus.emit("store_request_updated")
  ```
- The `socketHandler.ts` listens to the `eventBus` and bridges these events to connected clients via `io.emit()`.

### 16.2 Client-Side Refresh (`useSocketRefresh`)
- Frontend components must listen for these socket events using the custom `useSocketRefresh` hook to trigger their data re-fetches.
- **Law**: `useSocketRefresh` is purely event-driven. It does NOT execute the refresh function on mount. Consumers MUST handle their own initial data fetching using a standard `useEffect`.
- Always wrap the `refresh` function passed to `useSocketRefresh` in a `useCallback` to prevent infinite re-render loops.

**Example implementation:**
```tsx
const loadData = useCallback(async () => {
  const data = await getDashboardData();
  setData(data);
}, []);

// 1. Initial Load (Manual)
useEffect(() => {
  loadData();
}, [loadData]);

// 2. Event-driven real-time updates (NO setInterval)
useSocketRefresh({
  socket,
  enabled: true,
  refresh: loadData,
  events: ["dashboard_data_updated"],
});
```

---

## 18. Event-Driven Notifications System (Production-Grade)

To guarantee scalability, persistence, and real-time delivery, all system notifications MUST use the dedicated Event-Driven Notifications System. **Never implement ad-hoc or polling-based notification mechanisms.**

### 18.1 Architecture & Components
- **Domain Event Log**: Every notification starts as an immutable `DomainEvent` representing the business action (e.g., `order_created`, `post_liked`).
- **Logical Notification**: A single `Notification` record is created linking back to the `DomainEvent`.
- **Audience Resolver**: Uses the Strategy Pattern to determine recipients dynamically (`INDIVIDUAL`, `BROADCAST`, `GROUP`).
- **Materialization**: 
  - `INDIVIDUAL` and `GROUP` notifications generate physical `NotificationRecipient` records immediately in the database.
  - `BROADCAST` notifications use **Lazy Materialization** ($O(1)$ dispatch) and are merged virtually during query time to save database space.

### 18.2 Dispatching Rule (STRICT LAW)
- **Law**: Whenever a business event occurs that requires notifying users, developers MUST use `notificationsService.dispatchNotification()`.
- **Never** write directly to the `Notification` table from other domains or controllers. Always use the encapsulated service.
- **Example Usage** (e.g., inside `orders.service.ts`):
  ```typescript
  import { notificationsService } from "@/backend/modules/notifications";

  await notificationsService.dispatchNotification({
    eventType: "order_created",
    actorId: data.usuarioId,
    entityType: "Pedido",
    entityId: pedido.id,
    notification: {
      type: "new_order",
      title: "Nuevo Pedido",
      message: "Tienes un nuevo pedido por $214.00.",
      audienceType: "INDIVIDUAL",
      audienceRef: storeOwnerId,
      metadata: { actionUrl: "/mi-tienda" } // Required for interactive navigation
    },
  });
  ```

### 18.3 Real-Time Delivery (Socket Bridge)
- The `notificationsService` automatically emits internal node events via the global `eventBus`.
- `socketHandler.ts` listens to these events and bridges them to the private Socket.IO channels of the affected users (e.g., `user:{userId}:notifications`).
- The frontend consumes this via the `NotificationContext` (`useNotifications` hook) which optimistically updates the UI Bell icon and manages read states.

### 18.4 Interactive Navigation
- **Law**: Notifications that require user interaction or routing MUST include an `actionUrl` inside the `metadata` JSON object.
- The `NotificationBell.tsx` component automatically parses `metadata.actionUrl`. When the user clicks the notification, it marks it as read, closes the panel, and routes the user seamlessly.
