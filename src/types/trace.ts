/**
 * Trace type definitions for flame graph visualization
 * Wire DTOs strictly mirror backend Go json tags (snake_case)
 * Backend sources:
 * - tracing/span.go
 * - tracing/tree.go
 * - dtos/trace.go
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Log entry within a span (backend: tracing/span.go:30-35)
 */
export interface LogEntry {
  ts: number; // Unix ns
  level: LogLevel;
  msg: string;
  extra?: Record<string, unknown>;
}

export type SpanType =
  | 'AGENT_ROOT'
  | 'AGENT_ROUND'
  | 'LLM_CALL'
  | 'TOOL_BATCH'
  | 'TOOL_CALL'
  | 'SUBAGENT_CALL';

/**
 * Span node in trace tree (backend: tracing/tree.go:12-24)
 * Recursive structure with children array
 */
export interface SpanNode {
  span_id: number; // int32
  parent_span_id: number; // int32, -1 for root
  span_type: SpanType;
  operation_name: string;
  start_time: number; // Unix ns
  end_time: number; // Unix ns
  latency_ms: number; // int32
  is_error: boolean;
  tags: Record<string, unknown>; // may contain _orphan / _original_parent
  logs: LogEntry[];
  children: SpanNode[];
}

/**
 * Trace summary for list view (backend: dtos/trace.go:17-26)
 */
export interface TraceSummaryDTO {
  trace_id: string;
  conversation_id: string;
  agent_name: string;
  start_time: number; // Unix ns
  duration_ms: number; // int32
  span_count: number; // int32
  is_error: boolean;
  user_query_preview: string;
}

/**
 * Full trace detail with span tree (backend: dtos/trace.go:5-15)
 */
export interface TraceDetailDTO {
  trace_id: string;
  conversation_id: string;
  agent_name: string;
  start_time: number; // Unix ns
  end_time: number; // Unix ns
  duration_ms: number; // int32
  is_error: boolean;
  span_count: number; // int32
  root: SpanNode;
}

/**
 * Paginated trace list response (backend: dtos/trace.go:28-33)
 */
export interface TraceListDTO {
  total: number; // int64 (TS number sufficient)
  page: number;
  page_size: number;
  traces: TraceSummaryDTO[];
}

/**
 * Query parameters for trace list (backend: dtos/trace.go:35-43)
 */
export interface TraceListRequest {
  conversation_id?: string;
  agent_name?: string;
  is_error?: boolean;
  start_time_from?: number; // Unix ns
  start_time_to?: number; // Unix ns
  page?: number;
  page_size?: number;
}
