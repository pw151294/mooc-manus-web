import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Modal, Form, Input, Upload, Alert, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import { useSkillStore } from '@/store/skill';

interface SkillCreateModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  skillName?: string;
  description?: string;
  versionDescription?: string;
}

const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const SKILL_NAME_MAX = 120;
const SKILL_DESC_MAX = 3000;

const hasSkillMdFile = (files: UploadFile[]): boolean =>
  files.some((f) => {
    const name = f.name.toLowerCase();
    return name === 'skill.md' || name.endsWith('/skill.md');
  });

const totalBytes = (files: UploadFile[]): number =>
  files.reduce((acc, f) => acc + (f.size || 0), 0);

const SkillCreateModal: FC<SkillCreateModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const { createSkill } = useSkillStore();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setFileList([]);
    }
  }, [open, form]);

  const hasSkillMd = useMemo(() => hasSkillMdFile(fileList), [fileList]);
  const size = useMemo(() => totalBytes(fileList), [fileList]);
  const oversize = size > MAX_TOTAL_BYTES;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.warning('请至少上传一个文件');
        return;
      }
      if (!hasSkillMd) {
        message.warning('文件列表必须包含 SKILL.md');
        return;
      }
      if (oversize) {
        message.warning('文件总体积超过 100MB');
        return;
      }
      const files: File[] = fileList
        .map((f) => f.originFileObj as RcFile | undefined)
        .filter((f): f is RcFile => Boolean(f));
      if (files.length !== fileList.length) {
        message.error('存在无效文件对象');
        return;
      }
      setSubmitting(true);
      await createSkill({
        skillName: values.skillName,
        description: values.description,
        versionDescription: values.versionDescription,
        files,
      });
      message.success('创建成功');
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) {
        return;
      }
      // request 拦截器已经打过 message，此处不重复提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      title="创建 Skill"
      okText="创建并发布"
      cancelText="取消"
      confirmLoading={submitting}
      width={640}
      destroyOnHidden
    >
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message="上传的文件必须包含 SKILL.md（大小写不敏感）。留空的名称与描述将由后端从 SKILL.md frontmatter 自动解析。新 Skill 会自动挂载到 CUSTOM Provider 下，首次发布版本为 v0.1.0。"
      />

      <Form form={form} layout="vertical">
        <Form.Item
          label="Skill 名称"
          name="skillName"
          rules={[{ max: SKILL_NAME_MAX, message: `不超过 ${SKILL_NAME_MAX} 个字符` }]}
        >
          <Input placeholder="留空则从 SKILL.md frontmatter 解析" maxLength={SKILL_NAME_MAX} />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[{ max: SKILL_DESC_MAX, message: `不超过 ${SKILL_DESC_MAX} 个字符` }]}
        >
          <Input.TextArea
            placeholder="留空则从 SKILL.md frontmatter 解析"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={SKILL_DESC_MAX}
            showCount
          />
        </Form.Item>

        <Form.Item label="版本描述（可选）" name="versionDescription">
          <Input placeholder="用于记录本次发布的变更说明" />
        </Form.Item>

        <Form.Item label="Skill 文件" required>
          <Upload.Dragger
            multiple
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList((prev) => [
                ...prev,
                {
                  uid: `${file.name}-${file.lastModified}-${file.size}`,
                  name: file.name,
                  size: file.size,
                  originFileObj: file,
                  status: 'done',
                } as UploadFile,
              ]);
              return false;
            }}
            onRemove={(file) => {
              setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处</p>
            <p className="ant-upload-hint">
              支持多选。SKILL.md 必填，其他文件（脚本、参考文档等）按需附加，总体积上限 100MB。
            </p>
          </Upload.Dragger>
          <Typography.Text
            type={hasSkillMd ? 'success' : 'warning'}
            style={{ display: 'block', marginTop: 8 }}
          >
            SKILL.md: {hasSkillMd ? '已包含' : '未包含'} · 共 {fileList.length} 个文件 ·{' '}
            {(size / 1024).toFixed(1)} KB
            {oversize && '（超过 100MB）'}
          </Typography.Text>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SkillCreateModal;
