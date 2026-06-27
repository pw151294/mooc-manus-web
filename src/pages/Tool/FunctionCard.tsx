import { Card, Tag, Button, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ToolFunctionDTO } from '@/types/tool';

interface FunctionCardProps {
  function: ToolFunctionDTO;
  onEdit: (func: ToolFunctionDTO) => void;
  onDelete: (id: string) => void;
}

export default function FunctionCard({ function: func, onEdit, onDelete }: FunctionCardProps) {
  return (
    <Card
      size="small"
      title={func.functionName}
      extra={
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(func)} />
          <Popconfirm
            title="确认删除"
            description="确定要删除该函数吗?"
            onConfirm={() => onDelete(func.functionId)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ marginBottom: '8px' }}>
        <Tag color="blue">{func.providerId}</Tag>
      </div>
      <div style={{ color: '#666', fontSize: '12px' }}>{func.functionDesc}</div>
    </Card>
  );
}
