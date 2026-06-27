/**
 * Agent 模块类型定义
 */

// 工具调用状态（对应 SSE 事件）
export interface ToolCallStatus {
  id: string; // tool_call_id
  toolName: string;
  functionName: string;
  functionArgs?: string;
  status: 'calling' | 'completed' | 'failed';
  result?: unknown;
}

// 对话消息
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCallStatus[];
  isStreaming?: boolean; // 是否正在流式输出
}

// Skill 引用（用于请求）
export interface SkillRef {
  skill_id: string;
  version: string;
}

// 对话请求（对应后端 ChatRequest）
export interface ChatRequest {
  app_config_id: string; // 模型配置ID
  function_ids: string[]; // 工具函数ID列表
  skill_refs: SkillRef[]; // Skill 引用列表
  system_prompt?: string; // 系统提示词
  query: string; // 用户消息
  conversation_id?: string; // 会话ID（可选，首次对话生成）
}
