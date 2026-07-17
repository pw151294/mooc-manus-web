/**
 * CaseDetailDrawer component - read-only case detail view
 */

import type { FC } from 'react';
import { useMemo } from 'react';
import { Drawer, Descriptions, Tag, Space, Button, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import { useCaseStore } from '@/store/evalCase';

interface CaseDetailDrawerProps {
  caseId: string | null;
  onClose: () => void;
  onEdit: (caseId: string) => void;
}

const CaseDetailDrawer: FC<CaseDetailDrawerProps> = ({ caseId, onClose, onEdit }) => {
  const { cases } = useCaseStore();

  const caseData = useMemo(() => (caseId ? cases.find((c) => c.id === caseId) : null), [caseId, cases]);

  if (!caseData) {
    return null;
  }

  return (
    <Drawer
      open={Boolean(caseId)}
      onClose={onClose}
      title="用例详情"
      width={720}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type="primary" onClick={() => onEdit(caseData.id)}>
            编辑
          </Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="名称">{caseData.name}</Descriptions.Item>
        <Descriptions.Item label="描述">
          {caseData.description || <span style={{ color: '#999' }}>--</span>}
        </Descriptions.Item>
        <Descriptions.Item label="标签">
          {caseData.tags.length > 0 ? (
            <Space wrap size="small">
              {caseData.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          ) : (
            <span style={{ color: '#999' }}>--</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(caseData.created_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {dayjs(caseData.updated_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
        脚本内容
      </Typography.Title>

      <Tabs
        items={[
          {
            key: 'init_script',
            label: '初始化脚本',
            children: (
              <pre
                style={{
                  background: '#fafafa',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                {caseData.init_script || '（无）'}
              </pre>
            ),
          },
          {
            key: 'task_prompt',
            label: '任务提示词',
            children: (
              <pre
                style={{
                  background: '#fafafa',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                {caseData.task_prompt || '（无）'}
              </pre>
            ),
          },
          {
            key: 'verify_script',
            label: '验证脚本',
            children: (
              <pre
                style={{
                  background: '#fafafa',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
              >
                {caseData.verify_script || '（无）'}
              </pre>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default CaseDetailDrawer;
