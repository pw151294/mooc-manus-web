/**
 * Tool 调用卡片组件
 */
import type { FC } from 'react';
import { useState } from 'react';
import { Card, Tag, Collapse, Typography } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import type { ToolCallStatus } from '@/types/agent';

const { Text, Paragraph } = Typography;

interface ToolCallCardProps {
  toolCall: ToolCallStatus;
}

const ToolCallCard: FC<ToolCallCardProps> = ({ toolCall }) => {
  const [activeKey, setActiveKey] = useState<string[]>([]);

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

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        background: '#f8f8f8',
        border: '1px solid #e8e8e8',
      }}
      styles={{ body: { padding: '8px 12px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Tag color={status.color}>{status.text}</Tag>
        <Text strong style={{ fontSize: 12 }}>
          {toolCall.toolName}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          · {toolCall.functionName}
        </Text>
      </div>
      <Collapse
        ghost
        size="small"
        activeKey={activeKey}
        onChange={(keys) => setActiveKey(keys as string[])}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        items={[
          {
            key: 'detail',
            label: <Text style={{ fontSize: 12 }}>查看详情</Text>,
            children: (
              <div>
                {toolCall.functionArgs && (
                  <div style={{ marginBottom: 8 }}>
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
            ),
          },
        ]}
      />
    </Card>
  );
};

export default ToolCallCard;
