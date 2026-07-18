/**
 * ───────────────────────────────────────────────────────────
 *  Centralized Application Configuration
 * ───────────────────────────────────────────────────────────
 *
 *  SINGLE SOURCE OF TRUTH for all environment variables and
 *  runtime parameters. Every module reads its config from here.
 *
 *  RULES:
 *    1. Never reference `process.env` outside this file.
 *    2. Access via `config.<namespace>.<key>`.
 *    3. Use `getRequiredConfig()` for mandatory values.
 *    4. Document every section with the WHAT / WHY / DEFAULT.
 *
 *  ENV VAR NAMING CONVENTION:
 *    - NEXT_PUBLIC_* — exposed to the browser bundle.
 *    - UPPER_SNAKE_CASE — aligned with POSIX / Docker convention.
 * ───────────────────────────────────────────────────────────
 */

export const config = {
  // ─────────────────────────────────────────────────────────
  //  Runtime Environment
  // ─────────────────────────────────────────────────────────
  //  Determines behaviour: development enables HMR, verbose
  //  logging, relaxed CSP; production enables strict security
  //  and optimisation. Inferred from NODE_ENV.
  // ─────────────────────────────────────────────────────────

  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  /** Master switch for the entire logging system. Set false to silence all output. */
  enableLogging: true,

  /**
   * Minimum log level emitted to stdout.
   * Hierarchy: ERROR < WARN < INFO < DEBUG < LOG.
   * Defaults to DEBUG in dev, INFO in production.
   */
  logLevel: process.env.LOG_LEVEL || 'DEBUG',

  // ─────────────────────────────────────────────────────────
  //  Application Identity
  // ─────────────────────────────────────────────────────────
  //  Used for branding, constructing absolute URLs, and
  //  generating links in emails / notifications / redirects.
  // ─────────────────────────────────────────────────────────

  app: {
    /** Human-readable site name (used in <title>, emails, PWA manifest). */
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Agrotopia',

    /**
     * Canonical origin — no trailing slash.
     * Required for CSP, CORS, OAuth redirects, HSTS preload.
     * In production MUST be set to the real domain (e.g. https://example.com).
     */
    url: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''),

    /** Listening port for the monolith custom server (server.ts). */
    port: Number(process.env.PORT || 3000),
  },

  // ─────────────────────────────────────────────────────────
  //  WebSocket (Socket.IO)
  // ─────────────────────────────────────────────────────────
  //  Override for the WebSocket endpoint. If empty, the client
  //  connects to the same origin as the HTTP server (monolith).
  // ─────────────────────────────────────────────────────────

  websocket: {
    url: process.env.NEXT_PUBLIC_WS_URL,
  },

  // ─────────────────────────────────────────────────────────
  //  Authentication (NextAuth.js v5)
  // ─────────────────────────────────────────────────────────
  //  Manages session secrets, OAuth providers, and the default
  //  admin bootstrap account. Secrets are REQUIRED in production
  //  and must be kept outside version control.
  // ─────────────────────────────────────────────────────────

  auth: {
    /**
     * Encryption key for JWT cookies and CSRF tokens.
     * Generate with: `openssl rand -base64 32`.
     * Rotate every 90 days. Keep outside version control.
     */
    secret: process.env.AUTH_SECRET,

    /**
     * When true, disables host validation in NextAuth callbacks.
     * Safe behind a controlled reverse-proxy; avoid in multi-tenant.
     * Prefer setting AUTH_TRUST_HOST per-environment instead of
     * hardcoding `trustHost: true` in the auth module.
     */
    trustHost: process.env.AUTH_TRUST_HOST === 'true',

    google: {
      /** Google OAuth 2.0 client identifier. Created in Google Cloud Console. */
      clientId: process.env.GOOGLE_CLIENT_ID,
      /** Google OAuth 2.0 client secret. Treat as a credential — never log or commit. */
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },

    admin: {
      /** Email address of the auto-created admin account (bootstrapped in server.ts). */
      email: process.env.ADMIN_EMAIL,
      /**
       * Password for the auto-created admin account.
       * WARNING: the default "password" is INSECURE — change on first deploy.
       * Store in a secrets manager, not in .env committed to git.
       */
      password: process.env.ADMIN_PASSWORD,
    },
  },

  // ─────────────────────────────────────────────────────────
  //  Database (PostgreSQL via Prisma)
  // ─────────────────────────────────────────────────────────
  //  Connection strings for the Prisma ORM. The `directUrl` is
  //  used for migrations / direct queries; `url` is the main
  //  connection. Both must use SSL in production.
  // ─────────────────────────────────────────────────────────

  database: {
    /** Primary connection string used by Prisma Client at runtime. Format: postgresql://user:pass@host:port/db */
    url: process.env.DATABASE_URL,
    /** Direct connection string for migrations and pgvector raw queries. Usually the same as DATABASE_URL. */
    directUrl: process.env.DIRECT_URL,
  },

  // ─────────────────────────────────────────────────────────
  //  MercadoPago Payments
  // ─────────────────────────────────────────────────────────
  //  Live credentials for processing payments. The access token
  //  is used to create payment preferences; the webhook secret
  //  verifies incoming notification HMAC signatures. Both are
  //  REQUIRED for production payment processing.
  // ─────────────────────────────────────────────────────────

  mercadopago: {
    /** MercadoPago production access token. Created from the MercadoPago dashboard → Credentials. */
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    /**
     * HMAC-SHA256 shared secret for webhook verification.
     * Set in the MercadoPago Webhook configuration panel.
     * If empty, webhooks are accepted without signature validation (INSECURE — fix before production).
     */
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  },

  // ─────────────────────────────────────────────────────────
  //  Security Posture
  // ─────────────────────────────────────────────────────────
  //  Central governance for HTTP security headers, Content
  //  Security Policy, rate limiting, CORS, and cryptographic
  //  parameters. Change any value below or via its associated
  //  environment variable to alter the site-wide security
  //  stance without modifying source code.
  //
  //  REFERENCES:
  //    - OWASP Secure Headers Project
  //    - Mozilla Observatory
  //    - AWS Well-Architected Framework — Security Pillar
  //    - PCI DSS v4.0 Requirement 6.6
  // ─────────────────────────────────────────────────────────

  security: {
    /**
     * Master switch for all security headers (CSP, HSTS, XFO, etc.).
     * Set to `false` only temporarily for debugging mixed-content issues.
     * NEVER disable in production.
     * @default true
     */
    headersEnabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',

    // ── Content-Security-Policy ──────────────────────────
    //
    //  Controls which resources the browser is allowed to load.
    //  Each directive is a space-separated list of sources.
    //  The `extra*` arrays let you append origins for third-party
    //  services (payment gateways, analytics, CDNs) via env vars
    //  without modifying code.
    //
    //  DEFAULT VALUES are safe for a Next.js + Tailwind + Socket.IO
    //  architecture. Tighten `img-src` and `connect-src` once you
    //  know exactly which external hosts your application uses.
    //
    //  REFERENCE: developer.mozilla.org/en-US/docs/Web/HTTP/CSP
    // ──────────────────────────────────────────────────────

    csp: {
      /** Sources allowed for JavaScript execution. Next.js requires 'unsafe-inline' for RSC payload scripts. */
      scriptSrc: (process.env.CSP_SCRIPT_SRC || "'self' 'unsafe-inline' 'unsafe-eval'").split(' ').filter(Boolean),
      /** Sources allowed for stylesheets. Tailwind + shadcn/ui inject inline styles during hydration. */
      styleSrc: (process.env.CSP_STYLE_SRC || "'self' 'unsafe-inline'").split(' ').filter(Boolean),
      /** Origins the browser may connect to via fetch, XHR, WebSocket, EventSource. */
      connectSrc: (process.env.CSP_CONNECT_SRC || "'self' https: wss:").split(' ').filter(Boolean),
      /** Origins permitted to load pages in <frame>, <iframe>, <object>, <embed>. */
      frameSrc: (process.env.CSP_FRAME_SRC || "'self'").split(' ').filter(Boolean),
      /** Sources for images. Keep broad if users upload images to external CDNs. */
      imgSrc: (process.env.CSP_IMG_SRC || "'self' data: blob: https: http:").split(' ').filter(Boolean),
      /** Sources for web fonts. */
      fontSrc: (process.env.CSP_FONT_SRC || "'self' data:").split(' ').filter(Boolean),
      /** Restricts <form> action targets. Blocks exfiltration via form injection. */
      formAction: (process.env.CSP_FORM_ACTION || "'self'").split(' ').filter(Boolean),
      /**
       * Additional script origins appended to scriptSrc at build time.
       * Comma-separated env var. Example: "https://js.stripe.com,https://challenges.cloudflare.com"
       */
      extraScriptSrc: process.env.CSP_EXTRA_SCRIPT_SRC?.split(',').filter(Boolean) || [],
      /**
       * Additional connect origins. Comma-separated.
       * Example: "https://api.stripe.com,https://hooks.slack.com"
       */
      extraConnectSrc: process.env.CSP_EXTRA_CONNECT_SRC?.split(',').filter(Boolean) || [],
      /**
       * Additional frame origins. Comma-separated.
       * Example: "https://checkout.stripe.com,https://www.mercadopago.com.co"
       */
      extraFrameSrc: process.env.CSP_EXTRA_FRAME_SRC?.split(',').filter(Boolean) || [],
    },

    // ── Strict-Transport-Security ────────────────────────
    //
    //  Instructs browsers to always connect via HTTPS for the
    //  specified duration. Prevents SSL-stripping MITM attacks.
    //  The `preload` flag submits the domain to browser vendors
    //  for hardcoded HTTPS-only behaviour.
    //
    //  REFERENCE: developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
    // ──────────────────────────────────────────────────────

    hsts: {
      /** Lifetime in seconds. 63072000 = 2 years (max recommended for preload). */
      maxAge: Number(process.env.HSTS_MAX_AGE || 63072000),
      /** Apply HSTS to all subdomains (api.*, admin.*, www.*). */
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
      /** Request inclusion in browser preload lists (hstspreload.org). Irreversible once accepted. */
      preload: process.env.HSTS_PRELOAD !== 'false',
    },

    // ── Legacy Headers ───────────────────────────────────
    //
    //  Well-established headers that every security scanner
    //  checks. Most are now subsumed by CSP or COOP but are
    //  kept as defence-in-depth for older browsers.
    // ──────────────────────────────────────────────────────

    /** Prevents the page from being rendered in a <frame> or <iframe>. Effective against clickjacking. */
    xFrameOptions: process.env.X_FRAME_OPTIONS || 'DENY',
    /** Disables MIME-type sniffing. Forces browser to honour the Content-Type header. */
    xContentTypeOptions: process.env.X_CONTENT_TYPE_OPTIONS || 'nosniff',
    /** Controls how much referrer information is sent with cross-origin requests. */
    referrerPolicy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    /** Disables the legacy XSS Auditor (deprecated; kept for scanner compliance). */
    xXSSProtection: process.env.X_XSS_PROTECTION || '0',

    // ── Modern Isolation Headers ─────────────────────────
    //
    //  Mitigate Spectre / Meltdown side-channel attacks by
    //  isolating the browsing context from cross-origin pages.
    //  These are enforced by Chromium-based browsers.
    // ──────────────────────────────────────────────────────

    /** Isolates the browsing context. Pages with `same-origin` cannot be opened by cross-origin windows. */
    crossOriginOpenerPolicy: process.env.COOP_POLICY || 'same-origin',
    /** Prevents cross-origin loading of resources. Less restrictive than COOP; blocks speculative side-channels. */
    crossOriginResourcePolicy: process.env.CORP_POLICY || 'same-origin',

    // ── Permissions-Policy ──────────────────────────────
    //
    //  Granular control over browser API access. Denying
    //  sensor APIs by default reduces fingerprinting surface.
    //  Format: "<feature>=(<allowlist>)", where () denies all.
    // ──────────────────────────────────────────────────────

    permissionsPolicy: {
      camera: process.env.PERMISSIONS_CAMERA || '()',
      microphone: process.env.PERMISSIONS_MICROPHONE || '()',
      geolocation: process.env.PERMISSIONS_GEOLOCATION || '()',
      payment: process.env.PERMISSIONS_PAYMENT || '(self)',
    },

    // ── Rate Limiting ───────────────────────────────────
    //
    //  Distributed rate limiting backed by Redis with an
    //  automatic in-memory fallback. Each limiter governs a
    //  different attack vector:
    //    - global : anti-DDoS, all HTTP requests
    //    - auth   : brute-force login & registration
    //    - socket : chat spam prevention
    //
    //  Change these values to tighten or loosen throughput
    //  without restarting (values are read at startup).
    // ──────────────────────────────────────────────────────

    rateLimit: {
      global: {
        /** Maximum HTTP requests per IP within the duration window. Counts all non-static routes. */
        points: Number(process.env.RATE_LIMIT_GLOBAL_POINTS || 200),
        /** Duration of the sliding window in seconds. */
        duration: Number(process.env.RATE_LIMIT_GLOBAL_DURATION || 60),
      },
      auth: {
        /** Maximum login / registration attempts per IP within the window. */
        points: Number(process.env.RATE_LIMIT_AUTH_POINTS || 5),
        /** Lockout window in seconds after exceeding the limit. */
        duration: Number(process.env.RATE_LIMIT_AUTH_DURATION || 60),
      },
      socket: {
        /** Maximum chat messages per socket-ID within the window. */
        points: Number(process.env.RATE_LIMIT_SOCKET_POINTS || 2),
        /** Duration of the sliding window in seconds. */
        duration: Number(process.env.RATE_LIMIT_SOCKET_DURATION || 1),
      },
    },

    // ── Cryptographic Parameters ────────────────────────
    //
    //  Security / performance trade-offs for hashing and
    //  encryption. Increasing bcrypt rounds provides better
    //  resistance against offline brute-force at the cost of
    //  higher CPU usage during login.
    // ──────────────────────────────────────────────────────

    crypto: {
      /**
       * Bcrypt salt rounds for password hashing.
       *   10  → ~80 ms per hash (current default, adequate for most workloads)
       *   12  → ~320 ms per hash (recommended for high-security environments)
       *   14  → ~1.2 s per hash
       * Increasing beyond 12 is usually unnecessary for web apps.
       * REFERENCE: OWASP Password Storage Cheat Sheet
       */
      bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
    },

    // ── Anomaly Detection ────────────────────────────────
    //
    //  Login behaviour analysis engine. Tracks IPs, geolocation,
    //  time-of-day patterns, and device fingerprints per user to
    //  detect account takeover attempts.
    //
    //  THREE OPERATION MODES:
    //    disabled → engine not initialized (no Redis, no memory)
    //    monitor  → scores + stores + notifies, NEVER blocks access
    //    enforce  → scores + stores + notifies + BLOCKS high-risk logins
    //
    //  DEPENDENCY: Redis must be available. If Redis is down the
    //  engine silently disables itself (fail-open) and logs a warning.
    // ──────────────────────────────────────────────────────

    anomalyDetection: {
      /**
       * Operation mode.
       *   "disabled" — engine off, zero overhead.
       *   "monitor"  — detect + log + notify, but never block.
       *   "enforce"  — detect + log + notify + block when score > blockThreshold.
       * @default "monitor"
       */
      mode: (process.env.ANOMALY_DETECTION_MODE || 'monitor') as 'disabled' | 'monitor' | 'enforce',

      /**
       * Scoring thresholds (0.0 – 1.0).
       *   score > suspectThreshold → SUSPECT (user notified)
       *   score > blockThreshold  → BLOCK  (login denied in enforce mode)
       */
      thresholds: {
        suspect: Number(process.env.ANOMALY_SUSPECT_THRESHOLD || 0.4),
        block: Number(process.env.ANOMALY_BLOCK_THRESHOLD || 0.7),
      },

      /**
       * Signal weights. Must sum to 1.0.
       * Each weight represents the relative importance of a signal
       * in the final risk score. Adjust based on real-world false
       * positive rates.
       */
      weights: {
        unknownIp: Number(process.env.ANOMALY_WT_UNKNOWN_IP || 0.30),
        geoAnomaly: Number(process.env.ANOMALY_WT_GEO || 0.25),
        timeAnomaly: Number(process.env.ANOMALY_WT_TIME || 0.15),
        deviceAnomaly: Number(process.env.ANOMALY_WT_DEVICE || 0.10),
        ipReputation: Number(process.env.ANOMALY_WT_IP_REP || 0.10),
        velocity: Number(process.env.ANOMALY_WT_VELOCITY || 0.10),
      },

      /**
       * Geo-IP resolution for geographic anomaly detection.
       * Uses ip-api.com free tier (no API key required, 45 req/min limit).
       * Set enabled=false to skip geo lookups entirely.
       */
      geoIp: {
        enabled: process.env.ANOMALY_GEO_ENABLED === 'true',
      },

      /**
       * Alert channels for SUSPECT / BLOCK events.
       */
      alerts: {
        /** Send notification email to the affected user on SUSPECT events. */
        emailUser: process.env.ANOMALY_ALERT_USER !== 'false',
        /** Log to the internal admin anomalies stream (Redis list). */
        adminStream: process.env.ANOMALY_ALERT_ADMIN !== 'false',
      },
    },

    // ── WAF (Web Application Firewall) ────────────────────
    //
    //  Transversal security layer that evaluates every HTTP
    //  request against a configurable set of rules before
    //  it reaches the application. Runs in server.ts as a
    //  middleware and (optionally) as an Edge middleware.
    //
    //  THREE OPERATION MODES:
    //    disabled → WAF not initialized, zero overhead.
    //    monitor  → evaluates all rules, logs blocks but
    //               NEVER denies access. Sets X-WAF-Monitor
    //               header with triggered rule IDs.
    //    enforce  → evaluates all rules AND blocks requests
    //               that match blocking criteria.
    //
    //  RULE EVALUATION ORDER (fastest first):
    //    1. IP Blocklist      — O(n) CIDR match, no I/O
    //    2. Bot Detection     — headers only, no I/O
    //    3. Sensitive Paths   — path prefix check, no I/O
    //    4. Attack Patterns   — regex on path + query, no I/O
    //    5. Geoblock          — requires IP geo resolution API
    //
    //  DESIGN PRINCIPLES:
    //    - Fail-open: if geo resolution fails, geo rules
    //      are skipped (country = null → no match).
    //    - Memory-safe: geo results cached in local Map
    //      to avoid repeated API calls for same IP.
    //    - Observable: all blocks logged with ip, path,
    //      rule, and elapsed time.
    //    - Config-driven: every rule toggleable via env var.
    // ──────────────────────────────────────────────────────

    waf: {
      /**
       * Operation mode.
       *   "disabled" — WAF off, zero overhead.
       *   "monitor"  — evaluate + log, NEVER block.
       *   "enforce"  — evaluate + log + block.
       * @default "monitor"
       */
      mode: (process.env.WAF_MODE || 'monitor') as 'disabled' | 'monitor' | 'enforce',

      /** 
       * Anonymize IPs in the WAF monitor buffer by masking the last octet.
       * Default is false (show real IPs).
       */
      anonymizeIp: process.env.WAF_ANONYMIZE_IP === 'true',

      /** Live request monitor configuration */
      monitor: {
        /**
         * Maximum entries in the in-memory ring buffer.
         * Higher values retain more history at the cost of memory.
         * @default 1500
         */
        bufferSize: parseInt(process.env.WAF_MONITOR_BUFFER_SIZE || '1500', 10),

        /**
         * Maximum entries displayed in the admin UI.
         * @default 200
         */
        maxVisible: parseInt(process.env.WAF_MONITOR_MAX_VISIBLE || '200', 10),
      },
    },
  },

  // ─────────────────────────────────────────────────────────
  //  Real-Time Chat
  // ─────────────────────────────────────────────────────────
  //  Controls the Socket.IO-powered support chat, including
  //  End-to-End Encryption (Curve25519 + XSalsa20-Poly1305).
  //  When E2EE is disabled, messages are sent in plaintext
  //  (type: 0). When enabled, the client blocks delivery
  //  until encryption is ready and never falls back to
  //  plaintext.
  // ─────────────────────────────────────────────────────────

  chat: {
    /**
     * Global E2EE toggle. When true, all chat messages are
     * encrypted with tweetnacl before leaving the sender's
     * browser. Server-side key escrow enables self-healing
     * recovery across devices.
     * @default true
     */
    enableE2EE: true,
  },

  // ─────────────────────────────────────────────────────────
  //  Community Forum
  // ─────────────────────────────────────────────────────────
  //  User-generated content configuration: posting rules,
  //  taxonomy labels, and validation constraints shared
  //  between client-side Zod schemas and server-side
  //  validation. All user-facing values are in Spanish.
  // ─────────────────────────────────────────────────────────

  forum: {
    /** Rules displayed to users before publishing. Rendered in the post creation form. */
    rules: [
      "Sé respetuoso con todos los miembros y fomenta el diálogo.",
      "Verifica si tu pregunta ya fue respondida en discusiones previas.",
      "Las preguntas debe ser relaconadas con el tema del foro, es decir, la agricultura.",
    ],

    /** Hierarchical label taxonomy for categorising forum posts. Each group is a <select> option set. */
    labels: {
      cultivos: ["café", "plátano", "cacao", "cítricos", "frutales", "hortalizas", "cereales", "leguminosas", "ornamentales", "cannabis"],
      suelos: ["arcilloso", "arenoso", "franco", "limoso", "sustrato"],
      clima: ["tropical", "seco", "templado", "húmedo", "frío"],
      temas: ["plagas", "riego", "nutrición", "poda", "cosecha"],
    },

    /**
     * Validation constraints shared by client-side Zod schemas
     * and server-side service layer. Centralising these values
     * prevents drift between front-end and back-end validation.
     */
    validation: {
      post: {
        titleMin: 5,
        titleMax: 200,
        bodyMin: 10,
        labelsMin: 1,
        labelsMax: 5,
      },
      answer: {
        contentMin: 10,
        contentMax: 2000,
      },
    } satisfies {
      post: { titleMin: number; titleMax: number; bodyMin: number; labelsMin: number; labelsMax: number };
      answer: { contentMin: number; contentMax: number };
    },
  },

  // ─────────────────────────────────────────────────────────
  //  Marketplace Rules
  // ─────────────────────────────────────────────────────────
  //  Business constraints for sellers and stores. These
  //  limits prevent abuse and keep the platform manageable.
  // ─────────────────────────────────────────────────────────

  marketplace: {
    /** Maximum number of published products per store. Prevents catalogue spam. */
    maxProductsPerStore: 50,
    /** Maximum number of stores a single seller can create. Prevents store-front squatting. */
    maxStoresPerUser: 5,
  },

  // ─────────────────────────────────────────────────────────
  //  Artificial Intelligence
  // ─────────────────────────────────────────────────────────
  //  Feature flags and provider configuration for the AI
  //  module. Provider options: deepseek, openai, ollama.
  //  All features are independently toggleable.
  //
  //  PREREQUISITES before enabling AI:
  //    1. AI_ENABLED=true
  //    2. AI_PROVIDER set to one of the supported providers
  //    3. Provider API key configured in environment
  //    4. Embedding dimensions match the pgvector schema (4096)
  // ─────────────────────────────────────────────────────────

  ai: {
    /** Master switch. When false, all AI endpoints return 503. */
    enabled: process.env.AI_ENABLED === 'true',

    /** AI provider routing. Factory pattern resolves the concrete implementation at startup. */
    provider: (process.env.AI_PROVIDER || 'deepseek') as 'deepseek' | 'openai' | 'ollama',

    /** Model identifiers passed to the provider API. */
    models: {
      /** Chat/completions model (e.g. "deepseek-chat", "gpt-4o", "llama3.2"). */
      chat: process.env.AI_MODEL_CHAT || 'deepseek-chat',
      /** Text embedding model for pgvector semantic search. Must output vectors matching `embedding.dimensions`. */
      embedding: process.env.AI_MODEL_EMBEDDING || 'deepseek-embedding',
    },

    /**
     * API keys for each supported provider.
     * Access via config (not process.env) — guarantees a single source of truth,
     * prevents accidental exposure in stack traces, and enables centralized auditing.
     */
    apiKeys: {
      deepseek: process.env.DEEPSEEK_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      ollama: process.env.OLLAMA_API_KEY || '',
    },

    /** Individual feature toggles. Disabled features skip provider initialisation and reduce cold-start time. */
    features: {
      /** Semantic search over forum posts and products via pgvector cosine similarity. */
      semanticSearch: process.env.AI_FEATURE_SEMANTIC_SEARCH === 'true',
      /** Conversational chatbot for user-facing support and product recommendations. */
      chatbot: process.env.AI_FEATURE_CHATBOT === 'true',
      /** Image understanding (OCR, crop disease classification, label reading). */
      vision: process.env.AI_FEATURE_VISION === 'true',
      /** Pre-moderation of user-generated content before publishing. */
      moderation: process.env.AI_FEATURE_MODERATION === 'true',
      /** Multi-language translation for forum posts and product descriptions. */
      translation: process.env.AI_FEATURE_TRANSLATION === 'true',
      /** Demand forecasting for seller inventory planning. */
      forecasting: process.env.AI_FEATURE_FORECASTING === 'true',
      /** Dynamic pricing recommendations based on market data. */
      pricing: process.env.AI_FEATURE_PRICING === 'true',
    },
  },

  // ─────────────────────────────────────────────────────────
  //  Ollama (Local LLM)
  // ─────────────────────────────────────────────────────────
  //  Connection details for a self-hosted Ollama instance.
  //  Used when AI_PROVIDER=ollama. The base URL typically
  //  points to a local network server with GPU acceleration.
  // ─────────────────────────────────────────────────────────

  ollama: {
    /** Ollama server endpoint. Default points to a LAN server at 192.168.1.2:11434. */
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://192.168.1.2:11434',
    /** Model identifier for embedding generation. Must output vectors matching the schema dimensionality. */
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'qwen3-embedding:8b',
    /** Maximum wait time for Ollama responses in milliseconds. 60s default accounts for cold-start model loading. */
    timeout: Number(process.env.OLLAMA_TIMEOUT || 60000),
  },

  // ─────────────────────────────────────────────────────────
  //  Embedding / pgvector
  // ─────────────────────────────────────────────────────────
  //  Configuration for the PostgreSQL pgvector extension.
  //  All embedding vectors share a single dimensionality
  //  defined here. Changing dimensions requires re-indexing
  //  all existing embeddings in the database.
  // ─────────────────────────────────────────────────────────

  embedding: {
    /** Vector dimensionality. Must match the Prisma schema (`vector(N)`) and the provider's output size. */
    dimensions: Number(process.env.EMBEDDING_DIMENSIONS || 4096),
    /** Number of entities processed per batch during bulk embedding generation. */
    batchSize: Number(process.env.EMBEDDING_BATCH_SIZE || 10),
  },

  // ─────────────────────────────────────────────────────────
  //  Distributed Cache (Redis)
  // ─────────────────────────────────────────────────────────
  //  Cache-Aside pattern: repositories check Redis before
  //  querying PostgreSQL. If Redis is unavailable the system
  //  degrades gracefully (bypasses cache, reads from DB).
  //
  //  TTLs are intentionally short (30-300 s) — the cache is
  //  a performance accelerator, not a data store. Invalidations
  //  use broad pattern deletes (e.g. `cache:product:*`) to
  //  guarantee consistency.
  // ─────────────────────────────────────────────────────────

  cache: {
    /** Redis connection string. Empty = cache disabled. Format: redis[s]://[[user]:pass@]host[:port]. */
    redisUrl: process.env.REDIS_URL,

    /** Global cache master switch. When false, all get/set operations become no-ops. */
    enabled: process.env.CACHE_ENABLED !== 'false',

    /** Fallback TTL when no domain-specific TTL is provided. */
    defaultTTL: 60,

    /** Per-domain TTL values in seconds. Tune according to data volatility. */
    ttl: {
      productList: 60,           // Product catalogue pages — high churn
      productDetail: 120,        // Individual product view — medium churn
      categories: 300,           // Category tree — very low churn
      categoryCounts: 120,       // Product count per category — low churn
      searchResults: 60,         // Search queries — high churn
      productRelated: 120,       // Related product suggestions — medium churn
      forumPosts: 60,            // Forum post listings — high churn
      forumPostDetail: 30,       // Single post view — real-time sensitive
      forumAnswerDetail: 30,     // Answers within a post — real-time sensitive
      forumCommunityStats: 300,  // Leaderboard, user counts — very low churn
      forumTopContributors: 300, // Top contributors list — very low churn
      forumTrendingLabels: 300,  // Trending topic labels — very low churn
      forumRelated: 120,         // Related post suggestions — medium churn
      stockLock: 5,              // Distributed stock lock TTL — must be short for concurrency
      orderList: 60,             // Order history pages — high churn
      orderDetail: 120,          // Single order view — medium churn
      orderStatusCounts: 120,    // Aggregate order status stats — low churn
      envioList: 60,             // Shipment listing — high churn
      envioDetail: 120,          // Single shipment view — medium churn
      envioStatusCounts: 120,    // Aggregate shipment status stats — low churn
      productRatingList: 60,     // Product rating listings — high churn
      productRatingDetail: 120,  // Single user-product rating — medium churn
      productRatingPending: 60,  // Pending ratings per user — high churn
    },
  },
} as const;

// ─────────────────────────────────────────────────────────
//  Required Configuration Helper
// ─────────────────────────────────────────────────────────
//  Wraps a config value and throws immediately at startup
//  if the value is missing. Use for secrets and connection
//  strings that MUST be present in production.
//
//  Example:
//    const secret = getRequiredConfig(config.auth.secret, "AUTH_SECRET");
// ─────────────────────────────────────────────────────────

export function getRequiredConfig<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Configuration Error: Missing required environment variable or config value for "${name}"`);
  }
  return value;
}
