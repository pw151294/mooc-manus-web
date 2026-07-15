/**
 * Agent 智能体对话主页面
 * 左侧能力装配面板 + 右侧 SSE 流式对话窗口
 */
import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import SSEClient from '@/api/sse';
import {
  buildChatPayload,
  getChatUrl,
  stopConversation,
  stopCurrentMessage,
} from '@/api/modules/agent';
import { useAgentStore } from '@/store/agent';
import type {
  MessageEventData,
  ToolEventData,
  ToolInterruptEventData,
  ErrorEventData,
  TitleEventData,
} from '@/types/sse';
import ConfigPanel from './ConfigPanel';
import ChatWindow from './ChatWindow';

const AgentPage: FC = () => {
  const sseClientRef = useRef<SSEClient | null>(null);
  const accumulatedRef = useRef<string>('');

  // 组件卸载时关闭 SSE
  useEffect(() => {
    return () => {
      sseClientRef.current?.close();
      sseClientRef.current = null;
    };
  }, []);

  const handleReset = async () => {
    const oldConvId = useAgentStore.getState().conversationId;
    sseClientRef.current?.close();
    sseClientRef.current = null;
    accumulatedRef.current = '';
    // conversationId 尚未生成时（首次进入未发消息）短路，避免无意义的 HTTP 往返
    if (oldConvId) {
      try {
        await stopConversation(oldConvId);
      } catch {
        // request 拦截器已弹错，这里静默继续走本地重置
      }
    }
    useAgentStore.getState().resetConversation();
    message.success('已创建新会话');
  };

  const handleStopMessage = async () => {
    const mid = useAgentStore.getState().currentMessageId;
    if (!mid) return;
    try {
      await stopCurrentMessage(mid);
    } catch {
      // 拦截器已弹错，继续做本地清理避免 UI 卡在 streaming 态
    }
    sseClientRef.current?.close();
    sseClientRef.current = null;
    const store = useAgentStore.getState();
    store.abortToolCallsAsFailed();
    store.stopStreaming();
    store.setCurrentMessageId(null);
    message.info('已停止本条对话');
  };

  const handleSendMessage = (query: string) => {
    const {
      selectedConfig,
      selectedTools,
      selectedSkills,
      systemPrompt,
      planMode,
      addMessage,
      updateLastMessage,
      addToolCallStatus,
      updateToolCallStatus,
      addInterrupt,
      startStreaming,
      stopStreaming,
      ensureConversationId,
    } = useAgentStore.getState();

    if (!selectedConfig) {
      message.error('请先选择模型配置');
      return;
    }

    // 添加用户消息
    addMessage({
      id: uuidv4(),
      role: 'user',
      content: query,
      timestamp: Date.now(),
    });

    // 添加 assistant 占位
    addMessage({
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    });

    startStreaming();
    accumulatedRef.current = '';

    // 构造请求并订阅
    const payload = buildChatPayload({
      appConfigId: selectedConfig.appConfigId,
      functionIds: selectedTools.map((t) => t.functionId),
      skillRefs: selectedSkills.map((s) => ({
        skillId: s.skill.skillId,
        version: s.version,
      })),
      systemPrompt: systemPrompt || undefined,
      query,
      conversationId: ensureConversationId(),
      planMode,
    });

    // 关闭旧连接
    sseClientRef.current?.close();
    const sseClient = new SSEClient();
    sseClientRef.current = sseClient;

    try {
      sseClient.subscribe(
        { url: getChatUrl(), method: 'POST', body: payload },
        {
          onEvent: (type, data) => {
            // 首次拿到 messageId 就写入 store，供"停止本条对话"按钮使用
            // 后端 BaseEvent 已经把 messageId 打到每条 SSE payload 上
            const eventMessageId = (data as { messageId?: string })?.messageId;
            if (eventMessageId && useAgentStore.getState().currentMessageId !== eventMessageId) {
              useAgentStore.getState().setCurrentMessageId(eventMessageId);
            }
            switch (type) {
              case 'message': {
                const msgData = data as MessageEventData;
                accumulatedRef.current += msgData.message || '';
                updateLastMessage(accumulatedRef.current);
                break;
              }
              case 'message_end':
                // 标记当前消息完成
                break;
              case 'tool_call_start': {
                const tool = data as ToolEventData;
                addToolCallStatus({
                  id: tool.tool_call_id,
                  toolName: tool.tool_name,
                  functionName: tool.function_name,
                  functionArgs: tool.function_args,
                  status: 'calling',
                  subagentId: tool.metadata?.subagent_id,
                  isSubagent: tool.metadata?.is_subagent,
                  subagentTask: tool.metadata?.subagent_task,
                  subagentContext: tool.metadata?.subagent_context,
                });
                break;
              }
              case 'tool_call_complete': {
                const tool = data as ToolEventData;
                updateToolCallStatus(tool.tool_call_id, {
                  status: 'completed',
                  result: tool.function_result,
                });
                break;
              }
              case 'tool_call_fail': {
                const tool = data as ToolEventData;
                updateToolCallStatus(tool.tool_call_id, {
                  status: 'failed',
                  result: tool.function_result,
                });
                break;
              }
              case 'tool_call_interrupt': {
                // HITL 高危工具审批中断：追加一张 InterruptCard，等待用户 approve/reject
                // messageId 从事件 payload 上取（BaseEvent 已透传），兜底用当前 store 内值
                const interruptData = data as ToolInterruptEventData;
                const mid = eventMessageId ?? useAgentStore.getState().currentMessageId ?? '';
                addInterrupt(interruptData, mid);
                break;
              }
              case 'error': {
                const errData = data as ErrorEventData;
                message.error(errData.error || '对话出错');
                break;
              }
              case 'title': {
                const titleData = data as TitleEventData;
                console.log('会话标题:', titleData.title);
                break;
              }
              case 'done':
                stopStreaming();
                useAgentStore.getState().setCurrentMessageId(null);
                break;
              default:
                break;
            }
          },
          onError: () => {
            message.error('连接中断');
            stopStreaming();
            useAgentStore.getState().setCurrentMessageId(null);
          },
          onComplete: () => {
            stopStreaming();
            useAgentStore.getState().setCurrentMessageId(null);
          },
        }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '未知错误';
      message.error(`订阅 SSE 失败: ${errMsg}`);
      stopStreaming();
    }
  };

  return (
    <>
      <style>{`
        @keyframes agent-cursor-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: 16,
          height: 'calc(100vh - 112px)',
        }}
      >
        <ConfigPanel />
        <ChatWindow onSend={handleSendMessage} onReset={handleReset} onStop={handleStopMessage} />
      </div>
    </>
  );
};

export default AgentPage;
