/**
 * Trace table component with pagination and row click handling
 */

import { Table, Tag, Typography, theme } from 'antd';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTraceStore } from '@/store/trace';
import type { TraceSummaryDTO } from '@/types/trace';
import { formatDuration, formatTimestamp } from './utils';

interface TraceTableProps {
  onRowClick: (traceId: string) => void;
}

export default function TraceTable({ onRowClick }: TraceTableProps) {
  const { token } = theme.useToken();
  const { traces, total, page, pageSize, loading, setPage, setPageSize } = useTraceStore();

  const columns: ColumnsType<TraceSummaryDTO> = [
    {
      title: '状态',
      dataIndex: 'is_error',
      key: 'is_error',
      width: 80,
      align: 'center',
      render: (isError: boolean) =>
        isError ? (
          <CloseCircleFilled
            style={{ color: token.colorError }}
            title="失败"
            aria-label="失败"
            role="img"
          />
        ) : (
          <CheckCircleFilled
            style={{ color: token.colorSuccess }}
            title="成功"
            aria-label="成功"
            role="img"
          />
        ),
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 200,
      render: (ns: number) => formatTimestamp(ns),
    },
    {
      title: 'Agent',
      dataIndex: 'agent_name',
      key: 'agent_name',
      width: 160,
      render: (name: string) => name || <span style={{ color: token.colorTextDisabled }}>--</span>,
    },
    {
      title: 'Query 预览',
      dataIndex: 'user_query_preview',
      key: 'user_query_preview',
      ellipsis: { showTitle: true },
      render: (preview: string) =>
        preview ? (
          <Typography.Text ellipsis>{preview}</Typography.Text>
        ) : (
          <span style={{ color: token.colorTextDisabled }}>--</span>
        ),
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 120,
      align: 'right',
      render: (ms: number) => formatDuration(ms),
    },
    {
      title: 'Span 数',
      dataIndex: 'span_count',
      key: 'span_count',
      width: 100,
      align: 'right',
      render: (count: number) => (count >= 50 ? <Tag color="orange">{count}</Tag> : count),
    },
  ];

  return (
    <Table<TraceSummaryDTO>
      columns={columns}
      dataSource={traces}
      rowKey="trace_id"
      loading={loading}
      size="middle"
      rowClassName={(row) => (row.is_error ? 'trace-row-error' : '')}
      onRow={(row) => ({
        onClick: () => onRowClick(row.trace_id),
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onRowClick(row.trace_id);
          }
        },
        tabIndex: 0,
        role: 'button',
        'aria-label': `查看 Trace ${row.trace_id.slice(0, 8)}`,
        style: { cursor: 'pointer' },
      })}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (t) => `共 ${t} 条`,
        onChange: (p, ps) => {
          setPage(p);
          if (ps !== pageSize) {
            setPageSize(ps);
          }
        },
      }}
    />
  );
}
