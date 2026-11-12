/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SINAPI_UF?: string; // default "SC"
  readonly VITE_SINAPI_REGIME?: string; // default "NAO_DESONERADO"
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}