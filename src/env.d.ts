interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly DB_POOL_MAX?: string;
  readonly AUTH_SECRET: string;
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly EMAIL_FROM: string;
  readonly RESEND_API_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly NODE_ENV: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
