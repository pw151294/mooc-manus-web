// src/types/sse.ts

// SSE事件类型枚举
export type SSEEventType =
  | 'message'
  | 'message_end'
  | 'tool_call_start'
  | 'tool_call_complete'
  | 'tool_call_fail'
  | 'error'
  | 'done'
  | 'title'
  | 'plan_create_success'
  | 'step_start'
  | 'step_complete';

// 基础事件数据
export interface BaseEventData {
  id: string;
  conversationId: string;
  type: string;
  timestamp: string;
}

// 消息事件
export interface MessageEventData extends BaseEventData {
  type: 'message' | 'message_end';
  timestamp: string;
  role: 'user' | 'assistant';
  message: string;
  attachments?: unknown[];
}

// 工具调用事件
export interface ToolEventData extends BaseEventData {
  type: 'tool_call_start' | 'tool_call_complete' | 'tool_call_fail';
  timestamp: string;
  tool_call_id: string;
  tool_name: string;
  function_name: string;
  function_args: string;
  function_result?: unknown;
  status: 'calling' | 'completed' | 'failed';
}

// 错误事件
export interface ErrorEventData extends BaseEventData {
  type: 'error';
  timestamp: string;
  error: string;
}

// 完成事件
export interface DoneEventData extends BaseEventData {
  type: 'done';
  timestamp: string;
}

// 标题事件
export interface TitleEventData extends BaseEventData {
  type: 'title';
  timestamp: string;
  title: string;
}

// 联合类型
export type SSEEventData =
  | MessageEventData
  | ToolEventData
  | ErrorEventData
  | DoneEventData
  | TitleEventData;

// SSE事件处理器
export interface SSEHandlers {
  onOpen?: () => void;
  onEvent: (eventType: SSEEventType, data: SSEEventData) => void;
  onError?: (error: Event | Error) => void;
  onComplete?: () => void;
}
