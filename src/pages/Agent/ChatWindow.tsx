/**
 * 对话窗口组件
 */
import type { FC, KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button, Input, Empty, Tag, Space, Tooltip, Typography } from 'antd';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';
import { useAgentStore } from '@/store/agent';
import MessageItem from './MessageItem';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatWindowProps {
  onSend: (query: string) => void;
  onReset: () => void;
}

const ChatWindow: FC<ChatWindowProps> = ({ onSend, onReset }) => {
  const { messages, conversationId, isStreaming } = useAgentStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新消息到达时自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (isStreaming) return;
    onSend(trimmed);
    setInput('');
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
        <Space>
          <Text strong>当前会话</Text>
          {conversationId ? (
            <Tooltip title={conversationId}>
              <Tag
                color="blue"
                style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {conversationId.slice(0, 8)}...
              </Tag>
            </Tooltip>
          ) : (
            <Tag>未开始</Tag>
          )}
        </Space>
        <Button icon={<PlusOutlined />} onClick={onReset} disabled={isStreaming}>
          新建会话
        </Button>
      </div>

      {/* Messages */}
      <div
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid #e8e8e8',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入消息（Enter 发送，Shift+Enter 换行）"
            autoSize={{ minRows: 2, maxRows: 6 }}
            disabled={isStreaming}
          />
          <Button
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
