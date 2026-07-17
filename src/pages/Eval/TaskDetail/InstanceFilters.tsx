/**
 * InstanceFilters - controlled Radio.Group for instance status filter
 */

import type { FC } from 'react';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';

interface InstanceFiltersProps {
  value: string;
  onChange: (status: string) => void;
}

const options = [
  { label: '全部', value: '' },
  { label: '待执行', value: 'PENDING' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已完成', value: 'SUCCEEDED' },
  { label: '失败', value: 'FAILED' },
  { label: '超时', value: 'TIMEOUT' },
];

const InstanceFilters: FC<InstanceFiltersProps> = ({ value, onChange }) => {
  const handleChange = (e: RadioChangeEvent) => {
    onChange(e.target.value as string);
  };

  return (
    <Radio.Group
      optionType="button"
      buttonStyle="solid"
      options={options}
      value={value}
      onChange={handleChange}
    />
  );
};

export default InstanceFilters;
