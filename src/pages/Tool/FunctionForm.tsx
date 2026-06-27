import { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useToolStore } from '@/store/tool';
import type { ToolFunctionDTO } from '@/types/tool';

interface FunctionFormProps {
  function: ToolFunctionDTO | null;
  onClose: () => void;
}

export default function FunctionForm({ function: func, onClose }: FunctionFormProps) {
  const [form] = Form.useForm();
  const { providers, createFunction, updateFunction } = useToolStore();

  useEffect(() => {
    if (func) {
      form.setFieldsValue({
        ...func,
        parameters: JSON.stringify(func.properties, null, 2),
      });
    } else {
      form.resetFields();
    }
  }, [func, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        parameters: JSON.parse(values.parameters),
      };
      if (func) {
        await updateFunction(func.functionId, data);
        message.success('更新成功');
      } else {
        await createFunction(data);
        message.success('创建成功');
      }
      onClose();
    } catch (error) {
      if (error instanceof SyntaxError) {
        message.error('函数 Schema 格式错误');
      } else {
        message.error('操作失败');
      }
    }
  };

  return (
    <Modal
      title={func ? '编辑函数' : '新增函数'}
      open
      onOk={handleSubmit}
      onCancel={onClose}
      okText="确认"
      cancelText="取消"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="供应商"
          name="providerId"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <Select placeholder="请选择供应商" disabled={!!func}>
            {providers.map((p) => (
              <Select.Option key={p.providerId} value={p.providerId}>
                {p.providerName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="函数名称"
          name="functionName"
          rules={[{ required: true, message: '请输入函数名称' }]}
        >
          <Input placeholder="请输入函数名称" />
        </Form.Item>

        <Form.Item
          label="描述"
          name="functionDesc"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <Input.TextArea rows={2} placeholder="请输入描述" />
        </Form.Item>

        <Form.Item
          label="函数 Schema (JSON)"
          name="parameters"
          rules={[{ required: true, message: '请输入函数 Schema' }]}
        >
          <Input.TextArea rows={6} placeholder='{"type": "object", "properties": {}}' />
        </Form.Item>
      </Form>
    </Modal>
  );
}
