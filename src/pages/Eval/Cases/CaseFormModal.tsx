/**
 * CaseFormModal component - create/edit case form with 3-script tabs
 */

import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import { Modal, Form, Input, Select, Tabs } from 'antd';
import { useCaseStore } from '@/store/evalCase';
import ScriptInput from './ScriptInput';

interface CaseFormModalProps {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  description: string;
  tags: string[];
  init_script: string;
  task_prompt: string;
  verify_script: string;
}

const CaseFormModal: FC<CaseFormModalProps> = ({ open, editingId, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const { cases, createCase, updateCase } = useCaseStore();

  const editingCase = useMemo(
    () => (editingId ? cases.find((c) => c.id === editingId) : null),
    [editingId, cases]
  );

  const isEdit = editingId !== null;

  useEffect(() => {
    if (open) {
      if (editingCase) {
        form.setFieldsValue({
          name: editingCase.name,
          description: editingCase.description,
          tags: editingCase.tags,
          init_script: editingCase.init_script,
          task_prompt: editingCase.task_prompt,
          verify_script: editingCase.verify_script,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingCase, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit && editingId) {
        await updateCase(editingId, values);
      } else {
        await createCase({
          name: values.name,
          description: values.description,
          tags: values.tags,
          init_script: values.init_script,
          task_prompt: values.task_prompt,
          verify_script: values.verify_script,
        });
      }

      onClose();
    } catch (error) {
      // Form validation error or API error (already shown by store)
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      title={isEdit ? '编辑用例' : '创建用例'}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="用例名称"
          name="name"
          rules={[{ required: true, message: '请输入用例名称' }]}
        >
          <Input placeholder="用例名称" maxLength={200} />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea placeholder="用例描述" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

        <Form.Item label="标签" name="tags" initialValue={[]}>
          <Select mode="tags" placeholder="输入标签后回车添加" />
        </Form.Item>

        <Form.Item label="脚本">
          <Tabs
            items={[
              {
                key: 'init_script',
                label: '初始化脚本',
                children: (
                  <Form.Item name="init_script" noStyle>
                    <ScriptInput placeholder="初始化脚本（可选）" />
                  </Form.Item>
                ),
              },
              {
                key: 'task_prompt',
                label: '任务提示词',
                children: (
                  <Form.Item
                    name="task_prompt"
                    noStyle
                    rules={[{ required: true, message: '任务提示词必填' }]}
                  >
                    <ScriptInput placeholder="任务提示词（必填）" />
                  </Form.Item>
                ),
              },
              {
                key: 'verify_script',
                label: '验证脚本',
                children: (
                  <Form.Item name="verify_script" noStyle>
                    <ScriptInput placeholder="验证脚本（可选）" />
                  </Form.Item>
                ),
              },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CaseFormModal;
