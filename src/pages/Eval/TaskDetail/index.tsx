/**
 * TaskDetail page - task summary + instance list with 3s intelligent polling
 */

import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Card, Space, Empty, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, retryTask, deleteTask, getInstance } from '@/api/modules/eval';
import { useInstanceStore } from '@/store/evalInstance';
import type { TaskView, InstanceView } from '@/types/eval';
import TaskSummaryCard from './TaskSummaryCard';
import InstanceFilters from './InstanceFilters';
import InstanceTable from './InstanceTable';
import InstanceDrawer from './InstanceDrawer';

const TaskDetailPage: FC = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const filterStatus = useInstanceStore((s) => s.filters.status);
  const applyFiltersAndFetch = useInstanceStore((s) => s.applyFiltersAndFetch);

  const [task, setTask] = useState<TaskView | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [activeInstance, setActiveInstance] = useState<InstanceView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refetchTask = useCallback(async () => {
    if (!taskId) return;
    setTaskLoading(true);
    try {
      const t = await getTask(taskId);
      setTask(t);
    } catch {
      message.error('加载任务失败');
    } finally {
      setTaskLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    refetchTask();
    const store = useInstanceStore.getState();
    store.fetchInstances(taskId).catch(() => {});
    store.startPolling(taskId);
    return () => {
      useInstanceStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!taskId) {
    return (
      <Card>
        <Empty description="无效的任务 ID" />
      </Card>
    );
  }

  const handleBack = () => navigate('/eval/tasks');

  const handleRetryFailed = () => {
    retryTask(taskId)
      .then(() => {
        message.success('重试成功');
        refetchTask();
        useInstanceStore
          .getState()
          .fetchInstances(taskId)
          .catch(() => {});
        useInstanceStore.getState().startPolling(taskId);
      })
      .catch(() => {});
  };

  const handleDelete = () => {
    deleteTask(taskId)
      .then(() => {
        message.success('任务已删除');
        navigate('/eval/tasks');
      })
      .catch(() => {});
  };

  const handleOpenDrawer = (inst: InstanceView) => {
    setActiveInstance(inst);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveInstance(null);
  };

  const handleRetryInstance = (id: string) => {
    useInstanceStore
      .getState()
      .retryInstance(id)
      .then(() => {
        getInstance(id)
          .then((fresh) => setActiveInstance(fresh))
          .catch(() => {});
      })
      .catch(() => {});
  };

  const handleOpenTrace = (inst: InstanceView) => {
    window.open(`/traces?traceId=${inst.trace_id}`, '_blank');
  };

  return (
    <>
      <TaskSummaryCard
        task={task}
        loading={taskLoading}
        onBack={handleBack}
        onRetryFailed={handleRetryFailed}
        onDelete={handleDelete}
      />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <InstanceFilters
            value={filterStatus}
            onChange={(status) => applyFiltersAndFetch({ status })}
          />
          <InstanceTable onOpenDrawer={handleOpenDrawer} />
        </Space>
      </Card>

      <InstanceDrawer
        open={drawerOpen}
        instance={activeInstance}
        onClose={handleCloseDrawer}
        onRetry={handleRetryInstance}
        onOpenTrace={handleOpenTrace}
      />
    </>
  );
};

export default TaskDetailPage;
