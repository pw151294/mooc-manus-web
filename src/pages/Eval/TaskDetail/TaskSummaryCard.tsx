/**
 * TaskSummaryCard - task summary with name, status, timestamps, progress and actions
 */

import type { FC } from 'react';
import {
  Card,
  Tag,
  Space,
  Button,
  Progress,
  Descriptions,
  Skeleton,
  Empty,
  Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TaskView } from '@/types/eval';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'default',
  RUNNING: 'processing',
  SUCCEEDED: 'success',
  FAILED: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待执行',
  RUNNING: '运行中',
  SUCCEEDED: '已完成',
  FAILED: '失败',
};

const formatTime = (t?: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '--');

interface TaskSummaryCardProps {
  task: TaskView | null;
  loading: boolean;
  onBack: () => void;
  onRetryFailed: () => void;
  onDelete: () => void;
}

const TaskSummaryCard: FC<TaskSummaryCardProps> = ({
  task,
  loading,
  onBack,
  onRetryFailed,
  onDelete,
}) => {
  if (loading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!task) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Empty description="任务不存在" />
      </Card>
    );
  }

  const percent =
    task.total_count > 0 ? Math.round((task.succeeded_count / task.total_count) * 100) : 0;

  return (
    <Card
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <span>{task.name}</span>
          <Tag color={STATUS_COLOR[task.status] ?? 'default'}>
            {STATUS_LABEL[task.status] ?? task.status}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回列表
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRetryFailed}
            disabled={task.failed_count === 0}
          >
            重试失败实例
          </Button>
          <Popconfirm
            title="确定删除此任务吗？"
            description="此操作不可撤销"
            onConfirm={onDelete}
            okText="确认"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} danger>
              删除任务
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Descriptions column={3} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="创建时间">{formatTime(task.created_at)}</Descriptions.Item>
        <Descriptions.Item label="开始时间">{formatTime(task.started_at)}</Descriptions.Item>
        <Descriptions.Item label="结束时间">{formatTime(task.finished_at)}</Descriptions.Item>
      </Descriptions>

      <Progress percent={percent} status={task.status === 'FAILED' ? 'exception' : undefined} />
      <div style={{ marginTop: 8, color: '#666' }}>
        {`成功 ${task.succeeded_count} / 失败 ${task.failed_count} / 运行中 ${task.running_count} / 总计 ${task.total_count}`}
      </div>
    </Card>
  );
};

export default TaskSummaryCard;
