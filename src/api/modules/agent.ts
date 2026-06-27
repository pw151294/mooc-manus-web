/**
 * Agent 模块 API 接口
 */
import type { ChatRequest } from '@/types/agent';

// 构造 SSE 对话 URL
// 后端期望 POST 请求,但 EventSource 只支持 GET
// 实际方案: 假设后端支持 GET /api/agent/chat 接口,参数序列化为 query string
export const buildChatUrl = (request: ChatRequest): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const params = new URLSearchParams();
  params.set('appConfigId', request.appConfigId);
  params.set('query', request.query);
  if (request.systemPrompt) {
    params.set('systemPrompt', request.systemPrompt);
  }
  if (request.conversationId) {
    params.set('conversationId', request.conversationId);
  }
  if (request.functionIds?.length) {
    params.set('functionIds', JSON.stringify(request.functionIds));
  }
  if (request.skillRefs?.length) {
    params.set('skillRefs', JSON.stringify(request.skillRefs));
  }
  return `${baseUrl}/api/agent/chat?${params.toString()}`;
};
