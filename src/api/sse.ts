// src/api/sse.ts
import type { SSEEventData, SSEEventType, SSEHandlers } from '@/types/sse';

interface SSESubscribeOptions {
  url: string;
  body?: unknown;
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
}

const KNOWN_EVENT_TYPES: ReadonlyArray<SSEEventType> = [
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
const KNOWN_EVENT_TYPE_SET = new Set<string>(KNOWN_EVENT_TYPES);

class SSEClient {
  private abortController: AbortController | null = null;
  private timeout: number = 60000;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private isActive: boolean = false;

  subscribe(options: SSESubscribeOptions, handlers: SSEHandlers): void {
    if (this.isActive) {
      throw new Error('SSE连接已存在,请先关闭');
    }

    const { url, body, method = 'POST', headers } = options;
    this.abortController = new AbortController();
    this.isActive = true;
    this.resetTimeout();

    const init: RequestInit = {
      method,
      signal: this.abortController.signal,
      headers: {
        Accept: 'text/event-stream',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {}),
      },
    };
    if (method === 'POST' && body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    fetch(url, init)
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE 请求失败: HTTP ${response.status}`);
        }
        handlers.onOpen?.();
        await this.readStream(response.body, handlers);
        // 服务端正常结束流（无 done 事件时也走 onComplete）
        if (this.isActive) {
          this.close();
          handlers.onComplete?.();
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error('SSE连接错误:', err);
        this.close();
        const error = err instanceof Error ? err : new Error(String(err));
        handlers.onError?.(error);
      });
  }

  private async readStream(
    stream: ReadableStream<Uint8Array>,
    handlers: SSEHandlers
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // 处理最后一段未跟随空行的残留
        const remainder = buffer.trim();
        if (remainder) {
          this.dispatchFrame(remainder, handlers);
        }
        break;
      }
      this.resetTimeout();
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = this.findFrameSeparator(buffer);
      while (separatorIndex !== -1) {
        const frame = buffer.slice(0, separatorIndex.index);
        buffer = buffer.slice(separatorIndex.index + separatorIndex.length);
        if (frame.trim()) {
          this.dispatchFrame(frame, handlers);
          if (!this.isActive) {
            // done 事件触发了 close,提前退出
            return;
          }
        }
        separatorIndex = this.findFrameSeparator(buffer);
      }
    }
  }

  // SSE 帧之间用空行分隔,既要支持 \n\n,也要兼容 \r\n\r\n
  private findFrameSeparator(buffer: string): { index: number; length: number } | -1 {
    const lf = buffer.indexOf('\n\n');
    const crlf = buffer.indexOf('\r\n\r\n');
    if (lf === -1 && crlf === -1) return -1;
    if (crlf === -1 || (lf !== -1 && lf < crlf)) return { index: lf, length: 2 };
    return { index: crlf, length: 4 };
  }

  private dispatchFrame(frame: string, handlers: SSEHandlers): void {
    let eventName = '';
    const dataLines: string[] = [];
    const lines = frame.split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.startsWith(':')) continue;
      const colonIdx = line.indexOf(':');
      const field = colonIdx === -1 ? line : line.slice(0, colonIdx);
      let value = colonIdx === -1 ? '' : line.slice(colonIdx + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') {
        eventName = value;
      } else if (field === 'data') {
        dataLines.push(value);
      }
    }
    if (dataLines.length === 0) return;

    const raw = dataLines.join('\n');
    let parsed: SSEEventData;
    try {
      parsed = JSON.parse(raw) as SSEEventData;
    } catch (err) {
      console.error('SSE数据解析失败:', err, 'raw data:', raw);
      handlers.onError?.(new Error('数据格式错误'));
      return;
    }

    const type = (eventName || parsed.type || '') as SSEEventType;
    if (!KNOWN_EVENT_TYPE_SET.has(type)) {
      return;
    }
    handlers.onEvent(type, parsed);

    if (type === 'done') {
      this.close();
      handlers.onComplete?.();
    }
  }

  private resetTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    this.timeoutTimer = setTimeout(() => {
      console.warn('SSE connection timeout');
      this.close();
    }, this.timeout);
  }

  close(): void {
    if (!this.isActive) return;
    this.isActive = false;
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export default SSEClient;
