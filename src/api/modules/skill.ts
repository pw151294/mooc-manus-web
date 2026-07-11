import request from '../request';
import type { SkillProviderDTO, SkillDTO, SkillVersionDTO, SkillImportTaskDTO, SkillImportRequest, SkillUpdateRequest } from '@/types/skill';

export const listProviders = () =>
  request.post<SkillProviderDTO[]>('/api/skill/provider/list', {});

export const deleteProvider = (id: string) =>
  request.post('/api/skill/provider/delete', { providerId: id });

export const listSkills = (providerId?: string) =>
  request.post<SkillDTO[]>('/api/skill/listAll', providerId ? { providerId } : {});

export const deleteSkill = (id: string) =>
  request.post('/api/skill/delete', { skillId: id });

export const updateSkill = (data: SkillUpdateRequest) =>
  request.post('/api/skill/update', data);

export const listVersions = (skillId: string) =>
  request.post<SkillVersionDTO[]>('/api/skill/version/list', { skillId });

export const rollbackVersion = (skillId: string, targetVersion: string) =>
  request.post('/api/skill/version/rollback', { skillId, targetVersion });

export const exportVersion = (skillId: string, version: string) =>
  request.post('/api/skill/version/export', { skillId, version }, { responseType: 'blob' });

export const downloadFile = (fileKey: string) =>
  request.get('/api/skill/file/download', { params: { fileKey }, responseType: 'blob' });

export const listImportTasks = () =>
  request.post<SkillImportTaskDTO[]>('/api/skill/provider/import/task/list', {});

export const createImportTask = (data: SkillImportRequest) =>
  request.post<SkillImportTaskDTO>('/api/skill/provider/import/git', data);

export const draftSaveSkill = (formData: FormData) =>
  request.post<SkillDTO>('/api/skill/draft/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const publishSkill = (formData: FormData) =>
  request.post<SkillDTO>('/api/skill/publish', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteImportTask = (taskIds: string[]) =>
  request.post('/api/skill/provider/import/task/delete', { taskIds });

export const buildImportProgressUrl = (taskId: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}/api/skill/provider/import/task/detail/${taskId}`;
};
