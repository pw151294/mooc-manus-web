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
 * Uses validateStatus to bypass the error interceptor's automatic toast messages,
 * allowing this function to handle errors gracefully without user-facing toasts.
 */
export async function getTraceDetailSafe(
  traceId: string,
  signal?: AbortSignal
): Promise<GetTraceDetailResult> {
  try {
    const response = await (request as any).request({
      method: 'GET',
      url: `/api/trace/${traceId}`,
      signal,
      validateStatus: () => true, // Accept all status codes, handle them manually
    });

    // Check status manually since we bypassed axios error handling
    if (response.status >= 200 && response.status < 300) {
      return { ok: true, data: response.data };
    }

    // Handle error status codes
    if (response.status === 404) {
      return { ok: false, status: 404 };
    }
    if (response.status >= 500 && response.status < 600) {
      return { ok: false, status: 500 };
    }

    // Other error status
    return { ok: false, status: 'network' };
  } catch (error) {
    // AbortError from signal cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, status: 'network' };
    }

    // Network error (no response received)
    return { ok: false, status: 'network' };
  }
}
