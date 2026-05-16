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
- **Database**: Prisma ORM (`@prisma/client`).

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
│  DB   │  Infrastructure (Prisma DB)                 │
└───────┴─────────────────────────────────────────────┘
```

### 2.2 Layer Details & File Locations

| Layer | Path | Naming Convention | Description |
|-------|------|-------------------|-------------|
| **UI** | `src/app/`, `src/components/` | `page.tsx`, `PascalCase.tsx` | Pages, layouts, and React components. |
| **Controller** | `src/backend/modules/[domain]/` | `[domain].actions.ts` | Server Actions (Transport layer). Exposed to UI. |
| **Service** | `src/backend/modules/[domain]/` | `[domain].service.ts` | Pure business logic. Agnostic of Next.js HTTP/Actions. |
| **Repository** | `src/backend/modules/[domain]/` | `[domain].repository.ts` | Data access only (Prisma queries). |
| **Database** | `src/backend/prisma/`, `src/backend/db/` | `schema.prisma` | DB schemas and client instances. |

### 2.3 Dependency Rules (STRICT LAW)

> [!CAUTION]
> **NEVER violate the dependency direction.** Each layer can ONLY import from the layer directly below it:
> - `UI` (Client/Server Components) → `CTRL` (Server Actions)
> - `CTRL` (Server Actions) → `SVC` (Business Logic)
> - `SVC` → `REPO` (Data Access)
> - `REPO` → `DB` (Prisma)
>
> **BOUNDARY RESTRICTION RULE**: Cross-layer imports (e.g., `UI` → `REPO`, `CTRL` → `REPO`) are **strictly forbidden**. UI components MUST NOT import Prisma clients or perform DB queries directly. 

---

## 3. Directory Structure

```text
src/
├── app/                          ← UI (App Router: pages & layouts)
│   ├── api/                      ← External API Route Handlers (v1)
│   ├── (routes)/                 ← (login, products, checkout, etc.)
│
├── backend/                      ← Encapsulated Backend Architecture
│   ├── db/                       ← DB Clients (e.g., Prisma singleton)
│   ├── modules/                  ← Domain Modules (auth, product, user, etc.)
│   │   └── [domain]/             
│   │       ├── [domain].actions.ts      ← CTRL layer
│   │       ├── [domain].service.ts      ← SVC layer
│   │       └── [domain].repository.ts   ← REPO layer
│   └── prisma/                   ← Prisma schema and migrations
│
├── components/                   ← UI (Shared & Feature Components)
│   ├── ui/                       ← shadcn / primitives
│   ├── [domain]/                 ← Domain specific UI (auth, products, checkout)
│
├── lib/                          ← Utility functions and guards (auth-guards.ts)
├── context/                      ← React Context providers (sync state)
├── hooks/                        ← Custom React hooks
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
- **Data Mutations**: Use Server Actions (`.actions.ts`) triggered either natively via form `action` or via React Query's `useMutation`.

---

## 6. Theme, Styling & UI

- The application uses `next-themes` (Light/Dark mode) and Tailwind CSS v4.
- Use `shadcn/ui` components from `src/components/ui/` as building blocks.
- **Premium Aesthetic Rule**: Do not create generic, simple MVPs. Use smooth gradients, hover effects, and `framer-motion` to maintain a professional, dynamic design.
- **Form Validation**: Always use `react-hook-form` coupled with `zod` (`@hookform/resolvers`) for robust form state and validation.

---

## 7. Testing & Quality Assurance (Standard)

To maintain and scale a professional architecture:
- **Unit Testing**: Business logic inside `*.service.ts` must be built to be testable in isolation. 
- **Type Safety**: Avoid `any` types. Rely exclusively on Prisma-generated types or strictly defined Zod schemas.

---

## 8. Operational Rules

- **Browser Interaction**: Never interact directly with the browser to test or verify changes. Focus exclusively on the code implementation.
- **Verification**: Wait for the user to perform manual tests and provide feedback on the changes before proceeding with further adjustments.
