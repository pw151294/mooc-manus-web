import { useEffect } from 'react';
import type { FC } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useSkillStore } from '@/store/skill';
import type { SkillImportRequest } from '@/types/skill';

interface ImportProviderModalProps {
  open: boolean;
  onClose: () => void;
  onImportCreated?: (taskId: string) => void;
}

const ImportProviderModal: FC<ImportProviderModalProps> = ({ open, onClose, onImportCreated }) => {
  const [form] = Form.useForm<SkillImportRequest>();
  const { createImportTask, subscribeImportTask } = useSkillStore();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const task = await createImportTask(values);
      message.success('已创建导入任务');
      if (task?.taskId) {
        subscribeImportTask(task.taskId);
        onImportCreated?.(task.taskId);
      }
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        return;
      }
      message.error('导入失败');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      title="导入 Provider"
      okText="开始导入"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Provider 名称"
          name="providerName"
          rules={[{ required: true, message: '请输入 Provider 名称' }]}
        >
          <Input placeholder="例如: my-skill-provider" />
        </Form.Item>

        <Form.Item
          label="仓库 URL"
          name="repoUrl"
          rules={[{ required: true, message: '请输入仓库 URL' }]}
        >
          <Input placeholder="例如: https://github.com/xxx/skill.git" />
        </Form.Item>

        <Form.Item label="认证类型" name="authType">
          <Select allowClear placeholder="无需认证">
            <Select.Option value="none">无</Select.Option>
            <Select.Option value="token">Token</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="认证 Token" name="authToken">
          <Input.Password placeholder="认证 Token（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImportProviderModal;
