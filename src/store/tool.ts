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
  fetchFunctions: (providerId?: string) => Promise<void>;
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
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchFunctions: async (providerId) => {
    set({ loading: true });
    try {
      const functions = await toolApi.listFunctions(providerId);
      set({ functions, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setSelectedProviderId: (id) => {
    set({ selectedProviderId: id });
    get().fetchFunctions(id || undefined);
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
    await get().fetchFunctions(get().selectedProviderId || undefined);
  },

  updateFunction: async (id, data) => {
    await toolApi.updateFunction(id, data);
    await get().fetchFunctions(get().selectedProviderId || undefined);
  },

  deleteFunction: async (id) => {
    await toolApi.deleteFunction(id);
    await get().fetchFunctions(get().selectedProviderId || undefined);
  },
}));
