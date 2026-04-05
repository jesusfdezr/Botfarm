/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_X_CLIENT_ID: string;
  readonly VITE_X_REDIRECT_URI: string;
  readonly VITE_X_SCOPES: string;
  readonly VITE_OLLAMA_API_KEY: string;
  readonly VITE_OLLAMA_MODEL: string;
  readonly VITE_OLLAMA_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
