/**
 * Flame Chart (timeline) component for a Trace span tree.
 *
 * Layout: one span per row (DFS pre-order, siblings by start_time asc).
 *   ┌── header (sticky top) — time-axis ticks (0 / 25% / 50% / 75% / 100%)
 *   │
 *   ├── row 0 [ label col │ rect on timeline ]
 *   ├── row 1 …
 *   └── row N-1
 *
 * All spans are rendered — no merge, no truncation. Vertical scrolling
 * lives on the parent modal container; the header sticks to its top.
 */

import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import type { SpanNode } from '@/types/trace';
import {
  buildTimeTicks,
  colorFor,
  FLAME_LAYOUT_DEFAULTS,
  flattenLayout,
  formatDuration,
  isOrphan,
  relativeOffsetMs,
  type FlameRect,
} from './utils';

interface FlameGraphProps {
  root: SpanNode;
  selectedSpanId: number | null;
  colorMode: 'type' | 'heat';
  onSpanClick: (span: SpanNode) => void;
}

interface TooltipPos {
  x: number;
  y: number;
}

const LABEL_COL_WIDTH = FLAME_LAYOUT_DEFAULTS.labelColWidth;
const HEADER_HEIGHT = FLAME_LAYOUT_DEFAULTS.headerHeight;
const ROW_HEIGHT = FLAME_LAYOUT_DEFAULTS.rowHeight;
const H_PADDING = FLAME_LAYOUT_DEFAULTS.hPadding;
const INDENT_PER_DEPTH = 12;
const SELECTED_ROW_FILL = '#e6f4ff';
const ZEBRA_ROW_FILL = '#fafafa';
const GRID_STROKE = '#f0f0f0';

