/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_MOCK_DATA: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_DEFAULT_LANGUAGE: string
  readonly VITE_THEME: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_CACHE_DURATION: string
  readonly VITE_PAGINATION_SIZE: string
  readonly VITE_DEBOUNCE_DELAY: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_AUTO_LOGOUT_WARNING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}