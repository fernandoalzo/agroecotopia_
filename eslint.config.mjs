import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/backend/modules/**/*.service.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/backend/db/prisma",
              message: "Los services no pueden importar Prisma directamente. Mueve el acceso a datos al repository del módulo.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/backend/db/prisma",
              message: "Las API routes no pueden acceder a Prisma directamente. Delega en actions/services/repositories.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/frontend/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/backend/db/prisma",
              message: "La UI no puede acceder a Prisma directamente.",
            },
          ],
          patterns: [
            {
              group: ["@/backend/db/*"],
              message: "La UI no puede acceder a infraestructura de base de datos.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/frontend/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/backend/modules/**"],
              message: "Los componentes hijos deben ser presentacionales; recibe datos y callbacks por props desde el padre.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
