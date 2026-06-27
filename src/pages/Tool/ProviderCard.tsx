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
      title={provider.providerName}
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
            onConfirm={() => onDelete(provider.providerId)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ marginBottom: '8px' }}>
        <Tag>{provider.providerType}</Tag>
      </div>
      <div style={{ color: '#666', fontSize: '12px' }}>{provider.providerDesc}</div>
    </Card>
  );
}
