/**
 * Agent 智能体对话主页面
 * 左侧能力装配面板 + 右侧 SSE 流式对话窗口
 */
import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import SSEClient from '@/api/sse';
import { buildChatUrl } from '@/api/modules/agent';
import { useAgentStore } from '@/store/agent';
import type { MessageEventData, ToolEventData, ErrorEventData, TitleEventData } from '@/types/sse';
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

  const handleReset = () => {
    sseClientRef.current?.close();
    sseClientRef.current = null;
    accumulatedRef.current = '';
    useAgentStore.getState().resetConversation();
    message.success('已创建新会话');
  };

  const handleSendMessage = (query: string) => {
    const {
      selectedConfig,
      selectedTools,
      selectedSkills,
      systemPrompt,
      addMessage,
      updateLastMessage,
      addToolCallStatus,
      updateToolCallStatus,
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
    const url = buildChatUrl({
      appConfigId: selectedConfig.appConfigId,
      functionIds: selectedTools.map((t) => t.functionId),
      skillRefs: selectedSkills.map((s) => ({
        skillId: s.skill.skillId,
        version: s.version,
      })),
      systemPrompt: systemPrompt || undefined,
      query,
      conversationId: ensureConversationId(),
    });

    // 关闭旧连接
    sseClientRef.current?.close();
    const sseClient = new SSEClient();
    sseClientRef.current = sseClient;

    try {
      sseClient.subscribe(url, {
        onEvent: (type, data) => {
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
              break;
            default:
              break;
          }
        },
        onError: () => {
          message.error('连接中断');
          stopStreaming();
        },
        onComplete: () => {
          stopStreaming();
        },
      });
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
        <ChatWindow onSend={handleSendMessage} onReset={handleReset} />
      </div>
    </>
  );
};

export default AgentPage;
