import { useEffect } from 'react';
import type { FC } from 'react';
import { Modal, Form, Input, Radio, Select, message } from 'antd';
import { useSkillStore } from '@/store/skill';
import type { SkillImportRequest } from '@/types/skill';

interface ImportProviderModalProps {
  open: boolean;
  onClose: () => void;
  onImportCreated?: (taskId: string) => void;
}

const ImportProviderModal: FC<ImportProviderModalProps> = ({ open, onClose, onImportCreated }) => {
  const [form] = Form.useForm<SkillImportRequest>();
  const { providers, createImportTask, subscribeImportTask } = useSkillStore();

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
      // 自动订阅 SSE 进度
      if (task?.id) {
        subscribeImportTask(task.id);
        onImportCreated?.(task.id);
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
      <Form form={form} layout="vertical" initialValues={{ source_type: 'git' }}>
        <Form.Item
          label="来源类型"
          name="source_type"
          rules={[{ required: true, message: '请选择来源类型' }]}
        >
          <Radio.Group>
            <Radio value="git">Git 仓库</Radio>
            <Radio value="zip">ZIP 包</Radio>
            <Radio value="url">URL</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="来源 URL"
          name="source_url"
          rules={[{ required: true, message: '请输入来源 URL' }]}
        >
          <Input placeholder="例如: https://github.com/xxx/skill.git" />
        </Form.Item>

        <Form.Item
          label="目标 Provider (可选)"
          name="provider_id"
          help="留空则创建新 Provider,选择后则更新到已有 Provider"
        >
          <Select
            placeholder="选择 Provider"
            allowClear
            options={providers.map((p) => ({
              label: `${p.name} (${p.type === 'official' ? '官方' : '自定义'})`,
              value: p.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImportProviderModal;
