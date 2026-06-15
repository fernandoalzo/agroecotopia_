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
  logLevel: process.env.LOG_LEVEL || 'DEBUG',

  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Agrotopia',
    url: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
    port: Number(process.env.PORT || 3000),
  },

  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL,
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
    rules: [
      "Sé respetuoso con todos los miembros y fomenta el diálogo.",
      "Verifica si tu pregunta ya fue respondida en discusiones previas.",
      "Las preguntas debe ser relaconadas con el tema del foro, es decir, la agricultura."
    ],
    labels: {
      cultivos: ["café", "plátano", "cacao", "cítricos", "frutales", "hortalizas", "cereales", "leguminosas", "ornamentales", "cannabis"],
      suelos: ["arcilloso", "arenoso", "franco", "limoso", "sustrato"],
      clima: ["tropical", "seco", "templado", "húmedo", "frío"],
      temas: ["plagas", "riego", "nutrición", "poda", "cosecha"]
    },
    /** @desc Forum validation constraints shared by Zod schemas (client) and service layer (server) */
    validation: {
      /** @desc Constraints for creating/editing forum posts */
      post: {
        titleMin: 5,
        titleMax: 200,
        bodyMin: 10,
        labelsMin: 1,
        labelsMax: 5,
      },
      /** @desc Constraints for creating/editing answers and replies */
      answer: {
        contentMin: 10,
        contentMax: 2000,
      },
    } satisfies {
      post: { titleMin: number; titleMax: number; bodyMin: number; labelsMin: number; labelsMax: number };
      answer: { contentMin: number; contentMax: number };
    },
  },

  marketplace: {
    maxProductsPerStore: 50,
    maxStoresPerUser: 5,
    adminDefaultStoreName: "Agroecotopia Oficial",
  },

  ai: {
    enabled: process.env.AI_ENABLED === 'true',
    provider: (process.env.AI_PROVIDER || 'deepseek') as 'deepseek' | 'openai' | 'ollama',
    models: {
      chat: process.env.AI_MODEL_CHAT || 'deepseek-chat',
      embedding: process.env.AI_MODEL_EMBEDDING || 'deepseek-embedding',
    },
    features: {
      semanticSearch: false,
      chatbot: false,
      vision: false,
      moderation: false,
      translation: false,
      forecasting: false,
      pricing: false,
    },
  },

  cache: {
    redisUrl: process.env.REDIS_URL,
    enabled: process.env.CACHE_ENABLED !== 'false',
    defaultTTL: 60, // 60 segundos por defecto
    ttl: {
      productList: 60,
      productDetail: 120,
      categories: 300,
      categoryCounts: 120,
      searchResults: 60,
      forumPosts: 60,
      forumPostDetail: 30,
      forumAnswerDetail: 30,
      forumCommunityStats: 300,
      forumTopContributors: 300,
      forumTrendingLabels: 300,
      stockLock: 5,
      orderList: 60,
      orderDetail: 120,
      orderStatusCounts: 120,
      envioList: 60,
      envioDetail: 120,
      envioStatusCounts: 120,
    },
  },
} as const;

// Helper to assert that a configuration value is defined
export function getRequiredConfig<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Configuration Error: Missing required environment variable or config value for "${name}"`);
  }
  return value;
}
