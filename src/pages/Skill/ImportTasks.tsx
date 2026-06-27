import { useEffect } from 'react';
import type { FC } from 'react';
import { Table, Tag, Progress, Button, Space, Popconfirm, message, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSkillStore } from '@/store/skill';
import type { SkillImportTaskDTO } from '@/types/skill';

const statusMap: Record<SkillImportTaskDTO['status'], { color: string; label: string }> = {
  pending: { color: 'default', label: '等待中' },
  running: { color: 'processing', label: '进行中' },
  success: { color: 'success', label: '成功' },
  failed: { color: 'error', label: '失败' },
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

  useEffect(() => {
    importTasks.forEach((task) => {
      if (task.status === 'pending' || task.status === 'running') {
        subscribeImportTask(task.taskId);
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
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name}>
          <span>{name || '-'}</span>
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
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      ellipsis: true,
      render: (stage: string) => (
        <Tooltip title={stage}>
          <span>{stage || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
                onConfirm={() => handleCancel(record.taskId)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<DeleteOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="确认删除"
                description="确定要删除该任务记录吗?"
                onConfirm={() => handleDelete(record.taskId)}
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
        rowKey="taskId"
        loading={taskLoading}
        columns={columns}
        dataSource={importTasks}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ImportTasks;
