/**
 * InstanceTable - instance list with status icons, pagination and actions
 */

import type { FC, KeyboardEvent } from 'react';
import { Table, Space, Button, Popconfirm, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useInstanceStore } from '@/store/evalInstance';
import type { InstanceView } from '@/types/eval';

interface InstanceTableProps {
  onOpenDrawer: (inst: InstanceView) => void;
}

const renderStatus = (status: string) => {
  switch (status) {
    case 'SUCCEEDED':
      return (
        <Space size={4}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>已完成</span>
        </Space>
      );
    case 'FAILED':
      return (
        <Space size={4}>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>失败</span>
        </Space>
      );
    case 'RUNNING':
      return (
        <Space size={4}>
          <SyncOutlined spin style={{ color: '#1677ff' }} />
          <span>运行中</span>
        </Space>
      );
    case 'PENDING':
      return (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <span>待执行</span>
        </Space>
      );
    case 'TIMEOUT':
      return (
        <Space size={4}>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>超时</span>
        </Space>
      );
    default:
      return <span>{status}</span>;
  }
};

const formatDuration = (started?: string, finished?: string): string => {
  if (!started || !finished) return '--';
  const secs = dayjs(finished).diff(dayjs(started), 'second');
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const InstanceTable: FC<InstanceTableProps> = ({ onOpenDrawer }) => {
  const {
    instances,
    total,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    retryInstance,
    deleteInstance,
  } = useInstanceStore();

  const columns: ColumnsType<InstanceView> = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => renderStatus(s),
    },
    {
      title: '用例',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 180,
      ellipsis: true,
      render: (v: string) => <Typography.Text ellipsis={{ tooltip: v }}>{v}</Typography.Text>,
    },
    {
      title: 'Agent',
      key: 'agent',
      width: 140,
      render: () => '多 Agent 任务',
    },
    {
      title: '尝试次数',
      dataIndex: 'attempt',
      key: 'attempt',
      width: 90,
    },
    {
      title: '耗时',
      key: 'duration',
      width: 100,
      render: (_: unknown, r: InstanceView) => formatDuration(r.started_at, r.finished_at),
    },
    {
      title: 'Token',
      key: 'tokens',
      width: 100,
      render: (_: unknown, r: InstanceView) =>
        r.result?.total_tokens !== undefined ? r.result.total_tokens : '--',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_: unknown, record: InstanceView) => {
        const canRetry = record.status === 'FAILED' || record.status === 'TIMEOUT';
        const canViewTrace = Boolean(record.trace_id);
        return (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Button type="link" size="small" onClick={() => onOpenDrawer(record)}>
              查看详情
            </Button>
            <Button
              type="link"
              size="small"
              disabled={!canRetry}
              onClick={() => {
                retryInstance(record.id).catch(() => {});
              }}
            >
              重试
            </Button>
            <Popconfirm
              title="确定删除此实例吗？"
              description="此操作不可撤销"
              onConfirm={() => {
                deleteInstance(record.id).catch(() => {});
              }}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
            <Button
              type="link"
              size="small"
              disabled={!canViewTrace}
              onClick={() => {
                window.open(`/traces?traceId=${record.trace_id}`, '_blank');
              }}
            >
              查看 Trace
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Table<InstanceView>
      columns={columns}
      dataSource={instances}
      rowKey="id"
      loading={loading}
      size="middle"
      onRow={(record) => ({
        tabIndex: 0,
        role: 'button',
        'aria-label': `实例 ${record.case_id}`,
        style: { cursor: 'pointer' },
        onClick: () => onOpenDrawer(record),
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDrawer(record);
          }
        },
      })}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (t) => `共 ${t} 条`,
        onChange: (p, ps) => {
          if (ps !== pageSize) {
            setPageSize(ps);
          } else if (p !== page) {
            setPage(p);
          }
        },
      }}
    />
  );
};

export default InstanceTable;
