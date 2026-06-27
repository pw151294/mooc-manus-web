/**
 * AppConfig 模块 API 接口
 */
import request from '../request';
import type {
  AppConfigDTO,
  AppConfigCreateRequest,
  AppConfigUpdateRequest,
} from '@/types/appConfig';

// 创建
export const createAppConfig = (data: AppConfigCreateRequest) => {
  return request.post<{ id: string }>('/api/app/config', data);
};

// 更新
export const updateAppConfig = (id: string, data: AppConfigUpdateRequest) => {
  return request.put(`/api/app/config/${id}`, { ...data, appConfigId: id });
};

// 获取单个
export const getAppConfig = (id: string) => {
  return request.get<AppConfigDTO>(`/api/app/config/${id}`);
};

// 获取列表
export const listAppConfigs = () => {
  return request.get<AppConfigDTO[]>('/api/app/config');
};

// 删除
export const deleteAppConfig = (id: string) => {
  return request.delete(`/api/app/config/${id}`);
};
