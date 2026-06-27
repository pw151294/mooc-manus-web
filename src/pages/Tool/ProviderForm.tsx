import { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useToolStore } from '@/store/tool';
import type { ToolProviderDTO } from '@/types/tool';

interface ProviderFormProps {
  provider: ToolProviderDTO | null;
  onClose: () => void;
}

export default function ProviderForm({ provider, onClose }: ProviderFormProps) {
  const [form] = Form.useForm();
  const { createProvider, updateProvider } = useToolStore();

  useEffect(() => {
    if (provider) {
      form.setFieldsValue(provider);
    } else {
      form.resetFields();
    }
  }, [provider, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (provider) {
        await updateProvider(provider.providerId, values);
        message.success('更新成功');
      } else {
        await createProvider(values);
        message.success('创建成功');
      }
      onClose();
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <Modal
      title={provider ? '编辑供应商' : '新增供应商'}
      open
      onOk={handleSubmit}
      onCancel={onClose}
      okText="确认"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="供应商名称"
          name="providerName"
          rules={[{ required: true, message: '请输入供应商名称' }]}
        >
          <Input placeholder="请输入供应商名称" />
        </Form.Item>

        <Form.Item
          label="供应商类型"
          name="providerType"
          rules={[{ required: true, message: '请选择供应商类型' }]}
        >
          <Select placeholder="请选择供应商类型">
            <Select.Option value="mcp">MCP</Select.Option>
            <Select.Option value="builtin">内置</Select.Option>
            <Select.Option value="custom">自定义</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="描述"
          name="providerDesc"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <Input.TextArea rows={3} placeholder="请输入描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
