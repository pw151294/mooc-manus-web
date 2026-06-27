/**
 * AppConfig 表单 Modal
 */
import type { FC } from 'react';
import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { useAppConfigStore } from '@/store/appConfig';
import type { AppConfigDTO } from '@/types/appConfig';

interface ConfigFormProps {
  visible: boolean;
  config?: AppConfigDTO;
  onClose: () => void;
  onSuccess: () => void;
}

const ConfigForm: FC<ConfigFormProps> = ({ visible, config, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const { createConfig, updateConfig } = useAppConfigStore();

  useEffect(() => {
    if (visible) {
      if (config) {
        form.setFieldsValue(config);
      } else {
        form.resetFields();
      }
    }
  }, [visible, config, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (config) {
        await updateConfig(config.appConfigId, { ...values, appConfigId: config.appConfigId });
      } else {
        await createConfig(values);
      }

      onSuccess();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`提交失败: ${errorMessage}`);
    }
  };

  return (
    <Modal
      title={config ? '编辑配置' : '新增配置'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="确认"
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          temperature: 0.7,
          maxTokens: 2000,
        }}
      >
        <Form.Item
          label="模型名称"
          name="modelName"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="例如: gpt-4" />
        </Form.Item>

        <Form.Item
          label="Base URL"
          name="baseUrl"
          rules={[
            { required: true, message: '请输入 Base URL' },
            { type: 'url', message: '请输入有效的 URL' },
          ]}
        >
          <Input placeholder="例如: https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: '请输入 API Key' }]}
        >
          <Input.Password placeholder="请输入 API Key" />
        </Form.Item>

        <Form.Item label="Temperature" name="temperature">
          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Max Tokens" name="maxTokens">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Max Iterations" name="maxIterations">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Max Retries" name="maxRetries">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Max Search Results" name="maxSearchResults">
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigForm;
