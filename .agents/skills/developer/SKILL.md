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
│   │   ├── [domain]/             
│   │   │   ├── index.ts          ← IoC: instancia Repository + Service + CacheService
│   │   │   ├── [domain].actions.ts      ← CTRL layer
│   │   │   ├── [domain].service.ts      ← SVC layer
│   │   │   └── [domain].repository.ts   ← REPO layer (usa CacheService inyectado)
│   │   └── stockGuardian/        ← Control de concurrencia de stock (Redis distribuido)
│   └── prisma/                   ← Prisma schema and migrations
│
├── frontend/                     ← Encapsulated Frontend Architecture
│   ├── components/               ← UI (Shared & Feature Components)
│   │   ├── ui/                   ← shadcn / primitives
│   │   ├── ai/                   ← AI components (RelatedPosts, RelatedProducts, GenerateDescriptionButton)
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
- **Data Source Tagging Convention (STRICT LAW)**: Todos los logs relacionados con carga de datos DEBEN incluir un tag `[cache]` o `[db]` al inicio del mensaje para identificar inmediatamente el origen de los datos:
  - `[cache]` → Cuando los datos se sirven desde Redis (cache HIT) o cuando se realiza una operación de caché (invalidation, SET, MISS).
    ```typescript
    log.debug("[cache] HIT: cache:product:id:prod_001");
    log.debug("[cache] invalidated: cache:product:*");
    log.debug("[cache] MISS: cache:product:id:prod_001 — fetching from [db]");
    ```
  - `[db]` → Cuando se ejecuta una consulta real a la base de datos PostgreSQL (cache MISS o método sin caché).
    ```typescript
    log.debug("[db] Buscando producto por id:", { id });
    log.info("[db] Creando nuevo producto:", { name: data.name });
    ```
  - Los tags `[cache]` y `[db]` permiten filtrar visualmente los logs y entender rápidamente el flujo de datos. Esta convención aplica a todos los repositorios, servicios de caché y cualquier punto donde se carguen datos desde una fuente externa.

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

