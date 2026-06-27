/**
 * 单条对话消息组件
 */
import type { FC } from 'react';
import { Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { Message } from '@/types/agent';
import ToolCallCard from './ToolCallCard';

const { Text } = Typography;

interface MessageItemProps {
  message: Message;
}

const MessageItem: FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 12,
        marginBottom: 16,
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? '#1677ff' : '#52c41a',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          maxWidth: '75%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            background: isUser ? '#e6f4ff' : '#f5f5f5',
            color: '#000',
            padding: '10px 14px',
            borderRadius: 8,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            border: isUser ? '1px solid #91caff' : '1px solid #e8e8e8',
            minHeight: 20,
          }}
        >
          {message.content}
          {message.isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 14,
                background: '#1677ff',
                marginLeft: 4,
                animation: 'agent-cursor-blink 1s infinite',
                verticalAlign: 'middle',
              }}
            />
          )}
          {!message.content && !message.isStreaming && !message.toolCalls?.length && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              (空消息)
            </Text>
          )}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ width: '100%', marginTop: 4 }}>
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </div>
    </div>
  );
};

export default MessageItem;
