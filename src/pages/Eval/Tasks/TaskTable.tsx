/**
 * TaskTable - task list with pagination, status tag, progress and actions
 */

import type { FC, KeyboardEvent } from 'react';
import { Table, Tag, Space, Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useTaskStore } from '@/store/evalTask';
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

const TaskTable: FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    total,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    deleteTask,
    retryTask,
  } = useTaskStore();

  const goDetail = (id: string) => navigate(`/eval/tasks/${id}`);

  const columns: ColumnsType<TaskView> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Tag>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 200,
      render: (_: unknown, r: TaskView) =>
        `成功 ${r.succeeded_count} / 失败 ${r.failed_count} / 运行中 ${r.running_count} / 总计 ${r.total_count}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t: string) => formatTime(t),
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (t?: string) => formatTime(t),
    },
    {
      title: '结束时间',
      dataIndex: 'finished_at',
      key: 'finished_at',
      width: 180,
      render: (t?: string) => formatTime(t),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: TaskView) => (
        <Space size="small" onClick={(e) => e.stopPropagation()}>
          <Button type="link" size="small" onClick={() => goDetail(record.id)}>
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              retryTask(record.id).catch(() => {});
            }}
          >
            重试
          </Button>
          <Popconfirm
            title="确定删除此任务吗？"
            description="此操作不可撤销"
            onConfirm={() => {
              deleteTask(record.id).catch(() => {});
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<TaskView>
      columns={columns}
      dataSource={tasks}
      rowKey="id"
      loading={loading}
      size="middle"
      onRow={(record) => ({
        tabIndex: 0,
        role: 'button',
        'aria-label': `任务 ${record.name}`,
        style: { cursor: 'pointer' },
        onClick: () => goDetail(record.id),
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goDetail(record.id);
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

export default TaskTable;
