import { useEffect } from 'react';
import type { FC } from 'react';
import { Table, Tag, Progress, Button, Space, Popconfirm, message, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { ReloadOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSkillStore } from '@/store/skill';
import type { SkillImportTaskDTO } from '@/types/skill';

const statusMap: Record<SkillImportTaskDTO['status'], { color: string; label: string }> = {
  pending: { color: 'default', label: '等待中' },
  running: { color: 'processing', label: '进行中' },
  success: { color: 'success', label: '成功' },
  failed: { color: 'error', label: '失败' },
};

const sourceTypeMap: Record<SkillImportTaskDTO['source_type'], string> = {
  git: 'Git 仓库',
  zip: 'ZIP 包',
  url: 'URL',
};

const ImportTasks: FC = () => {
  const {
    importTasks,
    taskLoading,
    fetchImportTasks,
    cancelImportTask,
    deleteImportTask,
    subscribeImportTask,
    unsubscribeAllImportTasks,
  } = useSkillStore();

  useEffect(() => {
    fetchImportTasks();
    return () => {
      unsubscribeAllImportTasks();
    };
  }, [fetchImportTasks, unsubscribeAllImportTasks]);

  // 自动订阅所有进行中的任务
  useEffect(() => {
    importTasks.forEach((task) => {
      if (task.status === 'pending' || task.status === 'running') {
        subscribeImportTask(task.id);
      }
    });
  }, [importTasks, subscribeImportTask]);

  const handleCancel = async (id: string) => {
    try {
      await cancelImportTask(id);
      message.success('已取消任务');
    } catch {
      message.error('取消失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteImportTask(id);
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const columns: TableProps<SkillImportTaskDTO>['columns'] = [
    {
      title: '来源类型',
      dataIndex: 'source_type',
      key: 'source_type',
      width: 110,
      render: (type: SkillImportTaskDTO['source_type']) => <Tag>{sourceTypeMap[type] || type}</Tag>,
    },
    {
      title: '来源 URL',
      dataIndex: 'source_url',
      key: 'source_url',
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <span>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: SkillImportTaskDTO['status']) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      render: (progress: number, record) => {
        let status: 'normal' | 'active' | 'success' | 'exception' = 'normal';
        if (record.status === 'running') status = 'active';
        else if (record.status === 'success') status = 'success';
        else if (record.status === 'failed') status = 'exception';
        return <Progress percent={progress || 0} size="small" status={status} />;
      },
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (msg: string) => (
        <Tooltip title={msg}>
          <span>{msg || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: SkillImportTaskDTO) => {
        const canCancel = record.status === 'pending' || record.status === 'running';
        return (
          <Space size="small">
            {canCancel ? (
              <Popconfirm
                title="确认取消"
                description="确定要取消该任务吗?"
                onConfirm={() => handleCancel(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<StopOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="确认删除"
                description="确定要删除该任务记录吗?"
                onConfirm={() => handleDelete(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<ReloadOutlined />} onClick={() => fetchImportTasks()}>
          刷新
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={taskLoading}
        columns={columns}
        dataSource={importTasks}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ImportTasks;
