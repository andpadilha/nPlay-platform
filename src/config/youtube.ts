/**
 * YouTube Data API v3
 * Lê automaticamente a chave definida no arquivo .env
 */
export const YOUTUBE_API_KEY =
  import.meta.env.VITE_YOUTUBE_API_KEY ?? "";