/**
 * AppConfig 管理页面
 */
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Button, Input, Row, Col, Spin, Empty, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useAppConfigStore } from '@/store/appConfig';
import type { AppConfigDTO } from '@/types/appConfig';
import ConfigCard from './ConfigCard';
import ConfigForm from './ConfigForm';

const AppConfig: FC = () => {
  const { configs, loading, fetchConfigs, deleteConfig } = useAppConfigStore();
  const [searchText, setSearchText] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AppConfigDTO | undefined>();

  useEffect(() => {
    fetchConfigs().catch((error) => {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`加载配置失败: ${errorMessage}`);
    });
  }, [fetchConfigs]);

  const handleEdit = (config: AppConfigDTO) => {
    setEditingConfig(config);
    setFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConfig(id);
      message.success('删除成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`删除失败: ${errorMessage}`);
    }
  };

  const handleFormClose = () => {
    setFormVisible(false);
    setEditingConfig(undefined);
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    setEditingConfig(undefined);
    message.success(editingConfig ? '更新成功' : '创建成功');
  };

  const filteredConfigs = configs.filter(
    (config) =>
      config.modelName.toLowerCase().includes(searchText.toLowerCase()) ||
      config.baseUrl.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* 顶部工具栏 */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Input
          placeholder="搜索模型名称或 Base URL"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormVisible(true)}>
          新增配置
        </Button>
      </div>

      {/* 卡片列表 */}
      <Spin spinning={loading}>
        {filteredConfigs.length === 0 ? (
          <Empty description="暂无配置" />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredConfigs.map((config) => (
              <Col key={config.appConfigId} xs={24} sm={12} lg={8} xl={6}>
                <ConfigCard config={config} onEdit={handleEdit} onDelete={handleDelete} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* 表单 Modal */}
      <ConfigForm
        visible={formVisible}
        config={editingConfig}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default AppConfig;
