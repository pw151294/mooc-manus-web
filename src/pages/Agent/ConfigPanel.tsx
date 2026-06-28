/**
 * Agent 左侧能力装配面板
 */
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
  Collapse,
  Spin,
  message,
} from 'antd';
import { CaretRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAppConfigStore } from '@/store/appConfig';
import { useToolStore } from '@/store/tool';
import { useSkillStore } from '@/store/skill';
import { useAgentStore } from '@/store/agent';
import * as toolApi from '@/api/modules/tool';
import * as skillApi from '@/api/modules/skill';
import type { ToolFunctionDTO } from '@/types/tool';
import type { SkillVersionDTO } from '@/types/skill';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ConfigPanel: FC = () => {
  const { configs, fetchConfigs } = useAppConfigStore();
  // 工具包从扁平展示改为按 Provider 折叠分组,这里只需 providers 列表;
  // functions 数据改为本地按需缓存,不再通过 store 一次性预加载。
  const { providers, fetchProviders } = useToolStore();
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

  // ===== 工具包(双层折叠菜单)本地状态 =====
  // 按 providerId 缓存子函数列表,避免重复请求
  const [functionsByProvider, setFunctionsByProvider] = useState<Record<string, ToolFunctionDTO[]>>(
    {}
  );
  // 正在加载的 providerId 集合,用于 panel body 的 loading 态
  const [loadingProviders, setLoadingProviders] = useState<Set<string>>(new Set());
  // 加载失败的 providerId 集合,用于显示重试按钮
  const [errorProviders, setErrorProviders] = useState<Set<string>>(new Set());
  // 当前展开的 Provider Collapse keys,初始全部折叠
  const [activeProviderKeys, setActiveProviderKeys] = useState<string[]>([]);

  /**
   * 按需加载指定 Provider 的子函数列表(带缓存)。
   * - 已缓存:直接返回,不再请求
   * - 加载中:跳过,避免重复触发
   * - 加载失败:错误信息进 errorProviders,UI 显示重试按钮
   */
  const loadProviderFunctions = async (providerId: string) => {
    if (functionsByProvider[providerId]) return;
    if (loadingProviders.has(providerId)) return;
    setLoadingProviders((prev) => {
      const next = new Set(prev);
      next.add(providerId);
      return next;
    });
    setErrorProviders((prev) => {
      const next = new Set(prev);
      next.delete(providerId);
      return next;
    });
    try {
      const list = await toolApi.listFunctions(providerId);
      setFunctionsByProvider((prev) => ({ ...prev, [providerId]: list }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      message.error(`加载工具函数失败: ${msg}`);
      setErrorProviders((prev) => {
        const next = new Set(prev);
        next.add(providerId);
        return next;
      });
    } finally {
      setLoadingProviders((prev) => {
        const next = new Set(prev);
        next.delete(providerId);
        return next;
      });
    }
  };

  /**
   * Collapse 展开/折叠回调:对新展开的 provider 触发按需加载。
   */
  const handleProviderCollapseChange = (keys: string | string[]) => {
    const nextKeys = Array.isArray(keys) ? keys : [keys];
    setActiveProviderKeys(nextKeys);
    nextKeys.forEach((pid) => {
      if (!functionsByProvider[pid] && !loadingProviders.has(pid)) {
        void loadProviderFunctions(pid);
      }
    });
  };

  // ===== Skill 版本缓存(已有逻辑) =====
  // 按 skillId 缓存版本列表(useSkillStore.versions 是单例,无法同时承载多个 skill)
  const [versionsBySkill, setVersionsBySkill] = useState<Record<string, SkillVersionDTO[]>>({});

  const loadSkillVersions = async (skillId: string): Promise<SkillVersionDTO[]> => {
    if (versionsBySkill[skillId]) return versionsBySkill[skillId];
    try {
      const versions = await skillApi.listVersions(skillId);
      setVersionsBySkill((prev) => ({ ...prev, [skillId]: versions }));
      return versions;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      message.error(`加载 Skill 版本列表失败: ${msg}`);
      return [];
    }
  };

  // 初始化加载数据
  useEffect(() => {
    if (configs.length === 0) {
      fetchConfigs().catch((err) => {
        const msg = err instanceof Error ? err.message : '未知错误';
        message.error(`加载模型配置失败: ${msg}`);
      });
    }
    // 工具包改为按需加载,初始化只拉 provider 列表,子函数在展开时再请求
    if (providers.length === 0) {
      fetchProviders().catch((err) => {
        const msg = err instanceof Error ? err.message : '未知错误';
        message.error(`加载工具供应商列表失败: ${msg}`);
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

  // ===== 工具包父子复选框联动 =====
  // 当前已勾选的 functionId 集合(用于 O(1) 判定)
  const selectedFunctionIdSet = useMemo(
    () => new Set(selectedTools.map((t) => t.functionId)),
    [selectedTools]
  );

  /**
   * 切换单个 Function 的勾选状态:在 selectedTools 上 add/remove。
   */
  const handleFunctionToggle = (fn: ToolFunctionDTO, checked: boolean) => {
    if (checked) {
      if (selectedFunctionIdSet.has(fn.functionId)) return;
      setSelectedTools([...selectedTools, fn]);
    } else {
      setSelectedTools(selectedTools.filter((t) => t.functionId !== fn.functionId));
    }
  };

  /**
   * 切换 Provider 父级勾选:全选时把该 Provider 下全部 function 合并入
   * selectedTools(去重);取消时移除该 Provider 名下所有 function。
   * 注:仅基于已加载的子函数列表执行,未加载的不会误触发请求。
   */
  const handleProviderToggle = (providerId: string, checked: boolean) => {
    const fns = functionsByProvider[providerId] || [];
    if (fns.length === 0) return;
    if (checked) {
      const existIds = new Set(selectedTools.map((t) => t.functionId));
      const merged = [...selectedTools];
      fns.forEach((fn) => {
        if (!existIds.has(fn.functionId)) merged.push(fn);
      });
      setSelectedTools(merged);
    } else {
      setSelectedTools(selectedTools.filter((t) => t.providerId !== providerId));
    }
  };

  /**
   * 推导 Provider 父级复选框的勾选与半选状态。
   * - 已加载的 functions 数为 0 时:checked=false / indeterminate=false
   * - 选中数 === 总数:checked=true
   * - 0 < 选中数 < 总数:indeterminate=true
   */
  const getProviderCheckState = (providerId: string) => {
    const fns = functionsByProvider[providerId] || [];
    if (fns.length === 0) return { checked: false, indeterminate: false, hasData: false };
    const selectedCount = fns.reduce(
      (acc, fn) => acc + (selectedFunctionIdSet.has(fn.functionId) ? 1 : 0),
      0
    );
    return {
      checked: selectedCount === fns.length,
      indeterminate: selectedCount > 0 && selectedCount < fns.length,
      hasData: true,
    };
  };

  const handleSkillToggle = async (skillId: string, checked: boolean) => {
    if (checked) {
      const skill = skills.find((s) => s.skillId === skillId);
      if (!skill) return;
      // 先按已有数据(latestVersion)落选,UI 立即响应;版本列表异步加载完毕再校准
      const fallbackVersion = skill.latestVersion?.version || '';
      setSelectedSkills([...selectedSkills, { skill, version: fallbackVersion }]);
      const versions = await loadSkillVersions(skillId);
      // 列表按最新在前(与 SkillDetailModal 行为一致),默认选首个真实版本
      const initialVersion = versions[0]?.version || fallbackVersion;
      if (initialVersion && initialVersion !== fallbackVersion) {
        const curr = useAgentStore.getState().selectedSkills;
        setSelectedSkills(
          curr.map((s) => (s.skill.skillId === skillId ? { ...s, version: initialVersion } : s))
        );
      }
    } else {
      setSelectedSkills(selectedSkills.filter((s) => s.skill.skillId !== skillId));
    }
  };

  const handleSkillVersionChange = (skillId: string, version: string) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.skill.skillId === skillId ? { ...s, version } : s))
    );
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

        {/* 工具包(双层折叠菜单) */}
        <div>
          <Text strong>工具包</Text>
          <div style={{ marginTop: 8, maxHeight: 240, overflow: 'auto' }}>
            {providers.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工具供应商" />
            ) : (
              <Collapse
                ghost
                size="small"
                activeKey={activeProviderKeys}
                onChange={handleProviderCollapseChange}
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                items={providers.map((provider) => {
                  const pid = provider.providerId;
                  const { checked, indeterminate, hasData } = getProviderCheckState(pid);
                  const isLoading = loadingProviders.has(pid);
                  const hasError = errorProviders.has(pid);
                  const fns = functionsByProvider[pid];
                  return {
                    key: pid,
                    // 父级 header:全选 Checkbox + Provider 名称;
                    // Checkbox 阻止冒泡,避免点击勾选触发 Collapse 展开/折叠
                    label: (
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={checked}
                          indeterminate={indeterminate}
                          disabled={!hasData}
                          onChange={(e) => handleProviderToggle(pid, e.target.checked)}
                        />
                        <span style={{ fontSize: 12 }}>{provider.providerName}</span>
                      </span>
                    ),
                    children: (
                      <div style={{ paddingLeft: 20 }}>
                        {isLoading ? (
                          <div style={{ textAlign: 'center', padding: '4px 0' }}>
                            <Spin size="small" />
                          </div>
                        ) : hasError ? (
                          <Space size={4}>
                            <Text type="danger" style={{ fontSize: 12 }}>
                              加载失败
                            </Text>
                            <Button
                              size="small"
                              type="link"
                              icon={<ReloadOutlined />}
                              onClick={() => void loadProviderFunctions(pid)}
                            >
                              重试
                            </Button>
                          </Space>
                        ) : !fns || fns.length === 0 ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            暂无函数
                          </Text>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {fns.map((fn) => (
                              <Checkbox
                                key={fn.functionId}
                                style={{ marginLeft: 0, marginBottom: 4 }}
                                checked={selectedFunctionIdSet.has(fn.functionId)}
                                onChange={(e) => handleFunctionToggle(fn, e.target.checked)}
                              >
                                <span style={{ fontSize: 12 }}>{fn.functionName}</span>
                              </Checkbox>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
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
                const currentSelected = selectedSkills.find(
                  (s) => s.skill.skillId === skill.skillId
                );
                // 优先用缓存的完整版本列表;未加载完时退化为 latestVersion 单项
                const cachedVersions = versionsBySkill[skill.skillId];
                const versionOptions =
                  cachedVersions && cachedVersions.length > 0
                    ? cachedVersions.map((v) => ({ label: v.version, value: v.version }))
                    : skill.latestVersion
                      ? [{ label: skill.latestVersion.version, value: skill.latestVersion.version }]
                      : [];
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
                        options={versionOptions}
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
