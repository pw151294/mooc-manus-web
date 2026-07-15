import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Input, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useTraceStore } from '@/store/trace';
import type { TraceListFilters } from '@/store/trace';

const { RangePicker } = DatePicker;

/**
 * Default filter values
 */
const defaultFilters: TraceListFilters = {
  conversationId: '',
  agentName: '',
  isError: 'all',
  startTimeFrom: null,
  startTimeTo: null,
};

/**
 * Filter controls component for trace list page
 * Manages local temporary state and submits to store on "查询" click
 */
const TraceFilters: FC = () => {
  const { filters, loading, applyFiltersAndFetch, resetFilters, fetchTraces } = useTraceStore();

  // Local state for temporary filter values (not committed until "查询")
  const [localFilters, setLocalFilters] = useState<TraceListFilters>(filters);
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);

  // Sync external filter changes to local state (rare, but needed for resetFilters)
  useEffect(() => {
    setLocalFilters(filters);

    // Sync time range from Unix ns to Dayjs
    if (filters.startTimeFrom !== null && filters.startTimeTo !== null) {
      setTimeRange([
        dayjs(filters.startTimeFrom / 1_000_000),
        dayjs(filters.startTimeTo / 1_000_000),
      ]);
    } else {
      setTimeRange(null);
    }
  }, [filters]);

  // Handle conversation_id change
  const handleConversationIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters((prev) => ({ ...prev, conversationId: e.target.value }));
  };

  // Handle agent_name change
  const handleAgentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters((prev) => ({ ...prev, agentName: e.target.value }));
  };

  // Handle isError change
  const handleIsErrorChange = (value: 'all' | 'true' | 'false') => {
    setLocalFilters((prev) => ({ ...prev, isError: value }));
  };

  // Handle time range change
  const handleTimeRangeChange = (dates: [Dayjs, Dayjs] | null) => {
    setTimeRange(dates);

    if (dates === null) {
      setLocalFilters((prev) => ({
        ...prev,
        startTimeFrom: null,
        startTimeTo: null,
      }));
    } else {
      // Convert Dayjs to Unix ns
      setLocalFilters((prev) => ({
        ...prev,
        startTimeFrom: dates[0].valueOf() * 1_000_000,
        startTimeTo: dates[1].valueOf() * 1_000_000,
      }));
    }
  };

  // Handle "查询" button click
  const handleApply = () => {
    applyFiltersAndFetch(localFilters);
  };

  // Handle "重置" button click
  const handleReset = () => {
    setLocalFilters(defaultFilters);
    setTimeRange(null);
    resetFilters();
  };

  // Handle "刷新" button click
  const handleRefresh = () => {
    fetchTraces();
  };

  // RangePicker presets
  const rangePresets = [
    { label: '最近1小时', value: [dayjs().subtract(1, 'hour'), dayjs()] as [Dayjs, Dayjs] },
    { label: '最近24小时', value: [dayjs().subtract(24, 'hour'), dayjs()] as [Dayjs, Dayjs] },
    { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] as [Dayjs, Dayjs] },
  ];

  return (
    <Space wrap style={{ marginBottom: 16 }}>
      <Input
        placeholder="按 conversation_id 精确筛选"
        value={localFilters.conversationId}
        onChange={handleConversationIdChange}
        onPressEnter={handleApply}
        allowClear
        style={{ width: 240 }}
      />

      <Input
        placeholder="按 agent_name 精确筛选"
        value={localFilters.agentName}
        onChange={handleAgentNameChange}
        onPressEnter={handleApply}
        allowClear
        style={{ width: 240 }}
      />

      <Select
        value={localFilters.isError}
        onChange={handleIsErrorChange}
        style={{ width: 120 }}
        options={[
          { label: '全部', value: 'all' },
          { label: '仅失败', value: 'true' },
          { label: '仅成功', value: 'false' },
        ]}
      />

      <RangePicker
        value={timeRange}
        onChange={(dates) => handleTimeRangeChange(dates as [Dayjs, Dayjs] | null)}
        showTime
        format="YYYY-MM-DD HH:mm:ss"
        allowClear
        presets={rangePresets}
      />

      <Button onClick={handleReset}>重置</Button>

      <Button type="primary" icon={<SearchOutlined />} onClick={handleApply}>
        查询
      </Button>

      <Button icon={<ReloadOutlined />} loading={loading} onClick={handleRefresh}>
        刷新
      </Button>
    </Space>
  );
};

export default TraceFilters;
