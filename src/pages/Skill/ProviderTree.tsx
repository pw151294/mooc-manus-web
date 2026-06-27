import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Tree, Button, Space, Empty, Spin } from 'antd';
import { ImportOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSkillStore } from '@/store/skill';

interface ProviderTreeProps {
  onImportClick: () => void;
}

const ProviderTree: FC<ProviderTreeProps> = ({ onImportClick }) => {
  const { providers, loading, selectedProviderId, fetchProviders, setSelectedProviderId } =
    useSkillStore();
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['official', 'custom']);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const treeData = useMemo(() => {
    const officialChildren = providers
      .filter((p) => p.type === 'official')
      .map((p) => ({
        title: `${p.name} (${p.skill_count})`,
        key: p.id,
        isLeaf: true,
      }));
    const customChildren = providers
      .filter((p) => p.type === 'custom')
      .map((p) => ({
        title: `${p.name} (${p.skill_count})`,
        key: p.id,
        isLeaf: true,
      }));

    return [
      {
        title: `官方 (${officialChildren.length})`,
        key: 'official',
        selectable: false,
        children: officialChildren,
      },
      {
        title: `自定义 (${customChildren.length})`,
        key: 'custom',
        selectable: false,
        children: customChildren,
      },
    ];
  }, [providers]);

  const handleSelect = (keys: React.Key[]) => {
    const key = keys[0];
    if (!key || key === 'official' || key === 'custom') {
      setSelectedProviderId(null);
      return;
    }
    setSelectedProviderId(String(key));
  };

  const handleResetSelection = () => {
    setSelectedProviderId(null);
  };

  const selectedKeys = selectedProviderId ? [selectedProviderId] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600 }}>Provider</span>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleResetSelection}
          title="重置选择"
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <Spin spinning={loading}>
          {providers.length === 0 && !loading ? (
            <Empty description="暂无 Provider" />
          ) : (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys)}
              selectedKeys={selectedKeys}
              onSelect={handleSelect}
              blockNode
            />
          )}
        </Spin>
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
        <Space style={{ width: '100%' }} direction="vertical">
          <Button type="primary" icon={<ImportOutlined />} block onClick={onImportClick}>
            导入 Provider
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ProviderTree;
