import type { FC } from 'react';
import { Card, Tag, Button, Popconfirm, Space, Avatar } from 'antd';
import {
  AppstoreOutlined,
  DeleteOutlined,
  EyeOutlined,
  PoweroffOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { SkillDTO } from '@/types/skill';

interface SkillCardProps {
  skill: SkillDTO;
  onView: (skill: SkillDTO) => void;
  onToggleStatus: (skill: SkillDTO) => void;
  onDelete: (id: string) => void;
}

const statusMap: Record<SkillDTO['status'], { color: string; label: string }> = {
  online: { color: 'green', label: '已上线' },
  offline: { color: 'default', label: '已下线' },
  draft: { color: 'orange', label: '草稿' },
};

const DEFAULT_STATUS_INFO = { color: 'default', label: '未知状态' };

const SkillCard: FC<SkillCardProps> = ({ skill, onView, onToggleStatus, onDelete }) => {
  const statusInfo = statusMap[skill.status] ?? DEFAULT_STATUS_INFO;
  const isOnline = skill.status === 'online';

  return (
    <Card
      size="small"
      hoverable
      title={
        <Space>
          <Avatar shape="square" size="small" icon={<AppstoreOutlined />} />
          <span>{skill.skillName}</span>
        </Space>
      }
      extra={<Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
      actions={[
        <Button
          key="view"
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onView(skill)}
        >
          详情
        </Button>,
        <Button
          key="toggle"
          type="text"
          size="small"
          icon={isOnline ? <PoweroffOutlined /> : <PlayCircleOutlined />}
          onClick={() => onToggleStatus(skill)}
        >
          {isOnline ? '下线' : '上线'}
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除"
          description="确定要删除该 Skill 吗?"
          onConfirm={() => onDelete(skill.skillId)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ]}
    >
      <div
        style={{
          color: '#666',
          fontSize: '12px',
          minHeight: '36px',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {skill.description || '暂无描述'}
      </div>
      <div style={{ fontSize: '12px', color: '#999' }}>
        <div>Provider: {skill.providerName}</div>
        <div>
          当前版本: <Tag>{skill.latestVersion?.version || '-'}</Tag>共 {skill.versionCount} 个版本
        </div>
      </div>
    </Card>
  );
};

export default SkillCard;
