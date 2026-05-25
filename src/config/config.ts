/**
 * Centralized Application Configuration
 * All environment variables are accessed and typed here to avoid direct references to process.env throughout the codebase.
 */

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  enableLogging: true,

  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Agroecotopia',
    url: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  },

  auth: {
    secret: process.env.AUTH_SECRET,
    trustHost: process.env.AUTH_TRUST_HOST === 'true',
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    admin: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  },

  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  },

  chat: {
    enableE2EE: true,
  },

  forum: {
    labels: {
      cultivos: ["Hortalizas", "Frutales", "Cereales", "Leguminosas", "Ornamentales"],
      suelos: ["Arcilloso", "Arenoso", "Franco", "Limoso", "Sustrato"],
      clima: ["Tropical", "Seco", "Templado", "Húmedo", "Frío"],
      temas: ["Plagas", "Riego", "Nutrición", "Poda", "Cosecha"]
    }
  }
} as const;

// Helper to assert that a configuration value is defined
export function getRequiredConfig<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Configuration Error: Missing required environment variable or config value for "${name}"`);
  }
  return value;
}
