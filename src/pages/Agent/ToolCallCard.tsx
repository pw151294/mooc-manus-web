/**
 * Tool 调用卡片组件
 */
import type { FC } from 'react';
import { useState } from 'react';
import { Button, Card, Tag, Typography } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import type { ToolCallStatus } from '@/types/agent';

const { Text, Paragraph } = Typography;

interface ToolCallCardProps {
  toolCall: ToolCallStatus;
}

const ToolCallCard: FC<ToolCallCardProps> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    calling: { color: 'processing', text: '调用中' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '失败' },
  };

  const status = statusConfig[toolCall.status];

  const formatJSON = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const hasDetail = toolCall.functionArgs !== undefined || toolCall.result !== undefined;

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        background: '#f8f8f8',
        border: '1px solid #e8e8e8',
      }}
      styles={{ body: { padding: '6px 10px' } }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: expanded ? 6 : 0,
        }}
      >
        <Tag color={status.color} style={{ margin: 0 }}>
          {status.text}
        </Tag>
        <Text strong style={{ fontSize: 12 }}>
          {toolCall.toolName}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          · {toolCall.functionName}
        </Text>
        <div style={{ flex: 1 }} />
        {hasDetail && (
          <Button
            type="text"
            size="small"
            onClick={() => setExpanded((v) => !v)}
            icon={<CaretRightOutlined rotate={expanded ? 90 : 0} />}
            style={{ fontSize: 12, padding: '0 6px', height: 22 }}
          >
            {expanded ? '收起详情' : '查看详情'}
          </Button>
        )}
      </div>
      {expanded && hasDetail && (
        <div>
          {toolCall.functionArgs !== undefined && (
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                参数:
              </Text>
              <Paragraph
                style={{
                  background: '#fff',
                  padding: 8,
                  borderRadius: 4,
                  margin: '4px 0 0 0',
                  fontSize: 12,
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {formatJSON(toolCall.functionArgs)}
                </pre>
              </Paragraph>
            </div>
          )}
          {toolCall.result !== undefined && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                结果:
              </Text>
              <Paragraph
                style={{
                  background: '#fff',
                  padding: 8,
                  borderRadius: 4,
                  margin: '4px 0 0 0',
                  fontSize: 12,
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {formatJSON(toolCall.result)}
                </pre>
              </Paragraph>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ToolCallCard;
