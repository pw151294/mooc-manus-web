/**
 * Agent 左侧能力装配面板
 */
import type { FC } from 'react';
import { useEffect } from 'react';
import {
  Card,
  Select,
  Checkbox,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Empty,
  message,
} from 'antd';
import { useAppConfigStore } from '@/store/appConfig';
import { useToolStore } from '@/store/tool';
import { useSkillStore } from '@/store/skill';
import { useAgentStore } from '@/store/agent';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ConfigPanel: FC = () => {
  const { configs, fetchConfigs } = useAppConfigStore();
  const { functions, fetchAllFunctions } = useToolStore();
  const { skills, fetchSkills } = useSkillStore();

  const {
    selectedConfig,
    selectedTools,
    selectedSkills,
    systemPrompt,
    setSelectedConfig,
    setSelectedTools,
    setSelectedSkills,
    setSystemPrompt,
  } = useAgentStore();

  // 初始化加载数据
  useEffect(() => {
    if (configs.length === 0) {
      fetchConfigs().catch((err) => {
        const msg = err instanceof Error ? err.message : '未知错误';
        message.error(`加载模型配置失败: ${msg}`);
      });
    }
    if (functions.length === 0) {
      fetchAllFunctions().catch((err) => {
        const msg = err instanceof Error ? err.message : '未知错误';
        message.error(`加载工具列表失败: ${msg}`);
      });
    }
    if (skills.length === 0) {
      fetchSkills().catch((err) => {
        const msg = err instanceof Error ? err.message : '未知错误';
        message.error(`加载 Skill 列表失败: ${msg}`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfigChange = (id: string) => {
    const config = configs.find((c) => c.appConfigId === id) || null;
    setSelectedConfig(config);
  };

  const handleToolsChange = (ids: string[]) => {
    const tools = functions.filter((f) => ids.includes(f.functionId));
    setSelectedTools(tools);
  };

  const handleSkillToggle = (skillId: string, checked: boolean) => {
    if (checked) {
      const skill = skills.find((s) => s.skillId === skillId);
      if (skill) {
        setSelectedSkills([
          ...selectedSkills,
          { skill, version: skill.latestVersion?.version || 'v1.0.0' },
        ]);
      }
    } else {
      setSelectedSkills(selectedSkills.filter((s) => s.skill.skillId !== skillId));
    }
  };

  const handleSkillVersionChange = (skillId: string, version: string) => {
    setSelectedSkills(selectedSkills.map((s) => (s.skill.skillId === skillId ? { ...s, version } : s)));
  };

  const handleReset = () => {
    setSelectedConfig(null);
    setSelectedTools([]);
    setSelectedSkills([]);
    setSystemPrompt('');
    message.success('已重置配置');
  };

  const handleApply = () => {
    if (!selectedConfig) {
      message.warning('请先选择模型配置');
      return;
    }
    message.success('配置已应用');
  };

  const selectedSkillIds = selectedSkills.map((s) => s.skill.skillId);


  return (
    <Card
      title={
        <Title level={5} style={{ margin: 0 }}>
          能力装配
        </Title>
      }
      style={{ width: 300, height: '100%', overflow: 'auto' }}
      styles={{ body: { padding: 16 } }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 模型选择 */}
        <div>
          <Text strong>模型</Text>
          <Select
            placeholder="请选择模型配置"
            style={{ width: '100%', marginTop: 8 }}
            value={selectedConfig?.appConfigId}
            onChange={handleConfigChange}
            options={configs.map((c) => ({
              label: c.modelName,
              value: c.appConfigId,
            }))}
            notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无配置" />}
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* 工具包 */}
        <div>
          <Text strong>工具包</Text>
          <div style={{ marginTop: 8, maxHeight: 160, overflow: 'auto' }}>
            {functions.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工具" />
            ) : (
              <Checkbox.Group
                style={{ display: 'flex', flexDirection: 'column' }}
                value={selectedTools.map((t) => t.functionId)}
                onChange={(vals) => handleToolsChange(vals as string[])}
              >
                {functions.map((f) => (
                  <Checkbox key={f.functionId} value={f.functionId} style={{ marginLeft: 0 }}>
                    <span style={{ fontSize: 12 }}>
                      {f.functionName}
                      <span style={{ color: '#999' }}> ({f.providerId})</span>
                    </span>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            )}
          </div>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* Skills */}
        <div>
          <Text strong>Skills</Text>
          <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
            {skills.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Skill" />
            ) : (
              skills.map((skill) => {
                const isChecked = selectedSkillIds.includes(skill.skillId);
                const currentSelected = selectedSkills.find((s) => s.skill.skillId === skill.skillId);
                const defaultVersion = skill.latestVersion?.version || 'v1.0.0';
                return (
                  <div
                    key={skill.skillId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => handleSkillToggle(skill.skillId, e.target.checked)}
                    >
                      <span style={{ fontSize: 12 }}>{skill.skillName}</span>
                    </Checkbox>
                    {isChecked && (
                      <Select
                        size="small"
                        style={{ width: 90, marginLeft: 4 }}
                        value={currentSelected?.version}
                        onChange={(v) => handleSkillVersionChange(skill.skillId, v)}
                        options={[
                          {
                            label: defaultVersion,
                            value: defaultVersion,
                          },
                        ]}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        {/* 系统提示词 */}
        <div>
          <Text strong>系统提示词</Text>
          <TextArea
            placeholder="请输入系统提示词（可选）"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            style={{ marginTop: 8 }}
          />
        </div>

        {/* 操作按钮 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={handleReset}>重置配置</Button>
          <Button type="primary" onClick={handleApply}>
            应用
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

export default ConfigPanel;
