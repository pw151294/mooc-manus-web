import request from '../request';
import type {
  ToolProviderDTO, ToolFunctionDTO,
  ToolProviderCreateRequest, ToolProviderUpdateRequest,
  ToolFunctionCreateRequest, ToolFunctionUpdateRequest,
} from '@/types/tool';

export const listProviders = () =>
  request.get<ToolProviderDTO[]>('/api/tools/provider/list');

export const createProvider = (data: ToolProviderCreateRequest) =>
  request.post('/api/tools/provider', data);

export const updateProvider = (id: string, data: ToolProviderUpdateRequest) =>
  request.put(`/api/tools/provider/${id}`, { ...data, providerId: id });

export const deleteProvider = (id: string) =>
  request.delete(`/api/tools/provider/${id}`);

export const listFunctions = (providerId?: string) => {
  const url = providerId ? `/api/tools/function/list?providerId=${providerId}` : '/api/tools/function/list';
  return request.get<ToolFunctionDTO[]>(url);
};

export const createFunction = (data: ToolFunctionCreateRequest) =>
  request.post('/api/tools/function', data);

export const updateFunction = (id: string, data: ToolFunctionUpdateRequest) =>
  request.put(`/api/tools/function/${id}`, { ...data, functionId: id });

export const deleteFunction = (id: string) =>
  request.delete(`/api/tools/function/${id}`);
