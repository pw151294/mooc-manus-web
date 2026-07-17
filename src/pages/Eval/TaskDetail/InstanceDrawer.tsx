/**
 * InstanceDrawer - instance detail drawer with 4 tabs
 * (basic info / result / tokens & latency / error log)
 */

import type { FC } from 'react';
import { Drawer, Descriptions, Tabs, Alert, Empty, Space, Button, Input, Skeleton } from 'antd';
import dayjs from 'dayjs';
import type { InstanceView } from '@/types/eval';

interface InstanceDrawerProps {
  open: boolean;
  instance: InstanceView | null;
  onClose: () => void;
  onRetry: (id: string) => void;
  onOpenTrace: (inst: InstanceView) => void;
}

const formatTime = (t?: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--');
const orDash = (v?: string) => (v && v !== '' ? v : '--');

const InstanceDrawer: FC<InstanceDrawerProps> = ({
  open,
  instance,
  onClose,
  onRetry,
  onOpenTrace,
}) => {
  const canRetry =
    instance !== null && (instance.status === 'FAILED' || instance.status === 'TIMEOUT');
  const canViewTrace = Boolean(instance?.trace_id);

  const extra = (
    <Space>
      <Button
        disabled={!canRetry}
        onClick={() => {
          if (instance) onRetry(instance.id);
        }}
      >
        重试
      </Button>
      <Button
        disabled={!canViewTrace}
        onClick={() => {
          if (instance) onOpenTrace(instance);
        }}
      >
        查看 Trace
      </Button>
    </Space>
  );

  const renderBasicTab = () => {
    if (!instance) return <Skeleton active />;
    return (
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="实例 ID">{orDash(instance.id)}</Descriptions.Item>
        <Descriptions.Item label="任务 ID">{orDash(instance.task_id)}</Descriptions.Item>
        <Descriptions.Item label="用例 ID">{orDash(instance.case_id)}</Descriptions.Item>
        <Descriptions.Item label="会话 ID">{orDash(instance.conversation_id)}</Descriptions.Item>
        <Descriptions.Item label="消息 ID">{orDash(instance.message_id)}</Descriptions.Item>
        <Descriptions.Item label="Worker ID">{orDash(instance.worker_id)}</Descriptions.Item>
        <Descriptions.Item label="入队时间">{formatTime(instance.queued_at)}</Descriptions.Item>
        <Descriptions.Item label="开始时间">{formatTime(instance.started_at)}</Descriptions.Item>
        <Descriptions.Item label="结束时间">{formatTime(instance.finished_at)}</Descriptions.Item>
        <Descriptions.Item label="心跳时间">{formatTime(instance.heartbeat_at)}</Descriptions.Item>
        <Descriptions.Item label="截止时间">{formatTime(instance.deadline_at)}</Descriptions.Item>
        <Descriptions.Item label="尝试次数">{instance.attempt}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderResultTab = () => {
    if (!instance) return <Skeleton active />;
    if (!instance.result) return <Empty description="暂无执行结果" />;
    const { passed, verify_exit_code, verify_stdout, verify_stderr } = instance.result;
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Alert
          type={passed ? 'success' : 'error'}
          message={passed ? '验证通过' : '验证失败'}
          showIcon
        />
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="验证退出码">{verify_exit_code}</Descriptions.Item>
        </Descriptions>
        <div>
          <div style={{ marginBottom: 4, color: '#666' }}>标准输出 (stdout)</div>
          <Input.TextArea readOnly value={verify_stdout} autoSize={{ minRows: 6, maxRows: 12 }} />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#666' }}>标准错误 (stderr)</div>
          <Input.TextArea readOnly value={verify_stderr} autoSize={{ minRows: 6, maxRows: 12 }} />
        </div>
      </Space>
    );
  };

  const renderTokensTab = () => {
    if (!instance) return <Skeleton active />;
    if (!instance.result) return <Empty description="暂无 Token 数据" />;
    const { prompt_tokens, completion_tokens, total_tokens, agent_latency_ms } = instance.result;
    return (
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Prompt Tokens">{prompt_tokens}</Descriptions.Item>
        <Descriptions.Item label="Completion Tokens">{completion_tokens}</Descriptions.Item>
        <Descriptions.Item label="Total Tokens">{total_tokens}</Descriptions.Item>
        <Descriptions.Item label="Agent 耗时">{`${agent_latency_ms} ms`}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderErrorTab = () => {
    if (!instance) return <Skeleton active />;
    const errorMsg = instance.error_message;
    const errorLog = instance.result?.error_log;
    if (!errorMsg && !errorLog) return <Empty description="无错误" />;
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {errorMsg && (
          <div>
            <div style={{ marginBottom: 4, color: '#666' }}>错误信息</div>
            <Input.TextArea readOnly value={errorMsg} autoSize={{ minRows: 4, maxRows: 10 }} />
          </div>
        )}
        {errorLog && (
          <div>
            <div style={{ marginBottom: 4, color: '#666' }}>错误日志</div>
            <Input.TextArea readOnly value={errorLog} autoSize={{ minRows: 6, maxRows: 14 }} />
          </div>
        )}
      </Space>
    );
  };

  return (
    <Drawer
      title="实例详情"
      open={open}
      onClose={onClose}
      width={720}
      destroyOnHidden
      extra={extra}
    >
      {!instance ? (
        <Empty description="未选择实例" />
      ) : (
        <Tabs
          defaultActiveKey="basic"
          items={[
            { key: 'basic', label: '基础信息', children: renderBasicTab() },
            { key: 'result', label: '执行结果', children: renderResultTab() },
            { key: 'tokens', label: 'Token & 耗时', children: renderTokensTab() },
            { key: 'error', label: '错误日志', children: renderErrorTab() },
          ]}
        />
      )}
    </Drawer>
  );
};

export default InstanceDrawer;
