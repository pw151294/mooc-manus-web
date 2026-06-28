/**
 * Agent 模块 API 接口
 */
import type { ChatRequest } from '@/types/agent';

const getBaseUrl = (): string =>
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
  };
  if (request.systemPrompt) {
    payload.systemPrompt = request.systemPrompt;
  }
  if (request.conversationId) {
    payload.conversationId = request.conversationId;
  }
  return payload;
};
