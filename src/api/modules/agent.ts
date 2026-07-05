/**
 * Agent 模块 API 接口
 */
import request from '../request';
import type { ChatRequest } from '@/types/agent';

const getBaseUrl = (): string => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 对话接口固定走 POST /api/agent/chat
export const getChatUrl = (): string => `${getBaseUrl()}/api/agent/chat`;

// 将前端请求转换为后端 ChatClientRequest 结构，字段名严格对齐
export const buildChatPayload = (request: ChatRequest): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    streaming: true,
    appConfigId: request.appConfigId,
    query: request.query,
    functionIds: request.functionIds ?? [],
    skillRefs: request.skillRefs ?? [],
    planMode: request.planMode ?? false,
  };
  if (request.systemPrompt) {
    payload.systemPrompt = request.systemPrompt;
  }
  if (request.conversationId) {
    payload.conversationId = request.conversationId;
  }
  return payload;
};

export interface StopMessageResp {
  messageId: string;
  cleaned: { sse: boolean; skill: boolean; nativeWorkspace: boolean };
}

export interface StopConversationResp {
  conversationId: string;
  cleaned: { memory: boolean; messages: string[] };
}

// 终止当前流式消息：切 SSE 出口 + 清 Skill 容器 + 清 NATIVE workspace
export const stopCurrentMessage = (messageId: string) =>
  request.post<StopMessageResp>('/api/agent/message/stop', { messageId });

// 销毁整个会话：清 memory + 清所有活跃 messageId 关联资源；保留 planDir
export const stopConversation = (conversationId: string) =>
  request.post<StopConversationResp>('/api/agent/conversation/stop', { conversationId });
