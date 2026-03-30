---
name: developer
description: Project specifications and architectural guidelines for maintaining integrity and consistent code structure.
---

# Project Architecture & Developer Guidelines

This skill defines the technical standards and architectural patterns for the **Agroecotopia** project. All developers (human and AI) MUST follow these guidelines to ensure consistency, maintainability, and scalability.

## 1. Core Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router).
- **Language**: [TypeScript](https://www.typescriptlang.org/).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first).
- **State Management**: [React Context API](https://react.dev/reference/react/createContext).
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (base) + Custom Components.
- **Icons**: [Lucide React](https://lucide.dev/).

---

## 2. Layered Architecture (UI → CTRL → SVC → REPO → DB)

The project follows a strict **layered architecture** to enforce separation of concerns. Each layer has a single responsibility and can **only call the layer immediately below it**.

### 2.1 Layer Overview

```
┌─────────────────────────────────────────────────────┐
│  UI   │  Components & Pages (React/Next.js)         │
├───────┼─────────────────────────────────────────────┤
│  CTRL │  Server Actions / Route Handlers            │
├───────┼─────────────────────────────────────────────┤
│  SVC  │  Business Logic (pure functions/classes)    │
├───────┼─────────────────────────────────────────────┤
│  REPO │  Data Access (queries only)                 │
├───────┼─────────────────────────────────────────────┤
│  DB   │  Infrastructure (clients, connections)      │
└───────┴─────────────────────────────────────────────┘
```

### 2.2 Layer Details & File Locations

| Layer | Sigla | Path | Naming Convention | Description |
|-------|-------|------|-------------------|-------------|
| **UI** | `UI` | `src/app/`, `src/components/` | `page.tsx`, `PascalCase.tsx` | Pages, layouts, and React components. |
| **Controller** | `CTRL` | `src/actions/`, `src/app/api/` | `[entity].actions.ts`, `route.ts` | Server Actions and API Route Handlers. Entry points for backend logic. |
| **Service** | `SVC` | `src/services/` | `[entity].service.ts` | Pure business logic. No framework dependencies, no DB calls. |
| **Repository** | `REPO` | `src/repositories/` | `[entity].repository.ts` | Data access only. Contains all database queries. |
| **Database** | `DB` | `src/db/` | `client.ts`, `server.ts` | Infrastructure clients (Supabase, Stripe, etc.). |

### 2.3 Dependency Rules

> [!CAUTION]
> **NEVER violate the dependency direction.** Each layer can ONLY import from the layer directly below it:
> - `UI` (Client Components) → `CTRL` (Server Actions or API) OR `UI` (Server Components)
> - `CTRL` / `UI` (Server Components) → `SVC` (Business Logic)
> - `SVC` → `REPO` (Data Access)
> - `REPO` → `DB`
>
> **BOUNDARY RESTRICTION RULE**: Cross-layer imports (e.g., `UI` → `REPO`, `CTRL` → `DB`) are **strictly forbidden**. Server Components and Server Actions MUST ONLY interact with `src/services/`. They are permanently prohibited from importing or invoking `src/repositories/` directly.

### 2.4 Shared Resources (Exception)

The following directories are **shared** across all layers:
- `src/types/` — TypeScript interfaces and type definitions.
- `src/lib/` — Pure utility functions (e.g., `cn()` from shadcn).

---

## 3. Directory Structure

```
src/
├── app/                          ← UI (pages & layouts)
│   ├── api/                      ← CTRL (API Route Handlers)
│   │   └── [feature]/
│   │       └── route.ts
│   ├── cart/
│   │   └── page.tsx
│   ├── products/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── actions/                      ← CTRL (Server Actions)
│   └── [entity].actions.ts
│
├── services/                     ← SVC (Business Logic)
│   └── [entity].service.ts
│
├── repositories/                 ← REPO (Data Access)
│   └── [entity].repository.ts
│
├── db/                           ← DB (Infrastructure Clients)
│   ├── supabase/
│   │   ├── client.ts             ← Browser client
│   │   ├── server.ts             ← Server client (SSR)
│   │   └── middleware.ts         ← Edge client
│   └── stripe.ts
│
├── components/                   ← UI (Shared & Feature Components)
│   ├── ui/                       ← shadcn / primitivos
│   ├── home/                     ← Feature: Home page sections
│   ├── products/                 ← Feature: Product components
│   ├── checkout/                 ← Feature: Checkout components
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   └── Providers.tsx
│
├── architecture/
│   └── languages/                ← i18n system
│
├── assets/                       ← Static asset imports
├── context/                      ← React Context providers
├── hooks/                        ← Custom React hooks
├── lib/                          ← Utility functions
├── types/                        ← Centralized TypeScript types
│   ├── domain.types.ts           ← Domain-specific types
│   ├── database.types.ts         ← Auto-generated DB types
│   └── index.ts                  ← Barrel export
└── utils/                        ← Constants & static data
    ├── constants.ts
    └── productos/
```

---

## 4. Language Handling (i18n)

The application uses a custom internationalization (i18n) system based on React Context.

### Structure
- **Definition**: `src/architecture/languages/types.ts` defines the `Translations` interface.
- **Implementation**:
  - `src/architecture/languages/es/index.ts`: Spanish translations.
  - `src/architecture/languages/en/index.ts`: English translations.
- **Context Provider**: `src/context/LanguageContext.tsx`.

### Usage
To access translations in a client component:
```tsx
import { useLanguage } from "@/context/LanguageContext";

const { t, language, setLanguage } = useLanguage();

// Access a value:
return <h1>{t.hero.title}</h1>;
```

### Adding New Translations
1. Update `src/architecture/languages/types.ts` to include the new key in the `Translations` interface.
2. Add the corresponding translation in both Spanish (`es/index.ts`) and English (`en/index.ts`).

---

## 5. Theme & Styling

The application uses `next-themes` for theme management (Light/Dark mode).

### Configuration
- **Provider**: `ThemeProvider` in `src/components/Providers.tsx`.
- **Mode**: Uses the `class` attribute on the `<html>` tag.

### Usage
Use Tailwind's `dark:` prefix for dark mode styles:
```tsx
<div className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
  ...
</div>
```

Avoid hardcoding hex colors; prefer Tailwind utility classes or CSS variables defined in `src/app/globals.css`.

---

## 6. Type Centralization

All shared interfaces and types MUST be centralized to avoid circular dependencies and ensure a single source of truth.

### Location
- **Centralized Path**: `src/types/`.
- **Exports**: `src/types/index.ts` should export everything from other files in the same directory.

### Key Types
- `Product`: `src/types/product.ts`.
- `CartItem`, `CartContextType`: `src/types/cart.ts`.

> [!IMPORTANT]
> Never define domain-specific interfaces (like `Product`) directly inside components or context files. Always import them from `@/types`.

---

---

## 7. Database & ORM (Prisma)

The application uses **Supabase (PostgreSQL)** managed through **Prisma ORM**.
This removes the necessity for static `index.ts` files inside `utils/productos/`, as all product data now flows through the DB.

### Prisma Configuration
- **Schema File**: `prisma/schema.prisma`
- **Migrations path**: `prisma/migrations/`
- **Instance**: A singleton instance exists in `src/db/prisma.ts`. Never instantiate a `new PrismaClient()` directly; always import it from `src/db/prisma`.

### Repositories Concept
Queries to Prisma must live exclusively in the **Repository Layer** (`src/repositories/`).
Example for products:
- `src/repositories/product.repository.ts`

### Handling Prices and Images
- Database stores `price` as `Int` natively.
- Database stores `images` as a `String[]` of URLs (e.g. Supabase Storage URLs).
- When rendering prices in the browser, always use `formatPrice(value)` from `@/lib/utils` inside UI components.

---

## 8. Component Guidelines

### Client vs. Server Components
- Use **Server Components** by default for static data and SEO-critical sections.
- Use **Client Components** (`"use client"`) only when using hooks (`useState`, `useEffect`, `useContext`) or event listeners.

### Component Organization
- **Shared components**: `src/components/` (Navbar, Footer, Providers, etc.).
- **Feature components**: `src/components/[feature]/` (home/, products/, checkout/).
- **Primitive UI**: `src/components/ui/` (shadcn/ui components).

### UI Consistency
- Use the predefined design system (colors, typography, spacing).
- Prefer existing `shadcn/ui` components from `src/components/ui/`.
- Maintain a **Premium Aesthetic**: Subtle gradients, smooth transitions, and high-quality typography.

---

## 9. Best Practices

- **Naming**: Use PascalCase for components, camelCase for variables/functions, and kebab-case for filenames.
- **Backend file naming**: Use `[entity].[layer].ts` pattern (e.g., `product.service.ts`, `order.repository.ts`, `auth.actions.ts`).
- **Clean Code**: Keep components small and focused. Extract logic to custom hooks if it exceeds 30-40 lines.
- **Safety**: Always use optional chaining (`?.`) and nullish coalescing (`??`) when dealing with potentially undefined values (like translations or product properties).

---

## 10. Operational Rules

- **Browser Interaction**: Never interact directly with the browser to test or verify changes. Focus exclusively on the code implementation.
- **Verification**: Wait for the user to perform manual tests and provide feedback on the changes before proceeding with further adjustments.
