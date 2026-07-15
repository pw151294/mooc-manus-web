/**
 * Trace API module
 * Provides list and detail operations with camelCase → snake_case conversion
 */

import request from '../request';
import axios from 'axios';
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
 * Uses a separate axios instance to bypass the error interceptor's automatic toast messages,
 * allowing this function to handle errors gracefully without user-facing toasts.
 */
export async function getTraceDetailSafe(
  traceId: string,
  signal?: AbortSignal
): Promise<GetTraceDetailResult> {
  console.log('[getTraceDetailSafe] Starting request for traceId:', traceId);
  console.log('[getTraceDetailSafe] Signal aborted?', signal?.aborted);

  try {
    // Use axios directly to bypass request interceptors
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const url = `${baseURL}/api/trace/${traceId}`;
    console.log('[getTraceDetailSafe] Request URL:', url);

    const response = await axios.get<TraceDetailDTO>(url, {
      signal,
      timeout: 30000,
    });

    console.log('[getTraceDetailSafe] Response status:', response.status);
    console.log('[getTraceDetailSafe] Response data:', response.data);

    return { ok: true, data: response.data };
  } catch (error) {
    console.error('[getTraceDetailSafe] Error caught:', error);

    // AbortError from signal cancellation
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[getTraceDetailSafe] Request was aborted');
      return { ok: false, status: 'network' };
    }

    if (error instanceof Error && error.name === 'CanceledError') {
      console.log('[getTraceDetailSafe] Request was canceled (axios CanceledError)');
      return { ok: false, status: 'network' };
    }

    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError && axiosError.response) {
      const status = axiosError.response.status;
      console.log('[getTraceDetailSafe] Axios error status:', status);
      if (status === 404) {
        return { ok: false, status: 404 };
      }
      if (status >= 500 && status < 600) {
        return { ok: false, status: 500 };
      }
    }

    // Network error (no response received)
    console.log('[getTraceDetailSafe] Network error');
    return { ok: false, status: 'network' };
  }
}
