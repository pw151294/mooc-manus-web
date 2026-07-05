/**
 * 贴底滚动 hook：用户在底部阈值内时新内容自动跟随；
 * 用户主动上滑越过阈值后锁定当前位置，不再强制滚底。
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UseStickToBottomOptions {
  /** 距离容器底部多少 px 内视为"贴底"，默认 64 */
  threshold?: number;
}

interface UseStickToBottomResult<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  bottomAnchorRef: RefObject<HTMLDivElement | null>;
  isPinned: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  forcePin: () => void;
}

export function useStickToBottom<T extends HTMLElement = HTMLDivElement>(
  options: UseStickToBottomOptions = {}
): UseStickToBottomResult<T> {
  const { threshold = 64 } = options;

  const containerRef = useRef<T | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const isPinnedRef = useRef(true);
  const [isPinned, setIsPinned] = useState(true);

  const updatePinned = useCallback((next: boolean) => {
    if (isPinnedRef.current !== next) {
      isPinnedRef.current = next;
      setIsPinned(next);
    }
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      if (!container) return;
      container.scrollTo({ top: container.scrollHeight, behavior });
      updatePinned(true);
    },
    [updatePinned]
  );

  const forcePin = useCallback(() => {
    updatePinned(true);
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [updatePinned]);

  // 监听用户滚动：根据距离底部判定是否处于贴底态
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
      updatePinned(distance <= threshold);
    };

    handleScroll(); // 初始判定一次
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold, updatePinned]);

  // 内容尺寸变化：仅在贴底态下跟随滚动
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (isPinnedRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(container);
    // 观察内部内容尺寸变化（新消息/工具卡片展开等）
    Array.from(container.children).forEach((child) => observer.observe(child));

    const mutationObserver = new MutationObserver(() => {
      Array.from(container.children).forEach((child) => observer.observe(child));
      if (isPinnedRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return { containerRef, bottomAnchorRef, isPinned, scrollToBottom, forcePin };
}
