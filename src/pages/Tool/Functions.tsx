import { useEffect, useState } from 'react';
import { Button, Input, Row, Col, Select, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useToolStore } from '@/store/tool';
import FunctionCard from './FunctionCard';
import FunctionForm from './FunctionForm';
import type { ToolFunctionDTO } from '@/types/tool';

const { Search } = Input;

export default function Functions() {
  const {
    providers,
    functions,
    selectedProviderId,
    loading,
    fetchProviders,
    fetchFunctions,
    setSelectedProviderId,
    deleteFunction,
  } = useToolStore();
  const [searchText, setSearchText] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingFunction, setEditingFunction] = useState<ToolFunctionDTO | null>(null);

  useEffect(() => {
    fetchProviders();
    fetchFunctions();
  }, [fetchProviders, fetchFunctions]);

  const handleAdd = () => {
    setEditingFunction(null);
    setFormVisible(true);
  };

  const handleEdit = (func: ToolFunctionDTO) => {
    setEditingFunction(func);
    setFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFunction(id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormClose = () => {
    setFormVisible(false);
    setEditingFunction(null);
  };

  const filteredFunctions = functions.filter(
    (f) =>
      f.name.toLowerCase().includes(searchText.toLowerCase()) ||
      f.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
        <Select
          placeholder="选择供应商"
          value={selectedProviderId}
          onChange={setSelectedProviderId}
          style={{ width: '200px' }}
          allowClear
        >
          {providers.map((p) => (
            <Select.Option key={p.id} value={p.id}>
              {p.name}
            </Select.Option>
          ))}
        </Select>
        <Search
          placeholder="搜索函数名称或描述"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ flex: 1 }}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增函数
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filteredFunctions.map((func) => (
            <Col key={func.id} xs={24} sm={12} lg={8} xl={6}>
              <FunctionCard function={func} onEdit={handleEdit} onDelete={handleDelete} />
            </Col>
          ))}
        </Row>
      </Spin>

      {formVisible && <FunctionForm function={editingFunction} onClose={handleFormClose} />}
    </div>
  );
}
