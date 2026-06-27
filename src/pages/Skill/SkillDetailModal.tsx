import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Modal, Tabs, Descriptions, Table, Tag, Button, Space, message, Avatar } from 'antd';
import type { TableProps } from 'antd';
import {
  AppstoreOutlined,
  DownloadOutlined,
  RollbackOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useSkillStore } from '@/store/skill';
import * as skillApi from '@/api/modules/skill';
import type { SkillDTO, SkillVersionDTO, SkillFileDTO } from '@/types/skill';

interface SkillDetailModalProps {
  skill: SkillDTO | null;
  open: boolean;
  onClose: () => void;
}

const statusMap: Record<SkillDTO['status'], { color: string; label: string }> = {
  online: { color: 'green', label: '已上线' },
  offline: { color: 'default', label: '已下线' },
  draft: { color: 'orange', label: '草稿' },
};

const SkillDetailModal: FC<SkillDetailModalProps> = ({ skill, open, onClose }) => {
  const { versions, versionLoading, fetchVersions, rollbackVersion } = useSkillStore();
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (skill && open) {
      fetchVersions(skill.id);
    }
  }, [skill, open, fetchVersions]);

  const handleRollback = async (versionId: string) => {
    try {
      await rollbackVersion(versionId);
      message.success('版本切换成功');
    } catch {
      message.error('版本切换失败');
    }
  };

  const handleExport = async (versionId: string, versionName: string) => {
    try {
      const blob = (await skillApi.exportVersion(versionId)) as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skill-${skill?.name || 'export'}-${versionName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const handleDownloadFile = (file: SkillFileDTO) => {
    if (file.download_url) {
      window.open(file.download_url, '_blank');
    } else {
      message.warning('文件下载链接不可用');
    }
  };

  const currentVersion = versions.find((v) => v.is_current);

  const versionColumns: TableProps<SkillVersionDTO>['columns'] = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (text: string, record) => (
        <Space>
          <Tag color={record.is_current ? 'blue' : 'default'}>{text}</Tag>
          {record.is_current && <Tag color="success">当前</Tag>}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      width: 200,
      render: (_: unknown, record: SkillVersionDTO) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<RollbackOutlined />}
            disabled={record.is_current}
            onClick={() => handleRollback(record.id)}
          >
            切换
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => handleExport(record.id, record.version)}
          >
            导出
          </Button>
        </Space>
      ),
    },
  ];

  const fileColumns: TableProps<SkillFileDTO>['columns'] = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: '大小(字节)',
      dataIndex: 'size',
      key: 'size',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: SkillFileDTO) => (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadFile(record)}
        >
          下载
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: skill ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="图标">
            <Avatar
              shape="square"
              src={skill.icon || undefined}
              icon={!skill.icon ? <AppstoreOutlined /> : undefined}
            />
          </Descriptions.Item>
          <Descriptions.Item label="名称">{skill.name}</Descriptions.Item>
          <Descriptions.Item label="Provider">{skill.provider_name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[skill.status].color}>{statusMap[skill.status].label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前版本">{skill.current_version || '-'}</Descriptions.Item>
          <Descriptions.Item label="版本数量">{skill.version_count}</Descriptions.Item>
          <Descriptions.Item label="描述">{skill.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{skill.created_at}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{skill.updated_at}</Descriptions.Item>
        </Descriptions>
      ) : null,
    },
    {
      key: 'versions',
      label: '版本列表',
      children: (
        <Table
          rowKey="id"
          size="small"
          loading={versionLoading}
          columns={versionColumns}
          dataSource={versions}
          pagination={false}
        />
      ),
    },
    {
      key: 'files',
      label: '文件列表',
      children: (
        <Table
          rowKey="id"
          size="small"
          loading={versionLoading}
          columns={fileColumns}
          dataSource={currentVersion?.files || []}
          pagination={false}
          locale={{ emptyText: '当前版本暂无文件' }}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={skill ? `Skill 详情: ${skill.name}` : 'Skill 详情'}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

export default SkillDetailModal;
