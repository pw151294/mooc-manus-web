/**
 * Agent 模块类型定义
 */
import type { ToolInterruptEventData } from './sse';

// 工具调用状态（对应 SSE 事件）
export interface ToolCallStatus {
  id: string; // tool_call_id
  toolName: string;
  functionName: string;
  functionArgs?: string;
  status: 'calling' | 'completed' | 'failed';
  result?: unknown;
  subagentId?: string;
  isSubagent?: boolean;
  subagentTask?: string;
  subagentContext?: string;
}

// 对话消息 - 普通对话（user / assistant 文本 + 工具调用）
export interface ChatMessage {
  id: string;
  kind?: 'chat'; // 未标记时默认为 chat，向后兼容旧数据
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCallStatus[];
  isStreaming?: boolean; // 是否正在流式输出
}

// 对话消息 - HITL 高危工具审批中断卡片
export interface InterruptMessage {
  id: string;
  kind: 'interrupt';
  timestamp: number;
  event: ToolInterruptEventData & { messageId: string };
}

// 对话流中的一项（chat 消息 或 interrupt 卡片）
export type Message = ChatMessage | InterruptMessage;

// Skill 引用（用于请求）
export interface SkillRef {
  skillId: string;
  version: string;
  skillName?: string;
}

// 对话请求（对应后端 ChatRequest）
export interface ChatRequest {
  appConfigId: string; // 模型配置ID
  functionIds: string[]; // 工具函数ID列表
  skillRefs: SkillRef[]; // Skill 引用列表
  systemPrompt?: string; // 系统提示词
  query: string; // 用户消息
  conversationId?: string; // 会话ID（可选，首次对话生成）
  planMode?: boolean; // 规划模式：开启后自动注入持久化规划提示词
}
