import type { FC } from 'react';
import { Card } from 'antd';
import { useParams } from 'react-router-dom';

const TaskDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Card>
      <h2>任务详情</h2>
      <p>任务 ID: {id}</p>
      <p>功能实现中...</p>
    </Card>
  );
};

export default TaskDetailPage;
