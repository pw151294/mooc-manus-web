/**
 * CaseTable component - table with pagination and CRUD actions
 */

import type { FC } from 'react';
import { Table, Tag, Typography, Space, Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCaseStore } from '@/store/evalCase';
import type { CaseView } from '@/types/eval';

interface CaseTableProps {
  onView: (caseId: string) => void;
  onEdit: (caseId: string) => void;
  onDelete: (caseId: string) => void;
}

const CaseTable: FC<CaseTableProps> = ({ onView, onEdit, onDelete }) => {
  const { cases, total, page, pageSize, loading, setPage, setPageSize } = useCaseStore();

  const columns: ColumnsType<CaseView> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: CaseView) => (
        <Typography.Link onClick={() => onView(record.id)}>{name}</Typography.Link>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: { showTitle: true },
      render: (desc: string) =>
        desc ? (
          <Typography.Text ellipsis>{desc}</Typography.Text>
        ) : (
          <span style={{ color: '#999' }}>--</span>
        ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[] | null | undefined) =>
        tags && tags.length > 0 ? (
          <Space wrap size="small">
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>--</span>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record: CaseView) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => onView(record.id)}>
            查看
          </Button>
          <Button type="link" size="small" onClick={() => onEdit(record.id)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此用例吗？"
            description="此操作不可撤销"
            onConfirm={() => onDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table<CaseView>
      columns={columns}
      dataSource={cases}
      rowKey="id"
      loading={loading}
      size="middle"
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (t) => `共 ${t} 条`,
        onChange: (p, ps) => {
          if (p !== page) {
            setPage(p);
          }
          if (ps !== pageSize) {
            setPageSize(ps);
          }
        },
      }}
    />
  );
};

export default CaseTable;
