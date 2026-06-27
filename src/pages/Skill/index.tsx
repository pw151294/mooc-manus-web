import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Tabs, Layout, Input, Row, Col, Empty, Spin, message } from 'antd';
import { useSkillStore } from '@/store/skill';
import ProviderTree from './ProviderTree';
import SkillCard from './SkillCard';
import SkillDetailModal from './SkillDetailModal';
import ImportProviderModal from './ImportProviderModal';
import ImportTasks from './ImportTasks';
import type { SkillDTO } from '@/types/skill';

const { Sider, Content } = Layout;
const { Search } = Input;

const SkillPage: FC = () => {
  const {
    skills,
    loading,
    selectedProviderId,
    fetchSkills,
    deleteSkill,
    onlineSkill,
    offlineSkill,
    setSelectedSkillId,
  } = useSkillStore();

  const [activeTab, setActiveTab] = useState('manage');
  const [searchText, setSearchText] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<SkillDTO | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleView = (skill: SkillDTO) => {
    setCurrentSkill(skill);
    setSelectedSkillId(skill.skillId);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedSkillId(null);
  };

  const handleToggleStatus = async (skill: SkillDTO) => {
    try {
      if (skill.status === 'online') {
        await offlineSkill(skill.skillId);
        message.success('已下线');
      } else {
        await onlineSkill(skill.skillId);
        message.success('已上线');
      }
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSkill(id);
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const handleImportClick = () => {
    setImportOpen(true);
  };

  const handleImportCreated = () => {
    setActiveTab('import');
  };

  const filteredSkills = skills.filter(
    (s) =>
      s.skillName.toLowerCase().includes(searchText.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const manageContent = (
    <Layout style={{ height: 'calc(100vh - 200px)', background: '#fff' }}>
      <Sider
        width={250}
        style={{
          background: '#fafafa',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <ProviderTree onImportClick={handleImportClick} />
      </Sider>
      <Content style={{ padding: '16px', overflow: 'auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="搜索 Skill 名称或描述"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          {selectedProviderId && (
            <span style={{ marginLeft: 16, color: '#666', fontSize: 12 }}>
              已筛选 Provider,共 {filteredSkills.length} 条
            </span>
          )}
        </div>

        <Spin spinning={loading}>
          {filteredSkills.length === 0 && !loading ? (
            <Empty description="暂无 Skill" />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredSkills.map((skill) => (
                <Col key={skill.skillId} xs={24} sm={12} lg={8} xl={6}>
                  <SkillCard
                    skill={skill}
                    onView={handleView}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Content>
    </Layout>
  );

  const tabItems = [
    {
      key: 'manage',
      label: 'Skill 管理',
      children: manageContent,
    },
    {
      key: 'import',
      label: '导入任务',
      children: <ImportTasks />,
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <SkillDetailModal skill={currentSkill} open={detailOpen} onClose={handleCloseDetail} />

      <ImportProviderModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportCreated={handleImportCreated}
      />
    </div>
  );
};

export default SkillPage;
