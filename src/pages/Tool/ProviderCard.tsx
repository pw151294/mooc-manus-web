import { Card, Tag, Button, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ToolProviderDTO } from '@/types/tool';

interface ProviderCardProps {
  provider: ToolProviderDTO;
  onEdit: (provider: ToolProviderDTO) => void;
  onDelete: (id: string) => void;
}

export default function ProviderCard({ provider, onEdit, onDelete }: ProviderCardProps) {
  return (
    <Card
      size="small"
      title={provider.name}
      extra={
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(provider)}
          />
          <Popconfirm
            title="确认删除"
            description="确定要删除该供应商吗?"
            onConfirm={() => onDelete(provider.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ marginBottom: '8px' }}>
        <Tag color={provider.status === 'active' ? 'green' : 'default'}>
          {provider.status === 'active' ? '激活' : '未激活'}
        </Tag>
        <Tag>{provider.provider_type}</Tag>
      </div>
      <div style={{ color: '#666', fontSize: '12px' }}>{provider.description}</div>
    </Card>
  );
}
