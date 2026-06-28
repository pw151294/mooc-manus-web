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

const DEFAULT_STATUS_INFO = { color: 'default', label: '未知状态' };

const SkillDetailModal: FC<SkillDetailModalProps> = ({ skill, open, onClose }) => {
  const { versions, versionLoading, fetchVersions, rollbackVersion } = useSkillStore();
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (skill && open) {
      fetchVersions(skill.skillId);
    }
  }, [skill, open, fetchVersions]);

  const handleRollback = async (record: SkillVersionDTO) => {
    try {
      await rollbackVersion(record.skillId, record.version);
      message.success('版本切换成功');
    } catch {
      message.error('版本切换失败');
    }
  };

  const handleExport = async (record: SkillVersionDTO) => {
    try {
      const blob = (await skillApi.exportVersion(skill!.skillId, record.version)) as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skill-${skill?.skillName || 'export'}-${record.version}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const handleDownloadFile = async (file: SkillFileDTO) => {
    if (!file.fileKey) {
      message.warning('文件 fileKey 缺失,无法下载');
      return;
    }
    try {
      const blob = (await skillApi.downloadFile(file.fileKey)) as unknown as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // 文件名优先取 path 的最后一段,兜底用 fileKey 最后一段
      const fallbackName = file.fileKey.split('/').pop() || 'download';
      a.download = file.path ? file.path.split('/').pop() || fallbackName : fallbackName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('文件下载失败');
    }
  };

  const currentVersion = versions[0];

  const versionColumns: TableProps<SkillVersionDTO>['columns'] = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (text: string) => <Tag color="default">{text}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      width: 200,
      render: (_: unknown, record: SkillVersionDTO) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRollback(record)}
          >
            切换
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => handleExport(record)}
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
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
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
            <Avatar shape="square" icon={<AppstoreOutlined />} />
          </Descriptions.Item>
          <Descriptions.Item label="名称">{skill.skillName}</Descriptions.Item>
          <Descriptions.Item label="Provider">{skill.providerName}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={(statusMap[skill.status] ?? DEFAULT_STATUS_INFO).color}>
              {(statusMap[skill.status] ?? DEFAULT_STATUS_INFO).label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前版本">{skill.latestVersion?.version || '-'}</Descriptions.Item>
          <Descriptions.Item label="版本数量">{skill.versionCount}</Descriptions.Item>
          <Descriptions.Item label="描述">{skill.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{skill.createdAt}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{skill.updatedAt}</Descriptions.Item>
        </Descriptions>
      ) : null,
    },
    {
      key: 'versions',
      label: '版本列表',
      children: (
        <Table
          rowKey="skillVersionId"
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
          rowKey="fileKey"
          size="small"
          loading={versionLoading}
          columns={fileColumns}
          dataSource={currentVersion?.skillFiles || []}
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
      title={skill ? `Skill 详情: ${skill.skillName}` : 'Skill 详情'}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

export default SkillDetailModal;
