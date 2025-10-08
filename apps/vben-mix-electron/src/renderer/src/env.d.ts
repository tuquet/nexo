// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAMESPACE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_ROUTER_HISTORY: string;
  readonly VITE_BASE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob: (pattern: string, options?: any) => Record<string, any>;
}