export default function FlameGraph({
  root,
  selectedSpanId,
  colorMode,
  onSpanClick,
}: FlameGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const [rects, setRects] = useState<FlameRect[]>([]);
  const [svgWidth, setSvgWidth] = useState(0);
  const [hoverSpan, setHoverSpan] = useState<SpanNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateLayout = () => {
      const width = container.clientWidth;
      setSvgWidth(width);
      setRects(
        flattenLayout(root, {
          ...FLAME_LAYOUT_DEFAULTS,
          svgWidth: width,
          headerHeight: 0,
        })
      );
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [root]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const bodyHeight = rects.length * ROW_HEIGHT + 2;
  const ticks =
    svgWidth > 0
      ? buildTimeTicks(root, { svgWidth, labelColWidth: LABEL_COL_WIDTH, hPadding: H_PADDING })
      : [];

  const handleMouseEnter = (span: SpanNode, e: React.MouseEvent) => {
    const x = Math.min(e.clientX + 10, window.innerWidth - 320);
    const y = Math.min(e.clientY + 10, window.innerHeight - 220);
    setHoverSpan(span);
    setTooltipPos({ x, y });
  };

  const handleMouseMove = (_span: SpanNode, e: React.MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const x = Math.min(e.clientX + 10, window.innerWidth - 320);
      const y = Math.min(e.clientY + 10, window.innerHeight - 220);
      setTooltipPos({ x, y });
    });
  };

  const handleMouseLeave = () => setHoverSpan(null);

  const handleFocus = (span: SpanNode, e: React.FocusEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 320);
    const y = Math.min(rect.bottom + 5, window.innerHeight - 220);
    setHoverSpan(span);
    setTooltipPos({ x, y });
  };

  const handleBlur = () => setHoverSpan(null);

  const handleKeyDown = (span: SpanNode, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSpanClick(span);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Sticky header — time-axis ticks stay pinned while body scrolls */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <svg width={svgWidth} height={HEADER_HEIGHT} style={{ display: 'block' }}>
          <line
            x1={LABEL_COL_WIDTH}
            x2={LABEL_COL_WIDTH}
            y1={0}
            y2={HEADER_HEIGHT}
            stroke={GRID_STROKE}
          />
          <text x={12} y={HEADER_HEIGHT / 2 + 4} fontSize={12} fill="#595959" fontWeight={600}>
            Span
          </text>
          {svgWidth > 0 && (
            <>
              <line
                x1={LABEL_COL_WIDTH + H_PADDING}
                x2={svgWidth - H_PADDING}
                y1={HEADER_HEIGHT - 6}
                y2={HEADER_HEIGHT - 6}
                stroke="#d9d9d9"
              />
              {ticks.map((tick) => (
                <g key={`tick-${tick.ratio}`}>
                  <line
                    x1={tick.x}
                    x2={tick.x}
                    y1={HEADER_HEIGHT - 10}
                    y2={HEADER_HEIGHT - 4}
                    stroke="#8c8c8c"
                  />
                  <text
                    x={tick.x}
                    y={HEADER_HEIGHT - 14}
                    textAnchor={tick.ratio === 0 ? 'start' : tick.ratio === 1 ? 'end' : 'middle'}
                    fontSize={11}
                    fill="#595959"
                  >
                    {formatDuration(tick.ms)}
                  </text>
                </g>
              ))}
            </>
          )}
        </svg>
      </div>

      {/* Body — one row per span, DFS order */}
      <svg
        width={svgWidth}
        height={bodyHeight}
        style={{ display: 'block' }}
        aria-label="Trace flame chart body"
      >
        {rects.map((rect) => {
          const isSelected = rect.span.span_id === selectedSpanId;
          const fill = isSelected
            ? SELECTED_ROW_FILL
            : rect.rowIndex % 2 === 1
              ? ZEBRA_ROW_FILL
              : 'transparent';
          if (fill === 'transparent') return null;
          return (
            <rect
              key={`row-bg-${rect.span.span_id}`}
              x={0}
              y={rect.y}
              width={svgWidth}
              height={ROW_HEIGHT}
              fill={fill}
            />
          );
        })}

        {ticks.map((tick) => (
          <line
            key={`grid-${tick.ratio}`}
            x1={tick.x}
            x2={tick.x}
            y1={0}
            y2={bodyHeight}
            stroke={GRID_STROKE}
            strokeDasharray="3,3"
          />
        ))}

        <line
          x1={LABEL_COL_WIDTH}
          x2={LABEL_COL_WIDTH}
          y1={0}
          y2={bodyHeight}
          stroke={GRID_STROKE}
        />

        {rects.map((rect) => {
          const { span, x, y, width, height, rowIndex, depth } = rect;
          const isSelected = span.span_id === selectedSpanId;
          const orphan = isOrphan(span);

          let stroke = 'none';
          let strokeWidth = 0;
          let strokeDasharray = '';
          if (span.is_error) {
            stroke = '#f5222d';
            strokeWidth = 2;
          } else if (orphan) {
            stroke = '#fa8c16';
            strokeWidth = 2;
            strokeDasharray = '4,2';
          }
          if (isSelected) {
            stroke = '#000';
            strokeWidth = 2;
            strokeDasharray = '';
          }

          const rowY = rowIndex * ROW_HEIGHT;
          const indent = Math.min(depth * INDENT_PER_DEPTH, LABEL_COL_WIDTH - 80);
          const displayName = span.operation_name || span.span_type;
          const ariaLabel = `${displayName} ${formatDuration(span.latency_ms)}`;
          const tooltipId = `tooltip-${span.span_id}`;

          return (
            <g key={`row-${span.span_id}`}>
              <foreignObject
                x={4 + indent}
                y={rowY + 2}
                width={LABEL_COL_WIDTH - 8 - indent}
                height={ROW_HEIGHT - 4}
              >
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    lineHeight: 1,
                    color: '#262626',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  title={`${displayName} · ${formatDuration(span.latency_ms)}`}
                  onClick={() => onSpanClick(span)}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: span.span_type === 'AGENT_ROOT' ? 600 : 400,
                    }}
                  >
                    {displayName}
                  </span>
                  <span style={{ color: '#8c8c8c', flexShrink: 0 }}>
                    {formatDuration(span.latency_ms)}
                  </span>
                </div>
              </foreignObject>

              <rect
                x={x}
                y={y + 1}
                width={width}
                height={height}
                fill={colorFor(span, colorMode, root.latency_ms)}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                style={{ cursor: 'pointer' }}
                onClick={() => onSpanClick(span)}
                onMouseEnter={(e) => handleMouseEnter(span, e)}
                onMouseMove={(e) => handleMouseMove(span, e)}
                onMouseLeave={handleMouseLeave}
                onFocus={(e) => handleFocus(span, e)}
                onBlur={handleBlur}
                tabIndex={0}
                role="button"
                aria-label={ariaLabel}
                aria-describedby={hoverSpan?.span_id === span.span_id ? tooltipId : undefined}
                onKeyDown={(e) => handleKeyDown(span, e)}
              />
            </g>
          );
        })}
      </svg>

      {hoverSpan && (
        <div
          id={`tooltip-${hoverSpan.span_id}`}
          role="tooltip"
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'pre-line',
          }}
        >
          {`${hoverSpan.span_type} · ${hoverSpan.operation_name}
耗时: ${formatDuration(hoverSpan.latency_ms)}
起始: +${formatDuration(relativeOffsetMs(hoverSpan, root))}
Span ID: ${hoverSpan.span_id}, Parent: ${hoverSpan.parent_span_id}${hoverSpan.is_error ? '\n[有错误]' : ''}${isOrphan(hoverSpan) ? '\n[孤儿]' : ''}`}
        </div>
      )}
    </div>
  );
}
