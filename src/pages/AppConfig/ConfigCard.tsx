/**
 * AppConfig 卡片组件
 */
import type { FC } from 'react';
import { Card, Button, Popconfirm, Space, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { AppConfigDTO } from '@/types/appConfig';

interface ConfigCardProps {
  config: AppConfigDTO;
  onEdit: (config: AppConfigDTO) => void;
  onDelete: (id: string) => void;
}

const ConfigCard: FC<ConfigCardProps> = ({ config, onEdit, onDelete }) => {
  return (
    <Card
      title={config.model_name}
      extra={
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(config)} />
          <Popconfirm
            title="确认删除"
            description="确定要删除此配置吗?"
            onConfirm={() => onDelete(config.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      }
      styles={{ body: { paddingTop: 8 } }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Base URL">{config.base_url}</Descriptions.Item>
        <Descriptions.Item label="Temperature">{config.temperature}</Descriptions.Item>
        <Descriptions.Item label="Max Tokens">{config.max_tokens}</Descriptions.Item>
        <Descriptions.Item label="Top P">{config.top_p}</Descriptions.Item>
        <Descriptions.Item label="Timeout">{config.timeout}ms</Descriptions.Item>
        <Descriptions.Item label="Stream">{config.stream ? '是' : '否'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ConfigCard;
