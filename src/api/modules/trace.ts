/**
 * Trace API module
 * Provides list and detail operations with camelCase → snake_case conversion
 */

import request from '../request';
import type { TraceListDTO, TraceDetailDTO } from '../../types/trace';
import type { AxiosError } from 'axios';

/**
 * List traces with filters
 * Converts camelCase params → snake_case query string
 */
export async function listTraces(params: {
  conversationId?: string;
  agentName?: string;
  isError?: 'all' | 'true' | 'false';
  startTimeFrom?: number | null;
  startTimeTo?: number | null;
  page: number;
  pageSize: number;
}): Promise<TraceListDTO> {
  const queryParams: Record<string, string | number> = {};

  if (params.conversationId !== undefined) {
    queryParams.conversation_id = params.conversationId;
  }
  if (params.agentName !== undefined) {
    queryParams.agent_name = params.agentName;
  }
  // isError='all' means omit the param; 'true'/'false' send as string
  if (params.isError !== undefined && params.isError !== 'all') {
    queryParams.is_error = params.isError;
  }
  if (params.startTimeFrom !== undefined && params.startTimeFrom !== null) {
    queryParams.start_time_from = params.startTimeFrom;
  }
  if (params.startTimeTo !== undefined && params.startTimeTo !== null) {
    queryParams.start_time_to = params.startTimeTo;
  }
  queryParams.page = params.page;
  queryParams.page_size = params.pageSize;

  return request.get<TraceListDTO>('/api/traces', { params: queryParams });
}

/**
 * Structured result for getTraceDetailSafe
 */
export type GetTraceDetailResult =
  | { ok: true; data: TraceDetailDTO }
  | { ok: false; status: 404 | 500 | 'network' };

/**
 * Get trace detail with structured error handling (never throws)
 *
 * The error interceptor in request.ts rejects with AxiosError for non-2xx responses,
 * so we catch those here and map them to structured results.
 */
export async function getTraceDetailSafe(
  traceId: string,
  signal?: AbortSignal
): Promise<GetTraceDetailResult> {
  try {
    const data = await request.get<TraceDetailDTO>(`/api/trace/${traceId}`, { signal });
    return { ok: true, data };
  } catch (error) {
    // AbortError from signal cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, status: 'network' };
    }

    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError) {
      if (axiosError.response) {
        const status = axiosError.response.status;
        if (status === 404) {
          return { ok: false, status: 404 };
        }
        if (status >= 500 && status < 600) {
          return { ok: false, status: 500 };
        }
      }
      // No response (network failure, timeout, etc.)
      return { ok: false, status: 'network' };
    }

    return { ok: false, status: 'network' };
  }
}
