/**
 * Utility functions for trace data processing and flame graph layout
 */

import dayjs from 'dayjs';
import type { SpanNode } from '@/types/trace';

/**
 * Format duration in milliseconds to human-readable string
 * - < 1000ms → "123ms" (rounded)
 * - < 60000ms → "1.23s" (2 decimals)
 * - ≥ 60000ms → "1.23min" (2 decimals)
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}min`;
}

/**
 * Format Unix nanosecond timestamp to 'YYYY-MM-DD HH:mm:ss.SSS'
 */
export function formatTimestamp(ns: number): string {
  const ms = ns / 1_000_000;
  return dayjs(ms).format('YYYY-MM-DD HH:mm:ss.SSS');
}

/**
 * Calculate relative offset in milliseconds from root span
 */
export function relativeOffsetMs(span: SpanNode, root: SpanNode): number {
  return (span.start_time - root.start_time) / 1_000_000;
}

/**
 * Check if a span is marked as orphan
 */
export function isOrphan(span: SpanNode): boolean {
  return span.tags?._orphan === true;
}

/**
 * Recursively find a span by ID in the tree
 */
export function findSpanById(root: SpanNode, id: number): SpanNode | null {
  if (root.span_id === id) {
    return root;
  }
  for (const child of root.children) {
    const found = findSpanById(child, id);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Color mapping for span types
 */
export const SPAN_TYPE_COLOR: Record<string, string> = {
  AGENT_ROOT: '#8c8c8c',
  AGENT_ROUND: '#1677ff',
  LLM_CALL: '#722ed1',
  TOOL_BATCH: '#fa8c16',
  TOOL_CALL: '#13c2c2',
  SUBAGENT_CALL: '#52c41a',
};

/**
 * Relevant tag keys for each span type
 */
export const SPAN_TYPE_TAG_MAP: Record<string, string[]> = {
  AGENT_ROOT: ['user.query', 'conversation_id', 'agent.name', 'message.id'],
  AGENT_ROUND: ['round.index', 'round.iterate_count'],
  LLM_CALL: [
    'llm.model',
    'llm.prompt_hash',
    'llm.tokens.prompt',
    'llm.tokens.completion',
    'llm.tokens.total',
  ],
  TOOL_BATCH: ['tool.batch.size', 'tool.batch.concurrent'],
  TOOL_CALL: [
    'tool.name',
    'tool.provider',
    'tool.arguments',
    'tool.result_preview',
    'tool.result_size',
  ],
  SUBAGENT_CALL: ['subagent.name', 'subagent.trace_id'],
};

/**
 * Get color for a span based on mode
 * - type: color by span type
 * - heat: color by latency ratio (blue/cold → red/hot)
 */
export function colorFor(span: SpanNode, mode: 'type' | 'heat', rootLatency: number): string {
  if (mode === 'type') {
    return SPAN_TYPE_COLOR[span.span_type] || '#bfbfbf';
  }
  // heat mode: normalize latency to [0, 1], map to HSL hue 210° (blue) → 0° (red)
  const ratio = Math.min(span.latency_ms / rootLatency, 1);
  const hue = 210 - 210 * ratio;
  return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Rectangle in flame chart timeline layout.
 * One span per row (DFS pre-order); x/width driven by [start_time, end_time]
 * relative to root span.
 */
export interface FlameRect {
  span: SpanNode;
  rowIndex: number;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlameLayoutOptions {
  svgWidth: number;
  labelColWidth: number;
  headerHeight: number;
  rowHeight: number;
  rowGap: number;
  hPadding: number;
  minRectWidth: number;
}

export const FLAME_LAYOUT_DEFAULTS: FlameLayoutOptions = {
  svgWidth: 0,
  labelColWidth: 240,
  headerHeight: 28,
  rowHeight: 24,
  rowGap: 2,
  hPadding: 16,
  minRectWidth: 2,
};

/**
 * Flatten span tree into flame chart timeline layout.
 *
 * Layout rules:
 * - Y = DFS pre-order row index (siblings sorted by start_time asc).
 *   Every span occupies its own row — never merged with siblings.
 * - X = fraction of root span's [start_time, end_time] window,
 *   offset by the sticky left label column.
 * - Row 0 sits directly under the sticky time-axis header.
 */
export function flattenLayout(root: SpanNode, options: FlameLayoutOptions): FlameRect[] {
  const { svgWidth, labelColWidth, headerHeight, rowHeight, rowGap, hPadding, minRectWidth } =
    options;

  const timeAxisWidth = Math.max(svgWidth - labelColWidth - hPadding * 2, 0);
  const rootDuration = Math.max(root.end_time - root.start_time, 1);
  const result: FlameRect[] = [];

  function traverse(span: SpanNode, depth: number): void {
    const xRatio = (span.start_time - root.start_time) / rootDuration;
    const widthRatio = (span.end_time - span.start_time) / rootDuration;

    const x = labelColWidth + hPadding + xRatio * timeAxisWidth;
    const width = Math.max(widthRatio * timeAxisWidth, minRectWidth);

    const rowIndex = result.length;
    const y = headerHeight + rowIndex * rowHeight;
    const height = rowHeight - rowGap;

    result.push({ span, rowIndex, depth, x, y, width, height });

    const sortedChildren = [...span.children].sort((a, b) => a.start_time - b.start_time);
    for (const child of sortedChildren) {
      traverse(child, depth + 1);
    }
  }

  traverse(root, 0);
  return result;
}

/**
 * Time-axis tick for the sticky header. `ratio` in [0, 1], `ms` = offset from root start.
 */
export interface TimeTick {
  ratio: number;
  ms: number;
  x: number;
}

export function buildTimeTicks(
  root: SpanNode,
  options: Pick<FlameLayoutOptions, 'svgWidth' | 'labelColWidth' | 'hPadding'>,
  steps = 4
): TimeTick[] {
  const { svgWidth, labelColWidth, hPadding } = options;
  const timeAxisWidth = Math.max(svgWidth - labelColWidth - hPadding * 2, 0);
  const rootDurationMs = Math.max(root.latency_ms, (root.end_time - root.start_time) / 1_000_000);
  const ticks: TimeTick[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const ratio = i / steps;
    ticks.push({
      ratio,
      ms: rootDurationMs * ratio,
      x: labelColWidth + hPadding + ratio * timeAxisWidth,
    });
  }
  return ticks;
}
