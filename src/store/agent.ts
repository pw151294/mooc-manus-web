/**
 * Agent 模块状态管理
 */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppConfigDTO } from '@/types/appConfig';
import type { ToolFunctionDTO } from '@/types/tool';
import type { SkillDTO } from '@/types/skill';
import type { Message, ToolCallStatus } from '@/types/agent';

interface AgentState {
  // 能力装配配置
  selectedConfig: AppConfigDTO | null;
  selectedTools: ToolFunctionDTO[];
  selectedSkills: { skill: SkillDTO; version: string }[];
  systemPrompt: string;
  planMode: boolean; // 规划模式开关

  // 对话状态
  messages: Message[];
  conversationId: string | null;
  isStreaming: boolean;

  // Actions - 能力装配
  setSelectedConfig: (config: AppConfigDTO | null) => void;
  setSelectedTools: (tools: ToolFunctionDTO[]) => void;
  setSelectedSkills: (skills: { skill: SkillDTO; version: string }[]) => void;
  setSystemPrompt: (prompt: string) => void;
  setPlanMode: (enabled: boolean) => void;

  // Actions - 对话
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  addToolCallStatus: (toolCall: ToolCallStatus) => void;
  updateToolCallStatus: (toolCallId: string, updates: Partial<ToolCallStatus>) => void;

  startStreaming: () => void;
  stopStreaming: () => void;
  resetConversation: () => void;
  ensureConversationId: () => string;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  selectedConfig: null,
  selectedTools: [],
  selectedSkills: [],
  systemPrompt: '',
  planMode: false,
  messages: [],
  conversationId: null,
  isStreaming: false,

  setSelectedConfig: (config) => set({ selectedConfig: config }),
  setSelectedTools: (tools) => set({ selectedTools: tools }),
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
  setPlanMode: (enabled) => set({ planMode: enabled }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastMessage: (content) =>
    set((state) => ({
      messages: state.messages.map((msg, idx) =>
        idx === state.messages.length - 1 ? { ...msg, content } : msg
      ),
    })),

  addToolCallStatus: (toolCall) =>
    set((state) => {
      if (state.messages.length === 0) {
        return state;
      }
      const messages = state.messages.map((msg, idx) => {
        if (idx === state.messages.length - 1 && msg.role === 'assistant') {
          return { ...msg, toolCalls: [...(msg.toolCalls || []), toolCall] };
        }
        return msg;
      });
      return { messages };
    }),

  updateToolCallStatus: (toolCallId, updates) =>
    set((state) => {
      if (state.messages.length === 0) {
        return state;
      }
      const messages = state.messages.map((msg, idx) => {
        if (idx === state.messages.length - 1 && msg.toolCalls) {
          return {
            ...msg,
            toolCalls: msg.toolCalls.map((tc) =>
              tc.id === toolCallId ? { ...tc, ...updates } : tc
            ),
          };
        }
        return msg;
      });
      return { messages };
    }),

  startStreaming: () => set({ isStreaming: true }),
  stopStreaming: () =>
    set((state) => ({
      isStreaming: false,
      messages: state.messages.map((msg, idx) =>
        idx === state.messages.length - 1 ? { ...msg, isStreaming: false } : msg
      ),
    })),

  resetConversation: () =>
    set({
      messages: [],
      conversationId: null,
      isStreaming: false,
    }),

  ensureConversationId: () => {
    const current = get().conversationId;
    if (current) return current;
    const newId = uuidv4();
    set({ conversationId: newId });
    return newId;
  },
}));
