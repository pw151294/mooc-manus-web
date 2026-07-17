/**
 * Eval Cases management page
 */

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Card, Input, Select, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCaseStore } from '@/store/evalCase';
import CaseTable from './CaseTable';
import CaseFormModal from './CaseFormModal';
import CaseDetailDrawer from './CaseDetailDrawer';

const EvalCasesPage: FC = () => {
  const { cases, fetchCases, deleteCase, applyFiltersAndFetch } = useCaseStore();
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);

  // Extract all unique tags from cases
  const allTags = Array.from(new Set(cases.flatMap((c) => c.tags))).sort();

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleSearch = (value: string) => {
    applyFiltersAndFetch({ nameLike: value, tags: selectedTags });
  };

  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    applyFiltersAndFetch({ nameLike: searchText, tags });
  };

  const handleCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (caseId: string) => {
    setEditingId(caseId);
    setDetailCaseId(null); // Close drawer if open
    setModalOpen(true);
  };

  const handleView = (caseId: string) => {
    setDetailCaseId(caseId);
  };

  const handleDelete = async (caseId: string) => {
    try {
      await deleteCase(caseId);
    } catch (error) {
      // API error already handled by store or interceptor
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleDrawerClose = () => {
    setDetailCaseId(null);
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Input.Search
              placeholder="搜索用例名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 300 }}
              allowClear
            />
            <Select
              mode="multiple"
              placeholder="按标签过滤"
              value={selectedTags}
              onChange={handleTagChange}
              style={{ minWidth: 200 }}
              options={allTags.map((tag) => ({ label: tag, value: tag }))}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建用例
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <CaseTable onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      </Card>

      <CaseFormModal open={modalOpen} editingId={editingId} onClose={handleModalClose} />

      <CaseDetailDrawer caseId={detailCaseId} onClose={handleDrawerClose} onEdit={handleEdit} />
    </>
  );
};

export default EvalCasesPage;
