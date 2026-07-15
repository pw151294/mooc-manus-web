import { create } from 'zustand';
import type {
  ToolProviderDTO,
  ToolFunctionDTO,
  ToolProviderCreateRequest,
  ToolProviderUpdateRequest,
  ToolFunctionCreateRequest,
  ToolFunctionUpdateRequest,
} from '@/types/tool';
import * as toolApi from '@/api/modules/tool';

interface ToolState {
  providers: ToolProviderDTO[];
  functions: ToolFunctionDTO[];
  selectedProviderId: string | null;
  loading: boolean;

  fetchProviders: () => Promise<void>;
  fetchFunctions: (providerId: string) => Promise<void>;
  fetchAllFunctions: () => Promise<void>;
  setSelectedProviderId: (id: string | null) => void;

  createProvider: (data: ToolProviderCreateRequest) => Promise<void>;
  updateProvider: (id: string, data: ToolProviderUpdateRequest) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;

  createFunction: (data: ToolFunctionCreateRequest) => Promise<void>;
  updateFunction: (id: string, data: ToolFunctionUpdateRequest) => Promise<void>;
  deleteFunction: (id: string) => Promise<void>;
}

export const useToolStore = create<ToolState>((set, get) => ({
  providers: [],
  functions: [],
  selectedProviderId: null,
  loading: false,

  fetchProviders: async () => {
    set({ loading: true });
    try {
      const providers = await toolApi.listProviders();
      set({ providers, loading: false });

      // 若供应商列表非空且当前未选中任何供应商，自动选中第一条
      if (providers.length > 0 && !get().selectedProviderId) {
        const firstProviderId = providers[0].providerId;
        set({ selectedProviderId: firstProviderId });
        await get().fetchFunctions(firstProviderId);
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchFunctions: async (providerId) => {
    // 后端契约：providerId 必填，禁止无参调用
    if (!providerId) {
      set({ functions: [] });
      return;
    }
    set({ loading: true });
    try {
      const functions = await toolApi.listFunctions(providerId);
      set({ functions, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // 跨 provider 聚合：先取 provider 列表，再并发拉取各自的 function 后扁平合并
  fetchAllFunctions: async () => {
    set({ loading: true });
    try {
      const providers = await toolApi.listProviders();
      set({ providers });
      if (providers.length === 0) {
        set({ functions: [], loading: false });
        return;
      }
      const results = await Promise.all(providers.map((p) => toolApi.listFunctions(p.providerId)));
      set({ functions: results.flat(), loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setSelectedProviderId: (id) => {
    set({ selectedProviderId: id });
    if (id) {
      get().fetchFunctions(id);
    } else {
      // 清空选中时不发起无参请求，直接清空函数列表
      set({ functions: [] });
    }
  },

  createProvider: async (data) => {
    await toolApi.createProvider(data);
    await get().fetchProviders();
  },

  updateProvider: async (id, data) => {
    await toolApi.updateProvider(id, data);
    await get().fetchProviders();
  },

  deleteProvider: async (id) => {
    await toolApi.deleteProvider(id);
    await get().fetchProviders();
  },

  createFunction: async (data) => {
    await toolApi.createFunction(data);
    const pid = get().selectedProviderId;
    if (pid) await get().fetchFunctions(pid);
  },

  updateFunction: async (id, data) => {
    await toolApi.updateFunction(id, data);
    const pid = get().selectedProviderId;
    if (pid) await get().fetchFunctions(pid);
  },

  deleteFunction: async (id) => {
    await toolApi.deleteFunction(id);
    const pid = get().selectedProviderId;
    if (pid) await get().fetchFunctions(pid);
  },
}));
