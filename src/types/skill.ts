// Skill Provider DTO
export interface SkillProviderDTO {
  id: string;
  name: string;
  type: 'official' | 'custom';
  description: string;
  status: 'active' | 'inactive';
  skill_count: number;
  created_at: string;
  updated_at: string;
}

// Skill DTO
export interface SkillDTO {
  id: string;
  provider_id: string;
  provider_name: string;
  name: string;
  description: string;
  icon?: string;
  status: 'online' | 'offline' | 'draft';
  current_version: string;
  version_count: number;
  created_at: string;
  updated_at: string;
}

// Skill File DTO
export interface SkillFileDTO {
  id: string;
  version_id: string;
  filename: string;
  size: number;
  download_url: string;
}

// Skill Version DTO
export interface SkillVersionDTO {
  id: string;
  skill_id: string;
  version: string;
  description: string;
  is_current: boolean;
  files: SkillFileDTO[];
  created_at: string;
}

// 导入任务 DTO
export interface SkillImportTaskDTO {
  id: string;
  source_type: 'git' | 'zip' | 'url';
  source_url: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number; // 0-100
  message: string;
  created_at: string;
  updated_at: string;
}

// SSE 导入进度事件
export interface ImportProgressEvent {
  task_id: string;
  status: string;
  progress: number;
  message: string;
  timestamp: string;
}

// Provider 请求
export interface SkillProviderCreateRequest {
  name: string;
  type: 'official' | 'custom';
  description: string;
  status?: 'active' | 'inactive';
}

export interface SkillProviderUpdateRequest extends SkillProviderCreateRequest {
  id: string;
}

// Skill 请求
export interface SkillCreateRequest {
  provider_id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface SkillUpdateRequest extends SkillCreateRequest {
  id: string;
  status?: 'online' | 'offline' | 'draft';
}

export interface SkillImportRequest {
  source_type: 'git' | 'zip' | 'url';
  source_url: string;
  provider_id?: string;
}
