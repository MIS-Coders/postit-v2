import { env } from '$env/dynamic/public';

/**
 * Base URL Python API (RAG/SOP).
 * Produksi: https://postit-ai.mahkotagroup.com (via PUBLIC_API_URL di web/.env).
 * Fallback hanya untuk dev lokal.
 */
export const API_BASE = (env.PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

/** Endpoint streaming chat RAG. */
export const CHAT_ENDPOINT = `${API_BASE}/api/chat`;
