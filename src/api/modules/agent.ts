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
  params.set('app_config_id', request.app_config_id);
  params.set('query', request.query);
  if (request.system_prompt) {
    params.set('system_prompt', request.system_prompt);
  }
  if (request.conversation_id) {
    params.set('conversation_id', request.conversation_id);
  }
  if (request.function_ids?.length) {
    params.set('function_ids', JSON.stringify(request.function_ids));
  }
  if (request.skill_refs?.length) {
    params.set('skill_refs', JSON.stringify(request.skill_refs));
  }
  return `${baseUrl}/api/agent/chat?${params.toString()}`;
};
