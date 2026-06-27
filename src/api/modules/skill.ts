import request from '../request';
import type {
  SkillProviderDTO,
  SkillDTO,
  SkillVersionDTO,
  SkillImportTaskDTO,
  SkillProviderCreateRequest,
  SkillProviderUpdateRequest,
  SkillCreateRequest,
  SkillUpdateRequest,
  SkillImportRequest,
} from '@/types/skill';

// ============ Provider CRUD ============
export const listProviders = () => {
  return request.get<SkillProviderDTO[]>('/api/skill/provider');
};

export const getProvider = (id: string) => {
  return request.get<SkillProviderDTO>(`/api/skill/provider/${id}`);
};

export const createProvider = (data: SkillProviderCreateRequest) => {
  return request.post('/api/skill/provider', data);
};

export const updateProvider = (id: string, data: SkillProviderUpdateRequest) => {
  return request.put(`/api/skill/provider/${id}`, { ...data, id });
};

export const deleteProvider = (id: string) => {
  return request.delete(`/api/skill/provider/${id}`);
};

// ============ Skill CRUD ============
export const listSkills = (providerId?: string) => {
  const url = providerId ? `/api/skill?provider_id=${providerId}` : '/api/skill';
  return request.get<SkillDTO[]>(url);
};

export const getSkill = (id: string) => {
  return request.get<SkillDTO>(`/api/skill/${id}`);
};

export const createSkill = (data: SkillCreateRequest) => {
  return request.post('/api/skill', data);
};

export const updateSkill = (id: string, data: SkillUpdateRequest) => {
  return request.put(`/api/skill/${id}`, { ...data, id });
};

export const deleteSkill = (id: string) => {
  return request.delete(`/api/skill/${id}`);
};

export const onlineSkill = (id: string) => {
  return request.post(`/api/skill/${id}/online`);
};

export const offlineSkill = (id: string) => {
  return request.post(`/api/skill/${id}/offline`);
};

// ============ Version CRUD ============
export const listVersions = (skillId: string) => {
  return request.get<SkillVersionDTO[]>(`/api/skill/version?skill_id=${skillId}`);
};

export const getVersion = (id: string) => {
  return request.get<SkillVersionDTO>(`/api/skill/version/${id}`);
};

export const rollbackVersion = (id: string) => {
  return request.post(`/api/skill/version/${id}/rollback`);
};

export const exportVersion = (id: string) => {
  return request.get(`/api/skill/version/${id}/export`, {
    responseType: 'blob',
  });
};

// ============ File ============
export const downloadFile = (id: string) => {
  return request.get(`/api/skill/file/${id}/download`, {
    responseType: 'blob',
  });
};

// ============ Import Task ============
export const listImportTasks = () => {
  return request.get<SkillImportTaskDTO[]>('/api/skill/import');
};

export const getImportTask = (id: string) => {
  return request.get<SkillImportTaskDTO>(`/api/skill/import/${id}`);
};

export const createImportTask = (data: SkillImportRequest) => {
  return request.post<SkillImportTaskDTO>('/api/skill/import', data);
};

export const cancelImportTask = (id: string) => {
  return request.post(`/api/skill/import/${id}/cancel`);
};

export const deleteImportTask = (id: string) => {
  return request.delete(`/api/skill/import/${id}`);
};

// SSE 进度订阅 URL 拼接
export const buildImportProgressUrl = (taskId: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}/api/skill/import/${taskId}/progress`;
};
