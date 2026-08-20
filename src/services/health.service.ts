import type { ApiHealth } from '../types/ownerrez';
import { apiRequest } from './http';

/**
 * `GET /api/health` — the proxy's own sanity check. It never calls OwnerRez, so
 * it distinguishes "the proxy is unreachable" from "the proxy is up but its
 * OwnerRez credentials are missing", which is exactly the distinction the
 * catalog error state needs to give an honest message.
 */
export async function checkApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  return apiRequest<ApiHealth>('/api/health', { signal, timeoutMs: 6000 });
}
