/**
 * Eval Tasks management page
 */

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Card, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTaskStore } from '@/store/evalTask';
import TaskFilters from './TaskFilters';
import TaskTable from './TaskTable';
import TaskCreateModal from './TaskCreateModal';

const EvalTasksPage: FC = () => {
  const filters = useTaskStore((s) => s.filters);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const startPolling = useTaskStore((s) => s.startPolling);
  const stopPolling = useTaskStore((s) => s.stopPolling);
  const applyFiltersAndFetch = useTaskStore((s) => s.applyFiltersAndFetch);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks().catch(() => {});
    startPolling();
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <TaskFilters
            value={filters.status}
            onChange={(status) => applyFiltersAndFetch({ status })}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            创建任务
          </Button>
        </Space>
      </Card>

      <Card>
        <TaskTable />
      </Card>

      <TaskCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default EvalTasksPage;