**Domain Events → Socket.IO (Auto-Bridge Genérico):**
- Los eventos de dominio (forum, orders, store, etc.) no se declaran manualmente uno por uno.
- En lugar de eso, `socketHandler.ts` usa un array `BRIDGE_EVENTS` + un loop que enlaza automáticamente cada evento del `eventBus` a Socket.IO.
- Si el payload contiene `_room`, se emite solo a esa sala (`io.to(room).emit()`); si no, se emite globalmente (`io.emit()`).
- Ver [sección 17.3](#173-auto-bridge-genérico-sockethandler) para la documentación completa del patrón.

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
├── schema.prisma              ← Generator + Datasource config (PostgreSQL)
├── auth.model.prisma          ← User, Account, Role enum
├── product.model.prisma       ← Product
├── productEmbedding.model.prisma ← vector(4096) para búsqueda semántica de productos
├── forumPostEmbedding.model.prisma ← vector(4096) para búsqueda semántica del foro
├── order.model.prisma         ← Pedido, DetallePedido, PedidoEstado enum
└── chat.model.prisma          ← Conversation, Message
```

**Key enums:**
- `Role`: `admin | user`
- `PedidoEstado`: `PENDIENTE | CONFIRMADO | EN_PREPARACION | EN_CAMINO | ENTREGADO | CANCELADO`

**Vector embeddings (pgvector):**
```prisma
model ProductEmbedding {
  productId String   @unique
  embedding Unsupported("vector(4096)")?
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([productId])
}
```

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
|---|---|---|---|---|---|---|---|
| `auth` | ✗ (uses `user.repository`) | `auth.service.ts` | `auth.actions.ts` | ✗ | ✓ | ✗ |
| `user` | `user.repository.ts` | ✗ | ✗ | ✗ | ✓ | ✗ |
| `product` | `product.repository.ts` | `product.service.ts` + `productEmbedding.service.ts` | `product.actions.ts` | ✗ | ✓ | ✅ |
| `orders` | `orders.repository.ts` | `orders.service.ts` | `orders.actions.ts` | ✗ | ✓ | ✗ |
| `payments` | ✗ | `payments.service.ts` | `payments.actions.ts` | ✗ | ✓ | ✗ |
| `chat` | `chat.repository.ts` | `chat.service.ts` | `chat.actions.ts` | `socketHandler.ts` | ✓ | ✗ |
| `ai` | `ai.repository.ts` | `ai.service.ts` + `rag.service.ts` + `content-moderation.service.ts` | `ai.actions.ts` | ✗ | ✓ | ✅ |
| `shared/embedding` | `embedding.repository.ts` | `embedding.service.ts` | ✗ | ✗ | ✓ | ✗ (usa cache interno 60s) |
| `forum` | `forum.repository.ts` | `forum.service.ts` + `forumPostEmbedding.service.ts` | `forum.actions.ts` | ✗ | ✓ | ✗ |
| `stockGuardian` | ✗ | `stockGuardian.service.ts` | `stockGuardian.actions.ts` | ✗ | ✓ | ✗ (usa Redis directo vía ioredis) |

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

### 14.11 Data Source Tagging Convention (STRICT LAW)

Todos los logs de carga de datos DEBEN incluir un tag `[cache]` o `[db]` para identificar el origen de los datos:

```typescript
// CacheService — usa [cache]
log.debug("[cache] HIT: cache:product:id:prod_001");
log.debug("[cache] MISS: cache:product:list:0:20 — fetching from [db]");
log.debug("[cache] invalidated: cache:product:*");

// Repositorios — usa [db] cuando se ejecuta una consulta real a PostgreSQL
log.debug("[db] Buscando producto por id:", { id });
log.debug("[db] Obteniendo productos paginados:", { skip, take });
log.info("[db] Creando nuevo producto:", { name: data.name });
```

### 14.12 Graceful Degradation — Qué Esperar

| Escenario | Log | Comportamiento |
|-----------|-----|----------------|
| Redis no configurado | `REDIS_URL no configurada. Caché deshabilitado.` | App funciona 100%, sin caché |
| Redis arranca después de la app | `Redis conectado exitosamente.` | Cache se activa automáticamente |
| Redis se cae en runtime | `Redis: error de conexión: ...` | App sigue funcionando, caché deshabilitado hasta reconexión |
| Redis reconecta | `Redis conectado exitosamente.` | Cache se reactiva automáticamente |
| Cache HIT | `[cache] HIT: cache:product:id:prod_001` | Data servida desde Redis (rápido) |
| Cache MISS → DB | `[cache] MISS: cache:product:id:prod_001 — fetching from [db]` + `[db] Buscando producto por id: { id }` | Data desde PostgreSQL + se guarda en Redis |
| Cache invalidado | `[cache] invalidated: cache:product:*` | Data fresca en próxima request |

### 14.13 Environment Variables

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

### 17.1 Server-Side Event Emission (`eventBus`)
- The backend utilizes a global singleton `eventBus` (`src/utils/eventBus.ts`) to decouple domain logic from WebSockets.
- **Law**: Server Actions and Services MUST NOT interact with Socket.IO directly. Instead, when a mutation occurs that requires clients to refresh data, they must emit a specific event via the event bus:
  ```typescript
  import eventBus from "@/utils/eventBus";
  eventBus.emit("order:created", { pedidoId, storeId, ownerId });
  ```
- The `socketHandler.ts` listens to the `eventBus` via an **Auto-Bridge Genérico** and forwards these events to connected clients (see 17.3).

### 17.2 Client-Side Refresh (`useSocketRefresh`)
- Frontend components must listen for these socket events using the custom `useSocketRefresh` hook to trigger their data re-fetches.
- **Law**: `useSocketRefresh` is purely event-driven. It does NOT execute the refresh function on mount. Consumers MUST handle their own initial data fetching using a standard `useEffect`.
- Always wrap the `refresh` function passed to `useSocketRefresh` in a `useCallback` to prevent infinite re-render loops.
- Para evitar spinners en actualizaciones silenciosas, la función `refresh` debe hacer el fetch directamente sin tocar estados de loading.

**Example implementation:**
```tsx
const loadData = useCallback(async () => {
  const data = await getDashboardData();
  setData(data);
}, []);

// 1. Initial Load (Manual con spinner)
useEffect(() => {
  loadData();
}, [loadData]);

// 2. Event-driven real-time updates (NO setInterval, NO spinner)
useSocketRefresh({
  socket,
  enabled: true,
  refresh: loadData,
  events: ["order:created"],
});
```

### 17.3 Auto-Bridge Genérico (socketHandler)
En lugar de registrar manualmente cada evento en `socketHandler.ts` con `eventBus.on()` + `io.emit()`, el proyecto usa un **Auto-Bridge Genérico** que automaticamente enlaza cualquier evento listado en `BRIDGE_EVENTS`:

```typescript
// socketHandler.ts — Auto-Bridge Genérico
const BRIDGE_EVENTS = [
  "store_request_updated",
  "forum:post_created",
  "forum:answer_created",
  "order:created",
  "notification_read_state_changed",
  // ... agregar nuevos aquí
] as const;

for (const eventName of BRIDGE_EVENTS) {
  eventBus.removeAllListeners(eventName);
  eventBus.on(eventName, (payload) => {
    const room = payload?._room;
    if (room) {
      io.to(room).emit(eventName, payload);  // room-scoped
    } else {
      io.emit(eventName, payload);            // global
    }
  });
}
```

**Convención `_room`**: Si el payload incluye una propiedad `_room`, el evento se emite solo a esa sala (`io.to(room).emit()`). Si no, se emite globalmente (`io.emit()`).

### 17.4 ABSOLUTE SCALABILITY LAW (ULTRA INSTINCT ⚡️)
> [!CAUTION]
> **SUPER SAIYAN ARCHITECTURE LAW:** NEVER, ever, under any circumstances, emit domain update events GLOBALLY (`io.emit()`) if the information belongs to or is only relevant to a single user or a small group of users (e.g., an order status, a chat message, a payment).

Using `io.emit()` for specific events is a scalability abomination that destroys server bandwidth, violates user privacy, and forces thousands of innocent clients to needlessly re-render React components.

**YOUR DUTY AS AN ULTRA INSTINCT DEVELOPER:**
1. **Identify the Room:** Who cares about this event? If it's an order, the room is `order:${pedidoId}`. If it's the user's notification list, the room is `user:${userId}:notifications`. If it's a forum post, `forum:post:${postId}`.
2. **Backend - Surgical Emission:** Use the `Auto-Bridge` by injecting `_room` directly from the Service layer. The server will route the network packet ONLY to the correct TCP connections.
   ```typescript
   eventBus.emit("order:status_updated", {
     pedidoId: id,
     estado: "NUEVO_ESTADO",
     _room: `order:${id}`, // ⚡️ SURGICAL PRECISION
   });
   ```
3. **Frontend - Join the Room:** The React component (the Page Client) MUST join the room upon mounting and leave upon unmounting via `socket.emit("join_...")`.
4. **Listen and React:** Use `useSocketRefresh({ events: ["your:event"] })` to update the data.

**To add a new real-time event, you just need to:**
1. Create the `join_X` and `leave_X` handlers in `socketHandler.ts` if the room does not exist yet.
2. Add the event name to the `BRIDGE_EVENTS` array in `socketHandler.ts`.
3. Emit it from the service/action by injecting the `_room` property.
4. On the client, join the room and listen to it using `useSocketRefresh()`.

**Eventos con routing especial** (no pasan por el auto-bridge):
- `notification_dispatched` → emite a per-user rooms con nombre de evento distinto (`new_notification`)
- `notification_broadcast` → emite global con nombre de evento distinto (`new_notification`)

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

### 18.5 Forum Real-Time Updates (WebSocket Pattern)
- **Goal**: Update all users viewing a forum post when another user creates/edits/deletes a response, rates an item, or edits the post.
- **No polling**: all real-time updates use Socket.IO rooms.
- **Architecture**:
  1. **forum.service.ts** emits `eventBus.emit("forum:{event}", payload)` after each mutation. Para eventos room-scoped, incluye `_room: \`forum:post:${postId}\`` en el payload.
  2. **socketHandler.ts** usa el **Auto-Bridge Genérico** (ver 17.3): detecta `payload._room` y emite a la sala correspondiente automáticamente.
  3. **Frontend** joins the room with `socket.emit("join_post", { postId })` on mount and leaves on unmount.
  4. **Frontend** uses `useSocketRefresh()` hook to invalidate React Query on socket events.
- **Available events**:
  | Event | Scope | Payload |
  |---|---|---|
  | `forum:post_created` | global | `{ postId, post }` |
  | `forum:post_updated` | room (`_room: forum:post:{postId}`) | `{ postId, post }` |
  | `forum:post_deleted` | global | `{ postId }` |
  | `forum:answer_created` | room (`_room: forum:post:{postId}`) | `{ postId, answer, answerId }` |
  | `forum:answer_edited` | room (`_room: forum:post:{postId}`) | `{ postId, answerId, answer }` |
  | `forum:answer_deleted` | room (`_room: forum:post:{postId}`) | `{ postId, answerId }` |
  | `forum:answer_accepted` | room (`_room: forum:post:{postId}`) | `{ postId, answerId, isAccepted }` |
  | `forum:item_rated` | global | `{ itemId, itemType }` |
- **Frontend pattern**:
  ```typescript
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    socket.emit("join_post", { postId: id });
    return () => { socket.emit("leave_post", { postId: id }); };
  }, [socket, id]);

  useSocketRefresh({
    socket,
    enabled: true,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["forumPost", id] }),
    events: ["forum:answer_created", "forum:answer_edited", /* ... */],
  });
  ```

---

## 19. Stock Guardian — Control de Concurrencia de Stock

> [!CAUTION]
> El stock **NO se descuenta al crear el pedido**. Solo se descuenta en la transición `PENDIENTE → CONFIRMADO`. Ese es el **único punto donde se decide quién gana la condición de carrera**. Comprar solo crea una solicitud (`PENDIENTE`). Confirmar consume inventario.

### 19.1 Problema que Resuelve

Cuando dos administradores (o procesos) confirman simultáneamente pedidos que contienen los mismos productos, ambos pueden leer stock suficiente y descontar, resultando en **overbooking** (stock negativo). La transición `PENDIENTE → CONFIRMADO` es la ventana de carrera crítica.

### 19.2 Arquitectura

```
CONFIRMAR PEDIDO
│
├─ ¿Redis disponible?
│  ├─ SÍ → acquireProductLocks (SET lock:stock:{pid} UUID EX 5 NX)
│  │        ├─ ¿Lock adquirido? → checkAndDeductStock (Lua script atómico)
│  │        │                      ├─ ¿Stock OK? → Transición DB
│  │        │                      │              ├─ tryTransitionEstado (optimistic lock)
│  │        │                      │              ├─ updateMany WHERE stock>=qty (barrera DB)
│  │        │                      │              └─ Liberar locks
│  │        │                      └─ Stock insuf → throw + liberar locks
│  │        └─ Sin lock → DB fallback (updateMany atómico)
│  └─ NO → DB fallback (updateMany WHERE stock>=qty, misma transacción)
│
└─ ¿Transición DB exitosa? → ✅ CONFIRMADO
   ¿Transición DB falla? → restoreStock Redis + liberar locks + throw
```

### 19.3 Componentes

```
src/backend/modules/stockGuardian/
├── index.ts                       ← IoC: instancia StockGuardianService con redisClient
├── stockGuardian.service.ts       ← Lógica central (locks, Lua, fallback)
├── stockGuardian.actions.ts       ← Server Actions (getAvailableStock)
└── init.ts                        ← Inicialización de stock:master en boot
```

### 19.4 Redis Keys

| Key | Tipo | TTL | Propósito |
|-----|------|-----|-----------|
| `stock:master:{productId}` | String (entero) | ∞ | Stock disponible en tiempo real. Sincronizado desde DB. |
| `lock:stock:{productId}` | String (UUID) | 5s | Mutex distribuido por producto. Previene concurrencia. |
| `lock:confirm:{pedidoId}` | String (UUID) | 10s | Previene doble procesamiento del mismo pedido. |

### 19.5 API del Servicio

| Método | Descripción | Fallback (sin Redis) |
|--------|-------------|---------------------|
| `acquireProductLocks(ids, uuid)` | Adquiere locks en orden alfabético. 3 reintentos con backoff. | Retorna `true` (procede sin locks) |
| `checkAndDeductStock(items)` | Lua script atómico: verifica stock ≥ qty → DECRBY. | Retorna `true` (delega a DB) |
| `restoreStock(items)` | INCRBY para revertir stock en cancelaciones. | No-op |
| `getAvailableStock(productId)` | Obtiene stock desde Redis master. Lazy-sync desde DB si no existe. | Consulta DB directo |
| `syncMasterFromDB(productId)` | Sincroniza stock:master desde PostgreSQL. | — |

### 19.6 Lua Script — Deducción Atómica

```lua
-- checkAndDeductStock
-- KEYS[1..N] = stock:master:{productId}
-- ARGV[1..N] = cantidades
-- Retorna 1 si OK, 0 si stock insuficiente

for i = 1, #KEYS do
  local stock = redis.call("GET", KEYS[i])
  if not stock or tonumber(stock) < tonumber(ARGV[i]) then
    return 0
  end
end
for i = 1, #KEYS do
  redis.call("DECRBY", KEYS[i], ARGV[i])
end
return 1
```

Redis ejecuta el script completo sin interrupciones (single-threaded). No hay ventana entre verificar y descontar.

### 19.7 Doble Barrera (Defense in Depth)

| Capa | Tecnología | Qué hace | Si falla |
|------|-----------|----------|----------|
| 1ª | Redis locks `SET NX EX 5` | Serializa acceso por producto | Cae a capa 2 |
| 2ª | Redis Lua `checkAndDeductStock` | Check + decrement atómico | Cae a capa 3 |
| 3ª | PostgreSQL `updateMany WHERE stock>=qty` | Update condicional atómico | Rollback + error |

La tercera capa SIEMPRE se ejecuta dentro de la transacción Prisma. Si `result.count === 0`, la transacción hace rollback completo (incluyendo `tryTransitionEstado`).

### 19.8 Semántica del TTL de 5s

```
El TTL de 5s en el lock Redis NO tiene relación con el tiempo que el dueño
tarda en confirmar un pedido (horas/días). El lock se adquiere SOLO durante
los ~100ms que dura la ejecución de updateEstado().

Propósito del TTL: Si el servidor crashea (OOM, kill -9, DC outage) en medio
de la transacción, el lock se auto-libera a los 5s en lugar de quedar
bloqueado para siempre.
```

| Concepto | Semántica | Duración |
|----------|-----------|----------|
| **Lock Redis** (TTL) | "Espera, estoy procesando esta confirmación, no me interrumpas" | 5 segundos |
| **PENDIENTE → CONFIRMADO** | "El dueño decidió aceptar este pedido y consume inventario" | Horas/días |

### 19.9 Flujo Completo de Confirmación

```
1. updateEstado(pedidoId, CONFIRMADO)
   │
   ├── acquireProductLocks(productIds, lockUUID)
   │   └── SET lock:stock:prodX UUID EX 5 NX  (por cada producto, ordenado)
   │
   ├── checkAndDeductStock([{productId, quantity}])
   │   └── Lua: GET stock:master → DECRBY → return 1|0
   │
   ├── executeTransaction(async (tx) => {
   │   ├── tryTransitionEstado(id, PENDIENTE, CONFIRMADO)
   │   │   └── tx.pedido.updateMany({ where: { id, estado: PENDIENTE }, data: { estado: CONFIRMADO } })
   │   │
   │   ├── if (!transitioned) → restoreStock() + return idempotent
   │   │
   │   ├── tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } })
   │   │
   │   └── if (result.count === 0) → throw (rollback total)
   │   └── commit
   │   })
   │
   └── releaseProductLocks(productIds, lockUUID)
       └── Lua: GET → DEL (solo si el valor es nuestro UUID)
```

### 19.10 Graceful Degradation

| Escenario | Comportamiento | Protección |
|-----------|---------------|------------|
| Redis funcionando | Locks + Lua + DB (3 capas) | Máxima |
| Redis no configurado | Skip locks + skip Lua → solo DB | `updateMany WHERE stock>=qty` |
| Redis se cae en runtime | `isRedisAvailable=false` → DB fallback automático | `updateMany WHERE stock>=qty` |
| Redis reconecta | Locks + Lua se reactivan automáticamente | Máxima |

### 19.11 Integración con Orders Module

En `src/backend/modules/orders/orders.service.ts`, el método `updateEstado()`:

```typescript
// CONFIRMADO:
// 1. Adquirir locks Redis (serializa por producto)
// 2. Si Redis disponible → checkAndDeductStock vía Lua (detección temprana)
// 3. Dentro de transacción Prisma → tryTransitionEstado + updateMany WHERE stock>=qty
// 4. Si tryTransitionEstado falla (otro proceso ganó) → restoreStock en Redis
// 5. Si updateMany retorna count=0 → throw → rollback Prisma + restoreStock en Redis
// 6. Liberar locks en finally

// CANCELADO desde estado con stock descontado:
// 1. Restaurar stock en DB: tx.product.update({ data: { stock: { increment } } })
// 2. Si Redis disponible → restoreStock en Redis
```

### 19.12 Inicialización en Boot

En `server.ts`, después de conectar Redis, se ejecuta:

```typescript
import { initializeStockMaster } from "@/backend/modules/stockGuardian/init";

initializeStockMaster(prisma);
// → Pipeline Redis SET stock:master:{pid} stock NX para todos los productos
// → Solo crea keys que NO existen (no sobrescribe datos actuales)
// → No bloqueante — si falla, nextSync será lazy
```

Cada `getAvailableStock(productId)` también sincroniza lazy si la key no existe en Redis.

---

## 20. 🧠 FASE IA — Artificial Intelligence Layer

> [!NOTE]
> La capa IA está **activa en producción** con las features de búsqueda semántica y moderación de contenido habilitadas.
> Otras features (chatbot, visión, forecasting, pricing, traducción) están desactivadas por defecto y se activan mediante
> variables de entorno individuales (`AI_FEATURE_*`).

### 20.1 Propósito

La capa AI proporciona una base arquitectónica para integrar modelos de lenguaje (LLMs),
búsqueda semántica, visión por computadora, predicción de demanda y otras capacidades
de inteligencia artificial en la plataforma. Sigue los mismos patrones del resto del backend
(IoC/DI, Factory Pattern, Repository Pattern, Cache-Aside).

### 20.2 Estado Actual

```
src/backend/modules/ai/
├── index.ts                          ← IoC: inicializa condicionalmente (AI_ENABLED)
├── ai.actions.ts                     ← Server Actions (chat, streaming, semantic search, moderación, generación)
├── ai.service.ts                     ← Orquestador central (chat, streamChat, ragChat, embed, moderate)
├── ai.repository.ts                  ← Caché de respuestas LLM + embeddings (Redis, TTL 1h/24h)
├── providers/
│   ├── types.ts                      ← AIProvider interface + tipos compartidos
│   ├── factory.ts                    ← AIProviderFactory (Factory Pattern)
│   ├── deepseek.ts                   ← ✅ Provider DeepSeek (chat, embed, moderate, isAvailable)
│   ├── openai.ts                     ← ⏳ Placeholder (estructura lista, lanza error)
│   └── ollama.ts                     ← ✅ Provider Ollama (chat, streamChat, embed, moderate vía prompt, isAvailable)
├── nlp/
│   ├── rag.service.ts                ← ✅ RAG completo (3 retrievers: Platform, Forum, Product)
│   ├── platform-content.ts           ← Base de conocimientos estática (15 documentos)
│   └── translation.service.ts        ← ⏳ Placeholder traducción
├── moderation/
│   └── content-moderation.service.ts ← ✅ Moderación foro/productos (delega a provider.moderate())
├── forecasting/
│   ├── demand.service.ts             ← ⏳ Placeholder predicción demanda
│   └── pricing.service.ts            ← ⏳ Placeholder pricing dinámico
└── vision/
    └── vision.service.ts             ← ⏳ Placeholder visión
```

**✅ Implementado y activo en producción:**
- Provider Ollama (chat, streaming, embeddings, moderación vía prompt, health check)
- Provider DeepSeek (chat, embeddings, moderación, con retry y exponential backoff)
- RAG Service con 3 retrievers: PlatformContent (keyword), Forum (pgvector), Product (pgvector)
- Content Moderation integrada en `forum.service.ts` (posts y respuestas)
- Semantic Search integrada en `product.service.ts` y `forum.service.ts`
- Búsqueda semántica en comunidad (foro) con debounce 300ms + spinner + fallback ILIKE
- Caché de respuestas LLM (Redis, TTL 1h) y embeddings (TTL 24h)
- AI Chatbot con streaming en el ChatWidget (backend completo, frontend gated por `AI_FEATURE_CHATBOT`)

**⏳ Placeholder:** OpenAI provider, traducción, forecasting, pricing, visión — todos lanzan error "no implementado"

**✅ Integración con módulos existentes:**
- `product/index.ts` y `forum/index.ts` importan `OllamaProvider` y `AIProvider` de `@/backend/modules/ai/providers/` para generar embeddings
- `forum.service.ts` llama a `AIService.moderateForumPost()` en creación de posts y respuestas
- `product.service.ts` y `forum.service.ts` usan `EmbeddingService` (shared) para búsqueda semántica

### 20.3 Reglas de Arquitectura (STRICT LAW)

> [!CAUTION]
> **TODO componente UI relacionado con IA DEBE ubicarse en `src/frontend/components/ai/`.**
> - Los componentes de IA son Dumb Components (reciben data y callbacks por props).
> - Nunca importan Server Actions, Prisma, o lógica de backend directamente.
> - Siguen el mismo patrón que el resto de componentes UI del proyecto.
> - El fetching de datos y estado se maneja desde el Page Padre (`page.tsx`).
> - La excepción son componentes legacy como `ProductModal` que ya existían antes de esta regla.

### 20.3.1 Frontend AI Components — Directorio y Patrón

```
src/frontend/components/ai/
├── index.ts                   ← Barrel exports
├── RelatedPosts.tsx           ← Posts relacionados del foro (sidebar, estilo newspaper clippings)
├── RelatedProducts.tsx        ← Productos relacionados (modal, scroll horizontal con emojis)
├── GenerateDescriptionButton.tsx ← Generación de descripciones con IA (botón + spinner)
└── ... (nuevos componentes aquí)
```

**Reglas de creación:**
- Cada componente de IA debe ser un archivo independiente con su propia interfaz de props.
- Usar `"use client"` cuando sea necesario (eventos, estado local).
- Exportar como función nombrada desde el barrel (`index.ts`).
- Nombrar con el patrón `PascalCase.tsx`.
- No incluir lógica de fetching ni importar Server Actions directamente.
- Para componentes que ejecutan acciones (no solo display), recibir callbacks `onGenerate`/`onGenerated` como props — el Page Padre inyecta la Server Action.

**Ejemplo de uso:**
```tsx
// page.tsx — el Page Padre maneja el fetching
const { data: relatedPosts } = useQuery({
  queryKey: ["forumRelated", id],
  queryFn: () => getRelatedPosts(id, 4),
});

// Template — pasa data como props al componente IA
<RelatedPosts
  posts={relatedPosts ?? []}
  title={t.forum.post.relatedPosts}
  onPostClick={(postId) => router.push(`/comunidad/post/${postId}`)}
/>
```

### 20.3.2 Logging Convention — 🤖 Emoji Mandatory (STRICT LAW)

> [!CAUTION]
> **TODO mensaje de log dentro del módulo AI DEBE comenzar con el emoji `🤖`.**
> Esta es una regla obligatoria, no opcional. El emoji permite identificar instantáneamente
> en la consola cualquier operación relacionada con IA, esté el módulo activo o no.

**Reglas:**
- Todo `log.info()`, `log.debug()`, `log.warn()`, `log.error()` en cualquier archivo dentro de `src/backend/modules/ai/` debe tener el string `"🤖"` al inicio del mensaje.
- El emoji va **antes** del tag contextual, ej: `log.info("🤖 [DeepSeek] Chat completado", ...)`
- Esto aplica a: `ai.service.ts`, `ai.repository.ts`, `ai.actions.ts`, `index.ts`, todos los providers, y todos los stubs de dominio (`nlp/`, `moderation/`, `forecasting/`, `vision/`).
- Cualquier nuevo archivo agregado al módulo AI debe seguir esta misma convención.

**Ejemplos correctos:**
```typescript
log.info("🤖 [AI] Módulo AI inicializado correctamente:", { provider, features });
log.debug("🤖 [DeepSeek] Chat completado", { model, tokens, elapsed });
log.warn("🤖 [AI] El módulo AI no estará disponible. Verifique la configuración.");
log.error("🤖 [DeepSeek] Error parseando resultado de moderación:", { raw });
```

**Ejemplo incorrecto (violación):**
```typescript
log.info("[AI] Módulo AI inicializado correctamente");  // ❌ Falta 🤖
```

### 20.4 Core Technology & Dependencies

| Aspecto | Decisión |
|---------|----------|
| **Provider default** | Ollama (local, vía API HTTP) para embeddings + chat. DeepSeek como alternativa cloud |
| **Embeddings** | Ollama `qwen3-embedding:8b` → pgvector `vector(4096)` en PostgreSQL |
| **Modelo Chat** | Ollama (modelo configurable vía `OLLAMA_MODEL`) |
| **RAG** | 3 retrievers: Platform docs (keyword), Forum posts (pgvector), Products (pgvector) |
| **Cache** | `CacheService` existente (Redis) con TTLs específicos para respuestas AI (1h) y embeddings (24h) |
| **Eventos** | `eventBus` + Socket.IO bridge (mismo patrón que notificaciones) |
| **Factory Pattern** | `AIProviderFactory` — registrar providers y crear instancias por nombre |
| **Feature Flags** | `config.ai.features.*` — cada feature se habilita individualmente vía `AI_FEATURE_*` |

### 20.5 AIProvider Interface

```typescript
// src/backend/modules/ai/providers/types.ts
interface AIProvider {
  readonly name: ProviderName;
  readonly availableFeatures: AIFeature[];

  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  streamChat?(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatResponse>;
  embed(text: string): Promise<EmbeddingResponse>;
  moderate?(content: string, options?: ModerationOptions): Promise<ModerationResult>;
  isAvailable(): Promise<boolean>;
}
```

**Provider implementations disponibles:**
| Provider | Chat | Streaming | Embeddings | Moderación | Visión | Dependencias |
|----------|------|-----------|------------|------------|--------|-------------|
| `ollama` | ✅ | ✅ | ✅ (vía `/api/embeddings`) | ✅ (vía prompt) | ❌ | `fetch()` nativo |
| `deepseek` | ✅ | ❌ | ✅ | ✅ (vía prompt) | ❌ | `fetch()` nativo |
| `openai` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Ninguna instalada |

### 20.6 Factory Pattern

```typescript
// src/backend/modules/ai/providers/factory.ts
const provider = AIProviderFactory.create("ollama", {
  baseUrl: config.ollama.baseUrl,
  model: config.ollama.chatModel,
});
// → Devuelve OllamaProvider configurado con timeout

// Para cambiar a DeepSeek:
AIProviderFactory.create("deepseek", {
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Para extender con un provider custom:
AIProviderFactory.registerProvider("miProvider", MiProviderClass);
```

### 20.7 IoC Conditional Initialization

```typescript
// src/backend/modules/ai/index.ts
const AI_ENABLED = process.env.AI_ENABLED === 'true';

let aiService: AIService | null = null;
// ... otros servicios null por defecto

if (AI_ENABLED) {
  const provider = AIProviderFactory.create(
    process.env.AI_PROVIDER || "ollama",
    { baseUrl: config.ollama.baseUrl },
  );
  aiService = new AIService(provider, aiRepository, ragService);
  // ... inicializar demás servicios
}

// Todos los servicios se exportan como null-safe
export { aiService, ragService, ... };
```

**Los módulos consumidores SIEMPRE deben hacer null-check:**
```typescript
if (config.ai.enabled && aiService) {
  const result = await aiService.chat(...);
}
// vs:
const result = await aiService?.chat(...) ?? fallback;
```

**NOTA**: Los módulos `product` y `forum` NO usan `aiService` para embeddings — tienen su propia instancia directa de `OllamaProvider` + `EmbeddingService` (shared). Esto es intencional para mantener el pipeline de embeddings desacoplado del módulo AI general.

### 20.8 Configuración Centralizada

```typescript
// src/config/config.ts
ai: {
  enabled: process.env.AI_ENABLED === 'true',
  provider: process.env.AI_PROVIDER || 'ollama',
  models: {
    chat: process.env.AI_MODEL_CHAT || 'deepseek-chat',
    embedding: process.env.AI_MODEL_EMBEDDING || 'deepseek-embedding',
  },
  features: {
    semanticSearch: process.env.AI_FEATURE_SEMANTIC_SEARCH === 'true' || false,
    chatbot: process.env.AI_FEATURE_CHATBOT === 'true' || false,
    vision: process.env.AI_FEATURE_VISION === 'true' || false,
    moderation: process.env.AI_FEATURE_MODERATION === 'true' || false,
    translation: process.env.AI_FEATURE_TRANSLATION === 'true' || false,
    forecasting: process.env.AI_FEATURE_FORECASTING === 'true' || false,
    pricing: process.env.AI_FEATURE_PRICING === 'true' || false,
  },
},
ollama: {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:8b',
  timeout: Number(process.env.OLLAMA_TIMEOUT) || 30000,
},
embedding: {
  batchSize: Number(process.env.EMBEDDING_BATCH_SIZE) || 10,
  dimensions: Number(process.env.EMBEDDING_DIMENSIONS) || 4096,
}
```

### 20.9 Activation Checklist

```bash
# 1. Configurar variables de entorno mínimas para Ollama
AI_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=qwen3-embedding:8b

# 2. Habilitar features específicas
AI_FEATURE_SEMANTIC_SEARCH=true   # Búsqueda semántica en foro + productos
AI_FEATURE_MODERATION=true         # Moderación de contenido en foro
AI_FEATURE_CHATBOT=true           # Chatbot IA en ChatWidget

# 3. Opcional: cambiar a DeepSeek
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# 4. Opcional: ajustar dimensiones de embedding
EMBEDDING_DIMENSIONS=4096
EMBEDDING_BATCH_SIZE=10
```

### 20.10 Provider Ollama — Detalles de Implementación

```typescript
// src/backend/modules/ai/providers/ollama.ts
export class OllamaProvider implements AIProvider {
  // Usa fetch() nativo — 0 dependencias externas
  // API HTTP de Ollama (localhost:11434)

  async chat(messages, options?) → ChatResponse
    // POST /api/chat
    // Soporta todos los modelos de Ollama (llama3, qwen, deepseek local, etc.)
    // Timeout configurable vía OLLAMA_TIMEOUT

  async streamChat(messages, options?) → AsyncGenerator<ChatResponse>
    // POST /api/chat con stream: true
    // Yield chunks progresivos para streaming UI

  async embed(text) → EmbeddingResponse
    // POST /api/embeddings
    // Modelo configurable vía OLLAMA_EMBEDDING_MODEL (default: qwen3-embedding:8b)
    // Retorna vector[4096] (configurable vía EMBEDDING_DIMENSIONS)

  async moderate(content) → ModerationResult
    // Prompt engineering sobre modelo de chat
    // Solicita JSON: { "flagged": boolean, "reason": string }
    // Temperature 0 para consistencia
    // Fallback: permite publicación si el parseo falla

  async isAvailable() → boolean
    // GET /api/tags con timeout 5s
    // Cachea resultado 60s
}
```

### 20.11 Provider DeepSeek — Detalles de Implementación

```typescript
// src/backend/modules/ai/providers/deepseek.ts
export class DeepSeekProvider implements AIProvider {
  // Usa fetch() nativo — 0 dependencias externas
  // API compatible con OpenAI (mismos endpoints /v1/chat/completions, /v1/embeddings)

  async chat(messages, options?) → ChatResponse
    // POST /v1/chat/completions
    // Retry con exponential backoff (3 intentos, delay: 1s → 2s → 4s)
    // Timeout configurable (default 30s)
    // Logging de tokens consumidos

  async embed(text) → EmbeddingResponse
    // POST /v1/embeddings
    // Retorna vector[1536] (deepseek-embedding)

  async moderate(content) → ModerationResult
    // Prompt engineering sobre deepseek-chat
    // Temperature 0 para consistencia
    // Parseo JSON con fallback seguro

  async isAvailable() → boolean
    // GET /v1/models con timeout 5s
    // Retorna true si response.ok
}
```

### 20.12 Integración con Módulos Existentes (ACTIVA)

| Módulo | Integración | Estado |
|--------|-------------|--------|
| `product.service.ts` | `searchProducts()` → si `semanticSearch`, usa pgvector + fallback ILIKE | ✅ Activo |
| `product.service.ts` | `getRelatedProducts()` → Tier 1: embeddings, Tier 2: labels, Tier 3: latest | ✅ Activo |
| `product.service.ts` | `createProduct()`, `updateProduct()` → genera embedding asíncrono | ✅ Activo |
| `forum.service.ts` | `getPosts()` → si `semanticSearch`, usa pgvector + fallback ILIKE | ✅ Activo |
| `forum.service.ts` | `getRelatedPosts()` → Tier 1: embeddings, Tier 2: labels, Tier 3: latest | ✅ Activo |
| `forum.service.ts` | `createPost()`, `editPost()` → genera embedding asíncrono | ✅ Activo |
| `forum.service.ts` | `createPost()`, `createAnswer()` → moderación vía `AIService` | ✅ Activo |
| `chat/ChatWidget.tsx` | Modo AI chatbot con streaming + RAG (gated por `AI_FEATURE_CHATBOT`) | ✅ Backend listo, frontend gated |
| `ProductModal` | `getRelatedProductsAction()` → productos relacionados vía embeddings | ✅ Activo |
| `PostPageClient` | `getRelatedPosts()` → posts relacionados vía embeddings | ✅ Activo |
| `ProductCreateModal` | `GenerateDescriptionButton` → descripciones vía `aiGenerateDescriptionAction` | ✅ Activo |
| `ProductEditModal` | `GenerateDescriptionButton` → descripciones vía `aiGenerateDescriptionAction` | ✅ Activo |
| `ProductDetailPanel` | `GenerateDescriptionButton` → descripciones vía `aiGenerateDescriptionAction` | ✅ Activo |

### 20.13 Frontend AI Components — Consumo desde Pages

Los componentes de IA en `src/frontend/components/ai/` son consumidos por los Page Parents:

```
Page Parent (page.tsx / page client)
  │
  ├── fetch data via Server Action + React Query
  │
  └── <RelatedPosts
        posts={data}
        title={translated_title}
        onPostClick={handleNavigation}
      />
```

**Variante con acciones (GenerateDescriptionButton):**
```
Page Parent (page.tsx)
  │
  ├── define Server Action wrapper:
  │     handleGenerate = async (name, categories, tags) => {
  │       const res = await aiGenerateDescriptionAction(name, categories, tags);
  │       if (res.error) throw new Error(res.error);
  │       return res.description;
  │     }
  │
  └── pasa el callback al modal/componente hijo:
        <ProductCreateModal
          onGenerateDescription={handleGenerate}
          ...
        />
```

**Patrón estricto:** El Page Parent siempre maneja:
1. Fetching de datos (Server Action + React Query)
2. Traducciones (vía `useLanguage()`)
3. Para componentes de acción: define el callback que envuelve la Server Action y lo pasa como prop
3. Handlers de navegación
4. Estados de loading/error
5. Renderizado condicional

El componente IA solo recibe props y renderiza.

### 20.14 Variables de Entorno

```bash
# AI Module (activado por defecto en producción)
AI_ENABLED=true
AI_PROVIDER=ollama

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=qwen3-embedding:8b
OLLAMA_TIMEOUT=15000

# Embeddings
EMBEDDING_DIMENSIONS=4096
EMBEDDING_BATCH_SIZE=10

# Feature flags (false por defecto)
AI_FEATURE_SEMANTIC_SEARCH=true
AI_FEATURE_MODERATION=true
AI_FEATURE_CHATBOT=false
AI_FEATURE_VISION=false
AI_FEATURE_TRANSLATION=false
AI_FEATURE_FORECASTING=false
AI_FEATURE_PRICING=false

# DeepSeek (alternativa cloud a Ollama)
DEEPSEEK_API_KEY=
AI_MODEL_CHAT=deepseek-chat
AI_MODEL_EMBEDDING=deepseek-embedding
```

### 20.15 Enlace a Documentación Externa

Para la visión completa de FASE IA, incluyendo el roadmap, casos de uso detallados y ejemplos hipotéticos, consultar:

```text
README.md — Sección "🚀 FASE IA — Agroecotopia AI-First"
```

---

## 21. Búsqueda Semántica (Embedding Vectorial — pgvector)

### 21.1 Arquitectura General

La búsqueda semántica se implementa como una **capa compartida** en `src/backend/modules/shared/embedding/` que abstrae pgvector + Ollama. Es consumida por los módulos de **Producto** y **Foro** mediante un patrón de servicio genérico.

```
src/backend/modules/shared/embedding/
├── index.ts                    ← Barrel exports
├── embedding.repository.ts     ← SQL pgvector (upsert, searchSimilar, counts)
├── embedding.service.ts        ← Ollama + disponibilidad + batch generation
├── embedding.utils.ts          ← orderByIds<T>()
└── embedding.types.ts          ← SimilarEntityResult, EmbeddingStats
```

```
┌────────────────────────────────────────────────────────────────┐
│              Capa Compartida — shared/embedding/                 │
│                                                                │
│  EmbeddingRepository  ── pgvector SQL (CRUD + cosine search)   │
│  EmbeddingService     ── Ollama, avail cache, batch generate   │
│  EmbeddingUtils       ── orderByIds<T>() reordena por IDs      │
└───────────────────────┬────────────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          ▼                            ▼
┌──────────────────┐    ┌────────────────────────┐
│ ProductEmbedding  │    │ ForumPostEmbedding      │
│ Service           │    │ Service                 │
│                   │    │                         │
│ - buildEmbedding  │    │ - buildEmbeddingText()  │
│   Text(producto)  │    │ - generateAll (SQL fp)  │
│ - generateAll     │    │ - searchSimilar (label  │
│   (SQL product)   │    │   filter, threshold     │
│ - searchSimilar   │    │   0.48)                 │
│   (storeId/cat,   │    └────────────────────────┘
│    threshold 0.6) │
└──────────────────┘
                    │
                    ▼
     ProductRepository / ForumRepository
          └─ getXByIds() usa orderByIds() shared

       Fallback: ILIKE textual si Ollama no disponible
```

### 21.2 Modelos de Datos (Prisma)

```prisma
model ProductEmbedding {
  productId  String   @unique
  embedding  Unsupported("vector(4096)")?
  product    Product  @relation(fields: [productId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([productId])
}

model ForumPostEmbedding {
  postId    String   @unique
  embedding Unsupported("vector(4096)")?
  post      ForumPost @relation(fields: [postId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([postId])
}
```

Ambos tienen el mismo schema: tabla de embedding con FK 1:1 y columna `vector(4096)`.

### 21.3 Flujo de Búsqueda Semántica (End-to-End)

```
Frontend (debounce 300ms)
  │
  ▼
Domain Service (product.service / forum.service)
  │ llama a embeddingService.searchSimilar(query, limit, minSimilarity)
  ▼
EmbeddingService.searchSimilar()
  │ 1. isAvailable() → verifica Ollama + embeddings existentes (caché 60s)
  │ 2. provider.embed(query) → Ollama genera vector[4096]
  │ 3. repository.searchSimilar(embedding, limit, minSimilarity)
  ▼
EmbeddingRepository.searchSimilar()
  │ SELECT entityId, 1 - (embedding <=> $1::vector) AS similarity
  │ FROM table WHERE embedding IS NOT NULL
  │   AND similarity > $2
  │ ORDER BY embedding <=> $1::vector
  │ LIMIT $3
  ▼
¿results.length > 0?
  ├─ SÍ → Domain Repository.getXByIds(ids)  ← orderByIds() preserva orden
  │        Devuelve entidades ordenadas por similitud
  └─ NO → Fallback: ILIKE textual (contains + mode: insensitive)
```

### 21.4 EmbeddingRepository — API

| Método | SQL | Propósito |
|--------|-----|-----------|
| `upsert(entityId, embedding)` | `INSERT ... ON CONFLICT DO UPDATE` | Crear o actualizar embedding |
| `delete(entityId)` | `DELETE WHERE entityId = $1` | Eliminar embedding |
| `findByEntityId(entityId)` | `SELECT embedding::text` | Obtener vector existente |
| `searchSimilar(embedding, limit, minSimilarity)` | `<=> cosine distance + WHERE similarity > $2` | Búsqueda por similitud |
| `countAll()` | `COUNT(*)` | Total de filas en la tabla |
| `countWithEmbedding()` | `COUNT(*) WHERE embedding IS NOT NULL` | Total con embedding generado |

**Constructor parametrizado:**
```typescript
new EmbeddingRepository('ProductEmbedding', 'productId')
new EmbeddingRepository('ForumPostEmbedding', 'postId')
// tableName y entityIdColumn permiten reutilizar la misma clase
```

### 21.5 EmbeddingService — API

| Método | Descripción |
|--------|-------------|
| `isAvailable()` | Verifica Ollama (`isAvailable`) + entidades con embedding (`countWithEmbedding`). Caché 60s. |
| `generateForEntity(entityId, text)` | Genera embedding vía Ollama + upsert en DB |
| `generateAll(fetchPending)` | Batch generation: recibe callback `(limit) => [{id, text}]` |
| `searchSimilar(query, limit = 20, minSimilarity = 0)` | Embed query → pgvector search |
| `countAll()` | Total de entidades (delega a repository) |
| `countWithEmbedding()` | Total con embedding (delega a repository) |
| `getStats(totalEntities)` | `{ total, withEmbedding, pending, percentage }` |

**Constructor:**
```typescript
const genericService = new EmbeddingService(repository, { batchSize: 10 });
```

### 21.6 orderByIds — Utility Compartida

```typescript
// src/backend/modules/shared/embedding/embedding.utils.ts
export function orderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const map = new Map(items.map(i => [i.id, i]));
  return ids.map(id => map.get(id)).filter((x): x is T => x !== undefined);
}
```

Usada en:
- `ProductRepository.getProductsByIds()` — mantiene orden de similitud semántica
- `ForumRepository.getPostsByIds()` — mantiene orden de similitud semántica

### 21.7 Domain Services — Mínimo Código Específico

Cada módulo de dominio implementa solo el código que NO puede ser genérico:

**ProductEmbeddingService** (único: ~30 líneas):
- `buildEmbeddingText(product)` — texto con nombre, categorías, tipo, descripción
- Callback de `generateAll` — SQL con join a categorías
- `searchSimilar` — filtros adicionales por `storeId` y `categories`
- Threshold: `0.6`

**ForumPostEmbeddingService** (único: ~35 líneas):
- `buildEmbeddingText(post)` — texto con título, etiquetas, cuerpo
- Callback de `generateAll` — SQL simple sobre forumPost
- `searchSimilar` — filtro adicional por `labels`
- Threshold: `0.48` (modelo qwen3-embedding:8b tiene menor densidad de similitud)

**Wrapper methods (~14 líneas idénticas por módulo):**
```typescript
async isSemanticSearchAvailable() { return this.genericService.isAvailable(); }
async getStats() { return this.genericService.getStats(await this.genericService.countAll()); }
```
Estos wrappers existen por encapsulación (no exponer `genericService` al exterior).

### 21.8 Configuración

```typescript
// src/config/config.ts
ollama: {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:8b',
  timeout: 30000,
},
embedding: {
  batchSize: 10,
},
ai: {
  features: {
    semanticSearch: true,  // ← habilitado por defecto
  },
}
```

### 21.9 DRY Score

| Aspecto | Producto | Foro |
|---|---|---|
| Infraestructura (pgvector, Ollama, avail cache) | 100% compartido | 100% compartido |
| `countAll()` / `countWithEmbedding()` | vía `genericService` | vía `genericService` |
| `orderByIds()` | shared utility | shared utility |
| Wrappers de conveniencia (~14 líneas) | ⚠️ necesarios para encapsulación | ⚠️ necesarios para encapsulación |
| Código de dominio único | `buildEmbeddingText`, SQL, filtros storeId/cat | `buildEmbeddingText`, SQL, filtros labels |
| **Score** | **~85% DRY** | **~85% DRY** |

### 21.10 Variables de Entorno

```bash
# Ollama (Embeddings)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=qwen3-embedding:8b
```

### 21.11 Seed de Embeddings

```bash
npx tsx scripts/seed-forum-posts.ts        # Seed posts + embeddings del foro
```

El script `scripts/seed-forum-posts.ts` genera embeddings para todos los posts sin embedding usando `ForumPostEmbeddingService.generateAll()`.
