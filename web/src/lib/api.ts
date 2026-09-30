import { env } from '$env/dynamic/public';

/**
 * Base URL Python API (RAG/SOP).
 * Produksi: https://postit-ai.mahkotagroup.com (via PUBLIC_API_URL di web/.env).
 * Fallback hanya untuk dev lokal.
 */
const apiBase = env.PUBLIC_API_URL || env.DEV_PORT;

if (!apiBase) {
  throw new Error('PUBLIC_API_URL or DEV_PORT must be defined');
}

export const API_BASE = apiBase.replace(/\/+$/, '');

/** Endpoint streaming chat RAG. */
export const CHAT_ENDPOINT = `${API_BASE}/api/chat`;
