import request from '../request';
import type {
  ToolProviderDTO,
  ToolFunctionDTO,
  ToolProviderCreateRequest,
  ToolProviderUpdateRequest,
  ToolFunctionCreateRequest,
  ToolFunctionUpdateRequest,
} from '@/types/tool';

// Provider CRUD
export const listProviders = () => {
  return request.get<ToolProviderDTO[]>('/api/tool/provider');
};

export const getProvider = (id: string) => {
  return request.get<ToolProviderDTO>(`/api/tool/provider/${id}`);
};

export const createProvider = (data: ToolProviderCreateRequest) => {
  return request.post('/api/tool/provider', data);
};

export const updateProvider = (id: string, data: ToolProviderUpdateRequest) => {
  return request.put(`/api/tool/provider/${id}`, { ...data, id });
};

export const deleteProvider = (id: string) => {
  return request.delete(`/api/tool/provider/${id}`);
};

// Function CRUD
export const listFunctions = (providerId?: string) => {
  const url = providerId ? `/api/tool/function?provider_id=${providerId}` : '/api/tool/function';
  return request.get<ToolFunctionDTO[]>(url);
};

export const getFunction = (id: string) => {
  return request.get<ToolFunctionDTO>(`/api/tool/function/${id}`);
};

export const createFunction = (data: ToolFunctionCreateRequest) => {
  return request.post('/api/tool/function', data);
};

export const updateFunction = (id: string, data: ToolFunctionUpdateRequest) => {
  return request.put(`/api/tool/function/${id}`, { ...data, id });
};

export const deleteFunction = (id: string) => {
  return request.delete(`/api/tool/function/${id}`);
};
