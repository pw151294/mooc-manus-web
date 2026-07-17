/**
 * TaskCreateModal - three-part form to create an M×N eval task
 * Uses direct API calls (listCases/listAgentConfigs) to avoid polluting case store state.
 */

import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Transfer, Typography, Form, message } from 'antd';
import type { TransferProps } from 'antd';
import { listCases, listAgentConfigs } from '@/api/modules/eval';
import { useTaskStore } from '@/store/evalTask';
import type { CaseView, AgentConfigView } from '@/types/eval';

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
}

interface TransferItem {
  key: string;
  title: string;
}

const TaskCreateModal: FC<TaskCreateModalProps> = ({ open, onClose }) => {
  const createTask = useTaskStore((s) => s.createTask);

  const [name, setName] = useState('');
  const [caseTargetKeys, setCaseTargetKeys] = useState<string[]>([]);
  const [agentTargetKeys, setAgentTargetKeys] = useState<string[]>([]);
  const [cases, setCases] = useState<CaseView[]>([]);
  const [agents, setAgents] = useState<AgentConfigView[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setCaseTargetKeys([]);
    setAgentTargetKeys([]);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([listCases({ page: 1, size: 100 }), listAgentConfigs()])
      .then(([caseResp, agentResp]) => {
        setCases(caseResp.items);
        setAgents(agentResp);
      })
      .catch(() => {
        message.error('加载用例或 Agent 配置失败');
      })
      .finally(() => setLoading(false));
  }, [open]);

  const caseData: TransferItem[] = useMemo(
    () => cases.map((c) => ({ key: c.id, title: c.name })),
    [cases]
  );

  const agentData: TransferItem[] = useMemo(
    () => agents.map((a) => ({ key: a.id, title: `${a.provider}/${a.model_name}` })),
    [agents]
  );

  const M = caseTargetKeys.length;
  const N = agentTargetKeys.length;

  const disabled = !name.trim() || M === 0 || N === 0 || submitting;

  const filterOption: TransferProps<TransferItem>['filterOption'] = (input, item) =>
    item.title.toLowerCase().includes(input.toLowerCase());

  const handleCancel = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (disabled) return;
    setSubmitting(true);
    try {
      await createTask({
        name: name.trim(),
        case_ids: caseTargetKeys,
        agent_config_ids: agentTargetKeys,
      });
      reset();
      onClose();
    } catch {
      // Keep modal open, message handled by store/interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="创建评测任务"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="创建"
      cancelText="取消"
      okButtonProps={{ disabled, loading: submitting }}
      width={860}
      destroyOnClose
      maskClosable={!submitting}
    >
      <Form layout="vertical">
        <Form.Item label="任务名" required>
          <Input
            placeholder="请输入任务名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </Form.Item>

        <Form.Item label="选择用例" required>
          <Transfer<TransferItem>
            dataSource={caseData}
            titles={['可选', '已选']}
            targetKeys={caseTargetKeys}
            onChange={(keys) => setCaseTargetKeys(keys as string[])}
            render={(item) => item.title}
            showSearch
            filterOption={filterOption}
            listStyle={{ width: 360, height: 240 }}
            disabled={loading}
          />
        </Form.Item>

        <Form.Item label="选择 Agent 配置" required>
          <Transfer<TransferItem>
            dataSource={agentData}
            titles={['可选', '已选']}
            targetKeys={agentTargetKeys}
            onChange={(keys) => setAgentTargetKeys(keys as string[])}
            render={(item) => item.title}
            showSearch
            filterOption={filterOption}
            listStyle={{ width: 360, height: 240 }}
            disabled={loading}
          />
        </Form.Item>

        <Typography.Text type="secondary">
          将创建 {M} × {N} = {M * N} 个实例
        </Typography.Text>
      </Form>
    </Modal>
  );
};

export default TaskCreateModal;
