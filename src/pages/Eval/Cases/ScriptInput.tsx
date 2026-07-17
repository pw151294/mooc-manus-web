/**
 * ScriptInput component - dual-tab upload/edit widget
 * Used for init_script, task_prompt, verify_script in CaseFormModal
 */

import type { FC } from 'react';
import { useState } from 'react';
import { Tabs, Upload, Input, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import { uploadContent } from '@/api/modules/eval';

interface ScriptInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ScriptInput: FC<ScriptInputProps> = ({ value = '', onChange, placeholder }) => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: RcFile) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error('文件大小不得超过 10MB');
      return false;
    }

    setUploading(true);
    try {
      const result = await uploadContent(file);
      onChange?.(result.content);
      message.success('文件上传成功');
      // Switch to edit tab after successful upload
      setActiveTab('edit');
    } catch (error) {
      // API interceptor already shows error message
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        {
          key: 'upload',
          label: '上传文件',
          children: (
            <Upload.Dragger
              accept="*"
              beforeUpload={handleUpload}
              showUploadList={false}
              disabled={uploading}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">文件大小不超过 10MB</p>
            </Upload.Dragger>
          ),
        },
        {
          key: 'edit',
          label: '直接编辑',
          children: (
            <Input.TextArea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              autoSize={{ minRows: 6, maxRows: 20 }}
            />
          ),
        },
      ]}
    />
  );
};

export default ScriptInput;
