import { useState, useEffect, useRef } from 'react';
import { Modal, Spin, Result, Button, Flex, Tag, Radio, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { TraceDetailDTO } from '@/types/trace';
import { getTraceDetailSafe } from '@/api/modules/trace';
import { formatDuration, formatTimestamp, findSpanById } from './utils';
import FlameGraph from './FlameGraph';
import SpanDetailPanel from './SpanDetailPanel';

interface TraceDetailModalProps {
  traceId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function TraceDetailModal({ traceId, open, onClose }: TraceDetailModalProps) {
  const [detail, setDetail] = useState<TraceDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<'not_found' | 'server' | null>(null);
  const [selectedSpanId, setSelectedSpanId] = useState<number | null>(null);
  const [colorMode, setColorMode] = useState<'type' | 'heat'>('type');
  const abortRef = useRef<AbortController | null>(null);

  // Extract common data fetching logic
  const fetchTraceDetail = async (id: string) => {
    // Abort previous request if exists
    if (abortRef.current) {
      abortRef.current.abort();
    }

    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const result = await getTraceDetailSafe(id, abortRef.current.signal);

    console.log('getTraceDetailSafe result:', result);

    setLoading(false);

    if (result.ok) {
      console.log('Trace detail loaded:', result.data);
      setDetail(result.data);
      setSelectedSpanId(result.data.root.span_id);
    } else {
      console.error('Failed to load trace detail:', result.status);
      if (result.status === 404) {
        setError('not_found');
      } else if (result.status === 500) {
        setError('server');
      } else {
        setError('server'); // network error treated as server error
      }
    }
  };

  // Data fetching effect
  useEffect(() => {
    if (!open || !traceId) return;

    fetchTraceDetail(traceId);

    // No cleanup needed - abort happens at the start of fetchTraceDetail
  }, [open, traceId]);

  // Handle modal close
  const handleClose = () => {
    setDetail(null);
    setSelectedSpanId(null);
    setColorMode('type');
    setError(null);
    onClose();
  };

  // Handle copy trace_id
  const handleCopyTraceId = () => {
    if (traceId) {
      navigator.clipboard.writeText(traceId);
      message.success('已复制 trace_id');
    }
  };

  // Handle span selection
  const handleSpanClick = (span: { span_id: number }) => {
    setSelectedSpanId(span.span_id);
  };

  // Handle retry on server error
  const handleRetry = () => {
    if (traceId) {
      fetchTraceDetail(traceId);
    }
  };

  // Find selected span
  const selectedSpan = detail && selectedSpanId ? findSpanById(detail.root, selectedSpanId) : null;

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <span>链路详情</span>
          {traceId && (
            <>
              <Tag>{traceId.slice(0, 8)}</Tag>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyTraceId}
              />
            </>
          )}
        </Flex>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width="90vw"
      styles={{
        body: {
          height: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      destroyOnClose
    >
      {loading && (
        <Flex justify="center" align="center" style={{ height: '100%' }}>
          <Spin size="large" />
        </Flex>
      )}

      {error === 'not_found' && <Result status="404" title="Trace 不存在" />}

      {error === 'server' && (
        <Result
          status="500"
          title="加载失败"
          extra={
            <Button type="primary" onClick={handleRetry}>
              重试
            </Button>
          }
        />
      )}

      {!loading && !error && detail && (
        <>
          {/* Header bar */}
          <Flex
            justify="space-between"
            align="center"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Flex gap={16} wrap style={{ fontSize: 13 }}>
              <span>开始: {formatTimestamp(detail.start_time)}</span>
              <span>耗时: {formatDuration(detail.duration_ms)}</span>
              <span>Span 数: {detail.span_count}</span>
              <span>
                状态:{' '}
                <Tag color={detail.is_error ? 'red' : 'green'}>
                  {detail.is_error ? '错误' : '成功'}
                </Tag>
              </span>
            </Flex>
            <Radio.Group
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value)}
              size="small"
            >
              <Radio.Button value="type">按类型</Radio.Button>
              <Radio.Button value="heat">按耗时</Radio.Button>
            </Radio.Group>
          </Flex>

          {/* Flame graph section */}
          <div
            style={{
              flex: 4,
              overflow: 'auto',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <FlameGraph
              root={detail.root}
              selectedSpanId={selectedSpanId}
              colorMode={colorMode}
              onSpanClick={handleSpanClick}
            />
          </div>

          {/* Span detail section */}
          <div style={{ flex: 6, overflow: 'auto', padding: 16 }}>
            {selectedSpan && <SpanDetailPanel span={selectedSpan} />}
          </div>
        </>
      )}
    </Modal>
  );
}
