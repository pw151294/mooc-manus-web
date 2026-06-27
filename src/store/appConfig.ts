/**
 * AppConfig 状态管理
 */
import { create } from 'zustand';
import type {
  AppConfigDTO,
  AppConfigCreateRequest,
  AppConfigUpdateRequest,
} from '@/types/appConfig';
import * as appConfigApi from '@/api/modules/appConfig';

interface AppConfigState {
  configs: AppConfigDTO[];
  loading: boolean;

  fetchConfigs: () => Promise<void>;
  createConfig: (data: AppConfigCreateRequest) => Promise<void>;
  updateConfig: (id: string, data: AppConfigUpdateRequest) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  configs: [],
  loading: false,

  fetchConfigs: async () => {
    set({ loading: true });
    try {
      const configs = await appConfigApi.listAppConfigs();
      set({ configs, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createConfig: async (data) => {
    await appConfigApi.createAppConfig(data);
    await get().fetchConfigs();
  },

  updateConfig: async (id, data) => {
    await appConfigApi.updateAppConfig(id, { ...data, appConfigId: id });
    await get().fetchConfigs();
  },

  deleteConfig: async (id) => {
    await appConfigApi.deleteAppConfig(id);
    await get().fetchConfigs();
  },
}));
