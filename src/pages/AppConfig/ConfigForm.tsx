/**
 * AppConfig 表单 Modal
 */
import type { FC } from 'react';
import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
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
        await updateConfig(config.id, { ...values, appConfigId: config.id });
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
          max_tokens: 2000,
          top_p: 0.9,
          timeout: 30000,
          stream: false,
        }}
      >
        <Form.Item
          label="模型名称"
          name="model_name"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="例如: gpt-4" />
        </Form.Item>

        <Form.Item
          label="Base URL"
          name="base_url"
          rules={[
            { required: true, message: '请输入 Base URL' },
            { type: 'url', message: '请输入有效的 URL' },
          ]}
        >
          <Input placeholder="例如: https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          label="API Key"
          name="api_key"
          rules={[{ required: true, message: '请输入 API Key' }]}
        >
          <Input.Password placeholder="请输入 API Key" />
        </Form.Item>

        <Form.Item
          label="Temperature"
          name="temperature"
          rules={[
            { required: true, message: '请输入 Temperature' },
            { type: 'number', min: 0, max: 1, message: 'Temperature 必须在 0-1 之间' },
          ]}
        >
          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Max Tokens"
          name="max_tokens"
          rules={[
            { required: true, message: '请输入 Max Tokens' },
            { type: 'number', min: 1, message: 'Max Tokens 必须大于 0' },
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Top P"
          name="top_p"
          rules={[
            { required: true, message: '请输入 Top P' },
            { type: 'number', min: 0, max: 1, message: 'Top P 必须在 0-1 之间' },
          ]}
        >
          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="Timeout (ms)"
          name="timeout"
          rules={[
            { required: true, message: '请输入 Timeout' },
            { type: 'number', min: 1, message: 'Timeout 必须大于 0' },
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Stream" name="stream" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigForm;
