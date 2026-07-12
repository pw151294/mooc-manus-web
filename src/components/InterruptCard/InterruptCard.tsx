import { useMemo, useState } from 'react';
import { Alert, Button, Card, Collapse, Input, Space, Tag, Typography, message } from 'antd';
import { resumeAgent } from '@/api/modules/agent';
import type { ToolInterruptEventData } from '@/types/sse';

const { Paragraph, Text } = Typography;

export interface InterruptCardProps {
  event: ToolInterruptEventData & { messageId: string };
}

type CardState = 'pending' | 'submitting' | 'approved' | 'rejected' | 'expired';

export default function InterruptCard({ event }: InterruptCardProps) {
  const [state, setState] = useState<CardState>('pending');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const parsedArgs = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(event.function_args), null, 2);
    } catch {
      return event.function_args;
    }
  }, [event.function_args]);

  const handle = async (decision: 'approve' | 'reject') => {
    setState('submitting');
    try {
      const res = await resumeAgent({
        messageId: event.messageId,
        toolCallId: event.tool_call_id,
        decision,
        feedback: decision === 'reject' ? feedback.trim() || undefined : undefined,
      });
      if (res.status === 'accepted') {
        setState(decision === 'approve' ? 'approved' : 'rejected');
      } else if (res.status === 'already_decided') {
        setState('expired');
        message.warning('该决策已被系统超时或其他会话处理');
      } else {
        setState('expired');
        message.info('该待决策项已失效');
      }
    } catch {
      setState('pending');
      message.error('提交失败，请重试');
    }
  };

  const disabled = state !== 'pending';

  return (
    <Card
      size="small"
      title={
        <Space>
          <Tag color="red">高危调用待审批</Tag>
          <Text code>{event.function_name}</Text>
        </Space>
      }
      style={{ margin: '8px 0', borderColor: '#ff4d4f' }}
    >
      <Alert
        type="warning"
        showIcon
        message="风险原因"
        description={event.risk_reason || '(LLM 未提供风险说明)'}
        style={{ marginBottom: 12 }}
      />

      <Collapse
        ghost
        items={[
          {
            key: 'args',
            label: '查看完整调用参数',
            children: (
              <Paragraph>
                <pre style={{ margin: 0, maxHeight: 240, overflow: 'auto' }}>{parsedArgs}</pre>
              </Paragraph>
            ),
          },
        ]}
      />

      {state === 'pending' && !showFeedback && (
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" danger disabled={disabled} onClick={() => handle('approve')}>
            执行
          </Button>
          <Button disabled={disabled} onClick={() => setShowFeedback(true)}>
            拒绝
          </Button>
        </Space>
      )}

      {state === 'pending' && showFeedback && (
        <Space direction="vertical" style={{ marginTop: 12, width: '100%' }}>
          <Input.TextArea
            rows={2}
            placeholder="可选反馈（例如：改用 mv 到回收站）"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={500}
            showCount
          />
          <Space>
            <Button type="primary" danger onClick={() => handle('reject')}>
              提交拒绝
            </Button>
            <Button onClick={() => setShowFeedback(false)}>取消</Button>
          </Space>
        </Space>
      )}

      {state === 'submitting' && <Text type="secondary">正在提交决策...</Text>}
      {state === 'approved' && <Tag color="success">已执行，Agent 继续运行</Tag>}
      {state === 'rejected' && <Tag color="default">已拒绝，Agent 将重新规划</Tag>}
      {state === 'expired' && <Tag color="warning">已超时（5 分钟），Agent 已按拒绝处理</Tag>}
    </Card>
  );
}
