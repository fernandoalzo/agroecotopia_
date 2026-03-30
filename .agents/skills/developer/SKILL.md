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

## 2. Language Handling (i18n)

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

## 3. Theme & Styling

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

## 4. Type Centralization

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

## 5. Product Management

Products are defined as constants to ensure fast loading and easy maintenance without a complex database for the static version.

### Directory Structure
`src/utils/productos/[product-slug]/index.ts`

Each product folder should contain:
- `index.ts`: Exported `product` object of type `Product`.

### Media Assets
- Photos are stored in `public/products/[slug]/photos/`.
- References in code should use the absolute path: `"/products/[slug]/photos/1.png"`.

### Aggregation
All products are aggregated in `src/utils/productos/index.ts`. When adding a new product, it must be imported and added to the `productsList` array in this file.

---

## 6. Component Guidelines

### Client vs. Server Components
- Use **Server Components** by default for static data and SEO-critical sections.
- Use **Client Components** (`"use client"`) only when using hooks (`useState`, `useEffect`, `useContext`) or event listeners.

### UI Consistency
- Use the predefined design system (colors, typography, spacing).
- Prefer existing `shadcn/ui` components from `src/components/ui/`.
- Maintain a **Premium Aesthetic**: Subtle gradients, smooth transitions, and high-quality typography.

---

## 7. Best Practices

- **Naming**: Use PascalCase for components, camelCase for variables/functions, and kebab-case for filenames.
- **Clean Code**: Keep components small and focused. Extract logic to custom hooks if it exceeds 30-40 lines.
- **Safety**: Always use optional chaining (`?.`) and nullish coalescing (`??`) when dealing with potentially undefined values (like translations or product properties).

---

## 8. Operational Rules

- **Browser Interaction**: Never interact directly with the browser to test or verify changes. Focus exclusively on the code implementation.
- **Verification**: Wait for the user to perform manual tests and provide feedback on the changes before proceeding with further adjustments.
