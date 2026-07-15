import React from 'react';
import { Tabs, Descriptions, Alert, Typography, Tag, Timeline, Empty, Collapse } from 'antd';
import dayjs from 'dayjs';
import type { SpanNode } from '@/types/trace';
import { SPAN_TYPE_TAG_MAP, isOrphan, formatDuration } from './utils';

interface SpanDetailPanelProps {
  span: SpanNode;
}

/**
 * Render tag value with appropriate formatting
 */
function renderTagValue(val: unknown): React.ReactNode {
  if (typeof val === 'string') {
    if (val === '***') {
      return <Tag color="orange">已打码</Tag>;
    }
    if (val.length > 500) {
      return (
        <Typography.Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}>
          {val}
        </Typography.Paragraph>
      );
    }
    return val;
  }
  if (typeof val === 'object') {
    return <pre style={{ maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(val, null, 2)}</pre>;
  }
  return String(val);
}

/**
 * Span detail panel with 4 tabs: summary, tags, logs, json
 */
export default function SpanDetailPanel({ span }: SpanDetailPanelProps) {
  const orphan = isOrphan(span);
  const defaultActiveKey = span.is_error ? 'logs' : 'summary';

  // Prepare JSON (exclude children)
  const spanCopy = { ...span, children: undefined };
  const json = JSON.stringify(spanCopy, null, 2);

  // Get span-type-specific tags
  const spanTypeTags = SPAN_TYPE_TAG_MAP[span.span_type] || [];

  const items = [
    {
      key: 'summary',
      label: '概要',
      children: (
        <>
          {orphan && (
            <Alert
              type="warning"
              message="孤儿节点，父 Span ID 已丢失"
              description={`原始 parent_span_id: ${span.tags._original_parent}`}
              style={{ marginBottom: 16 }}
            />
          )}
          {span.is_error && (
            <Alert
              type="error"
              message="错误信息"
              description={(span.tags['error.message'] as string) || '未提供详细错误信息'}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Span ID">{span.span_id}</Descriptions.Item>
            <Descriptions.Item label="Span Type">
              <Tag>{span.span_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Operation Name" span={2}>
              {span.operation_name}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">{formatDuration(span.latency_ms)}</Descriptions.Item>
            <Descriptions.Item label="错误状态">
              <Tag color={span.is_error ? 'red' : 'green'}>{span.is_error ? '错误' : '成功'}</Tag>
            </Descriptions.Item>
            {spanTypeTags.map((tagKey) => {
              const tagValue = span.tags[tagKey];
              if (tagValue === undefined) {
                return null;
              }
              return (
                <Descriptions.Item key={tagKey} label={tagKey} span={2}>
                  {renderTagValue(tagValue)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </>
      ),
    },
    {
      key: 'tags',
      label: '完整 Tags',
      children: (
        <Descriptions column={1} bordered size="small">
          {Object.keys(span.tags)
            .sort()
            .map((key) => (
              <Descriptions.Item key={key} label={key}>
                {renderTagValue(span.tags[key])}
              </Descriptions.Item>
            ))}
        </Descriptions>
      ),
    },
    {
      key: 'logs',
      label: 'Logs',
      children:
        span.logs.length === 0 ? (
          <Empty description="无日志" />
        ) : (
          <Timeline mode="left">
            {span.logs.map((log, idx) => {
              const color =
                log.level === 'error'
                  ? 'red'
                  : log.level === 'warn'
                    ? 'orange'
                    : log.level === 'info'
                      ? 'blue'
                      : 'gray';
              const label = dayjs(log.ts / 1e6).format('HH:mm:ss.SSS');
              return (
                <Timeline.Item key={idx} color={color} label={label}>
                  <strong>{log.msg}</strong>
                  {log.extra && (
                    <Collapse
                      size="small"
                      aria-label="日志详细信息"
                      items={[
                        {
                          key: '1',
                          label: '查看详细信息',
                          children: (
                            <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                              {JSON.stringify(log.extra, null, 2)}
                            </pre>
                          ),
                        },
                      ]}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        ),
    },
    {
      key: 'json',
      label: '原始 JSON',
      children: (
        <>
          <Typography.Paragraph copyable={{ text: json }}>
            点击图标复制完整 JSON
          </Typography.Paragraph>
          <pre
            style={{
              maxHeight: '100%',
              fontSize: 12,
              background: '#fafafa',
              padding: 12,
              borderRadius: 4,
              overflow: 'auto',
            }}
          >
            {json}
          </pre>
        </>
      ),
    },
  ];

  return <Tabs defaultActiveKey={defaultActiveKey} items={items} />;
}
