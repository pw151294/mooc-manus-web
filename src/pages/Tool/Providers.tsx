import { useEffect, useState } from 'react';
import { Button, Input, Row, Col, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useToolStore } from '@/store/tool';
import ProviderCard from './ProviderCard';
import ProviderForm from './ProviderForm';
import type { ToolProviderDTO } from '@/types/tool';

const { Search } = Input;

export default function Providers() {
  const { providers, loading, fetchProviders, deleteProvider } = useToolStore();
  const [searchText, setSearchText] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ToolProviderDTO | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleAdd = () => {
    setEditingProvider(null);
    setFormVisible(true);
  };

  const handleEdit = (provider: ToolProviderDTO) => {
    setEditingProvider(provider);
    setFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProvider(id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormClose = () => {
    setFormVisible(false);
    setEditingProvider(null);
  };

  const filteredProviders = providers.filter(
    (p) =>
      p.providerName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.providerDesc.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <Search
          placeholder="搜索供应商名称或描述"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ flex: 1 }}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增供应商
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filteredProviders.map((provider) => (
            <Col key={provider.providerId} xs={24} sm={12} lg={8} xl={6}>
              <ProviderCard provider={provider} onEdit={handleEdit} onDelete={handleDelete} />
            </Col>
          ))}
        </Row>
      </Spin>

      {formVisible && <ProviderForm provider={editingProvider} onClose={handleFormClose} />}
    </div>
  );
}
