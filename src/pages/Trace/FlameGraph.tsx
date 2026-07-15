/**
 * Flame Graph SVG Component (icicle layout)
 * Pure SVG rendering with responsive layout and interactive features
 */

import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import type { SpanNode } from '@/types/trace';
import {
  flattenLayout,
  colorFor,
  formatDuration,
  relativeOffsetMs,
  isOrphan,
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

  // Layout calculation with ResizeObserver
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateLayout = () => {
      const width = container.clientWidth;
      setSvgWidth(width);
      const layout = flattenLayout(root, width);
      setRects(layout);
    };

    // Initial layout
    updateLayout();

    // Watch for size changes
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [root]);

  // Calculate SVG height from max depth
  const maxDepth = Math.max(...rects.map((r) => r.depth), 0);
  const svgHeight = (maxDepth + 1) * 22 + 2;

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

  const handleMouseLeave = () => {
    setHoverSpan(null);
  };

  const handleFocus = (span: SpanNode, e: React.FocusEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 320);
    const y = Math.min(rect.bottom + 5, window.innerHeight - 220);
    setHoverSpan(span);
    setTooltipPos({ x, y });
  };

  const handleBlur = () => {
    setHoverSpan(null);
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleKeyDown = (span: SpanNode, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSpanClick(span);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
        {rects.map((rect, index) => {
          const { span, x, y, width, height } = rect;
          const isSelected = span.span_id === selectedSpanId;
          const isError = span.is_error;
          const orphan = isOrphan(span);

          // Determine stroke styling
          let stroke = 'none';
          let strokeWidth = 0;
          let strokeDasharray = '';

          if (isError) {
            stroke = '#f5222d';
            strokeWidth = 2;
          } else if (orphan) {
            stroke = '#fa8c16';
            strokeWidth = 2;
            strokeDasharray = '4,2';
          }

          // Selected state takes highest priority (overrides error/orphan)
          if (isSelected) {
            stroke = '#000';
            strokeWidth = 2;
            strokeDasharray = '';
          }

          const ariaLabel = `${span.operation_name} ${formatDuration(span.latency_ms)}`;
          const tooltipId = `tooltip-${span.span_id}`;

          return (
            <rect
              key={`${span.span_id}-${index}`}
              x={x}
              y={y}
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
          );
        })}
      </svg>

      {/* Hover tooltip */}
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
