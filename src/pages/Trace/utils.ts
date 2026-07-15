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
 * Rectangle in flame graph layout
 */
export interface FlameRect {
  span: SpanNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

/**
 * Flatten span tree into flame graph layout (icicle style - root at top)
 *
 * Algorithm:
 * - Horizontal: spans positioned by start_time relative to root
 * - Vertical: row height 22px, root at top (depth 0)
 * - Margins: 16px left + 16px right
 * - Minimum width: 2px for visibility
 */
export function flattenLayout(root: SpanNode, width: number): FlameRect[] {
  const result: FlameRect[] = [];
  const usableWidth = width - 32; // 16px margins on each side
  const rootDuration = root.end_time - root.start_time;

  function traverse(span: SpanNode, depth: number): void {
    // Calculate horizontal position based on start_time
    const relativeStart = span.start_time - root.start_time;
    const spanDuration = span.end_time - span.start_time;

    const xRatio = relativeStart / rootDuration;
    const widthRatio = spanDuration / rootDuration;

    const x = xRatio * usableWidth + 16;
    let rectWidth = widthRatio * usableWidth;

    // Enforce minimum width
    if (rectWidth < 2) {
      rectWidth = 2;
    }

    const y = depth * 22;
    const height = 22 - 2; // 2px gap

    result.push({
      span,
      x,
      y,
      width: rectWidth,
      height,
      depth,
    });

    // Sort children by start_time before recursing
    const sortedChildren = [...span.children].sort((a, b) => a.start_time - b.start_time);

    for (const child of sortedChildren) {
      traverse(child, depth + 1);
    }
  }

  traverse(root, 0);
  return result;
}
