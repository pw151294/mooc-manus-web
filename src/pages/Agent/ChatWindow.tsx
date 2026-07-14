/**
 * 对话窗口组件
 */
import type { FC, KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button, Input, Empty, Tag, Tooltip, Typography, Switch } from 'antd';
import { SendOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { useAgentStore } from '@/store/agent';
import { useStickToBottom } from '@/hooks/useStickToBottom';
import MessageItem from './MessageItem';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatWindowProps {
  onSend: (query: string) => void;
  onReset: () => Promise<void> | void;
  onStop: () => Promise<void> | void;
}

const ChatWindow: FC<ChatWindowProps> = ({ onSend, onReset, onStop }) => {
  const { messages, conversationId, isStreaming, planMode, setPlanMode } = useAgentStore();
  const [input, setInput] = useState('');
  const { containerRef, bottomAnchorRef, scrollToBottom, forcePin } =
    useStickToBottom<HTMLDivElement>();

  // 会话切换/清空：强制回到底部，恢复贴底状态
  useEffect(() => {
    forcePin();
  }, [conversationId, forcePin]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isStreaming) return;
    onSend(trimmed);
    setInput('');
    // 发送即代表用户回到"最新交互"上下文，无条件回底并解除自主浏览锁定
    scrollToBottom('auto');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafafa',
        }}
      >
        <Text strong>当前会话</Text>
        <Button icon={<PlusOutlined />} onClick={onReset} disabled={isStreaming}>
          新建会话
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          background: '#fff',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Empty description="开始一段新对话吧" />
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}
        <div ref={bottomAnchorRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid #e8e8e8',
          background: '#fafafa',
          flexShrink: 0,
        }}
      >
        {/* PlanMode 开关 */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Switch
            data-testid="plan-mode-switch"
            checked={planMode}
            onChange={setPlanMode}
            disabled={isStreaming}
            size="small"
          />
          <Tooltip title="开启后智能体将自动创建 Plan.md / TODO.md 并实时更新任务进度，支持会话中断后断点续跑">
            <Text type="secondary" style={{ fontSize: 12 }}>
              规划模式（PlanMode）
            </Text>
          </Tooltip>
          {planMode && (
            <Tag color="blue" style={{ margin: 0 }}>
              已开启
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入消息（Enter 发送，Shift+Enter 换行）"
            autoSize={{ minRows: 4, maxRows: 8 }}
            disabled={isStreaming}
          />
          {isStreaming && (
            <Button danger icon={<StopOutlined />} onClick={onStop} style={{ height: 'auto' }}>
              停止
            </Button>
          )}
          <Button
            data-testid="send-button"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isStreaming}
            disabled={!input.trim()}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
