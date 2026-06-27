// src/api/sse.ts
import type { SSEEventType, SSEHandlers } from '@/types/sse';

class SSEClient {
  private eventSource: EventSource | null = null;
  private timeout: number = 60000; // 1分钟超时
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private isActive: boolean = false; // 防止重复订阅

  subscribe(url: string, handlers: SSEHandlers): void {
    // 防止重复订阅
    if (this.isActive) {
      throw new Error('SSE连接已存在,请先关闭');
    }

    this.eventSource = new EventSource(url);
    this.isActive = true;
    this.resetTimeout();

    // 连接建立回调
    this.eventSource.addEventListener('open', () => {
      console.log('SSE连接已建立');
      handlers.onOpen?.();
    });

    // 监听所有事件类型(包含完整11种)
    const eventTypes: SSEEventType[] = [
      'message',
      'message_end',
      'tool_call_start',
      'tool_call_complete',
      'tool_call_fail',
      'error',
      'done',
      'title',
      'plan_create_success',
      'step_start',
      'step_complete',
    ];

    eventTypes.forEach((type) => {
      this.eventSource!.addEventListener(type, (e: MessageEvent) => {
        this.resetTimeout(); // 收到消息重置超时

        // JSON解析容错
        try {
          const data = JSON.parse(e.data);
          handlers.onEvent(type, data);

          // done事件自动关闭
          if (type === 'done') {
            this.close();
            handlers.onComplete?.();
          }
        } catch (err) {
          console.error('SSE数据解析失败:', err, 'raw data:', e.data);
          handlers.onError?.(new Error('数据格式错误'));
        }
      });
    });

    // 错误处理
    this.eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      this.close();
      handlers.onError?.(error);
    };
  }

  private resetTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    this.timeoutTimer = setTimeout(() => {
      this.close();
      console.warn('SSE connection timeout');
    }, this.timeout);
  }

  close(): void {
    this.isActive = false;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export default SSEClient;
