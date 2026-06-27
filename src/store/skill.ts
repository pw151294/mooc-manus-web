import { create } from 'zustand';
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
  ImportProgressEvent,
} from '@/types/skill';
import * as skillApi from '@/api/modules/skill';
import SSEClient from '@/api/sse';

interface SkillState {
  // 数据
  providers: SkillProviderDTO[];
  skills: SkillDTO[];
  versions: SkillVersionDTO[];
  importTasks: SkillImportTaskDTO[];

  // 选中状态
  selectedProviderId: string | null;
  selectedSkillId: string | null;

  // 加载状态
  loading: boolean;
  versionLoading: boolean;
  taskLoading: boolean;

  // SSE 客户端集合(每个任务一个连接)
  sseClients: Map<string, SSEClient>;

  // Provider actions
  fetchProviders: () => Promise<void>;
  createProvider: (data: SkillProviderCreateRequest) => Promise<void>;
  updateProvider: (id: string, data: SkillProviderUpdateRequest) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setSelectedProviderId: (id: string | null) => void;

  // Skill actions
  fetchSkills: (providerId?: string) => Promise<void>;
  createSkill: (data: SkillCreateRequest) => Promise<void>;
  updateSkill: (id: string, data: SkillUpdateRequest) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  onlineSkill: (id: string) => Promise<void>;
  offlineSkill: (id: string) => Promise<void>;
  setSelectedSkillId: (id: string | null) => void;

  // Version actions
  fetchVersions: (skillId: string) => Promise<void>;
  rollbackVersion: (id: string) => Promise<void>;

  // Import Task actions
  fetchImportTasks: () => Promise<void>;
  createImportTask: (data: SkillImportRequest) => Promise<SkillImportTaskDTO>;
  cancelImportTask: (id: string) => Promise<void>;
  deleteImportTask: (id: string) => Promise<void>;
  updateTaskProgress: (taskId: string, event: ImportProgressEvent) => void;

  // SSE actions
  subscribeImportTask: (taskId: string) => void;
  unsubscribeImportTask: (taskId: string) => void;
  unsubscribeAllImportTasks: () => void;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  providers: [],
  skills: [],
  versions: [],
  importTasks: [],

  selectedProviderId: null,
  selectedSkillId: null,

  loading: false,
  versionLoading: false,
  taskLoading: false,

  sseClients: new Map<string, SSEClient>(),

  // Provider
  fetchProviders: async () => {
    set({ loading: true });
    try {
      const providers = await skillApi.listProviders();
      set({ providers, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createProvider: async (data) => {
    await skillApi.createProvider(data);
    await get().fetchProviders();
  },

  updateProvider: async (id, data) => {
    await skillApi.updateProvider(id, { ...data, id });
    await get().fetchProviders();
  },

  deleteProvider: async (id) => {
    await skillApi.deleteProvider(id);
    await get().fetchProviders();
  },

  setSelectedProviderId: (id) => {
    set({ selectedProviderId: id });
    get().fetchSkills(id || undefined);
  },

  // Skill
  fetchSkills: async (providerId) => {
    set({ loading: true });
    try {
      const skills = await skillApi.listSkills(providerId);
      set({ skills, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createSkill: async (data) => {
    await skillApi.createSkill(data);
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  updateSkill: async (id, data) => {
    await skillApi.updateSkill(id, { ...data, id });
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  deleteSkill: async (id) => {
    await skillApi.deleteSkill(id);
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  onlineSkill: async (id) => {
    await skillApi.onlineSkill(id);
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  offlineSkill: async (id) => {
    await skillApi.offlineSkill(id);
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  setSelectedSkillId: (id) => {
    set({ selectedSkillId: id });
  },

  // Version
  fetchVersions: async (skillId) => {
    set({ versionLoading: true });
    try {
      const versions = await skillApi.listVersions(skillId);
      set({ versions, versionLoading: false });
    } catch (error) {
      set({ versionLoading: false });
      throw error;
    }
  },

  rollbackVersion: async (id) => {
    await skillApi.rollbackVersion(id);
    const skillId = get().selectedSkillId;
    if (skillId) {
      await get().fetchVersions(skillId);
    }
  },

  // Import Task
  fetchImportTasks: async () => {
    set({ taskLoading: true });
    try {
      const importTasks = await skillApi.listImportTasks();
      set({ importTasks, taskLoading: false });
    } catch (error) {
      set({ taskLoading: false });
      throw error;
    }
  },

  createImportTask: async (data) => {
    const task = await skillApi.createImportTask(data);
    await get().fetchImportTasks();
    return task;
  },

  cancelImportTask: async (id) => {
    await skillApi.cancelImportTask(id);
    get().unsubscribeImportTask(id);
    await get().fetchImportTasks();
  },

  deleteImportTask: async (id) => {
    await skillApi.deleteImportTask(id);
    get().unsubscribeImportTask(id);
    await get().fetchImportTasks();
  },

  updateTaskProgress: (taskId, event) => {
    set((state) => ({
      importTasks: state.importTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: (event.status as SkillImportTaskDTO['status']) || task.status,
              progress: event.progress ?? task.progress,
              message: event.message ?? task.message,
              updated_at: event.timestamp || task.updated_at,
            }
          : task
      ),
    }));
  },

  // SSE
  subscribeImportTask: (taskId) => {
    const { sseClients } = get();
    if (sseClients.has(taskId)) {
      return;
    }
    const client = new SSEClient();
    const url = skillApi.buildImportProgressUrl(taskId);
    try {
      client.subscribe(url, {
        onEvent: (_type, data) => {
          const event = data as unknown as ImportProgressEvent;
          get().updateTaskProgress(taskId, event);
          if (event.status === 'success' || event.status === 'failed') {
            get().unsubscribeImportTask(taskId);
          }
        },
        onError: () => {
          get().unsubscribeImportTask(taskId);
        },
        onComplete: () => {
          get().unsubscribeImportTask(taskId);
        },
      });
      sseClients.set(taskId, client);
      set({ sseClients: new Map(sseClients) });
    } catch (error) {
      console.error('订阅 SSE 失败:', error);
    }
  },

  unsubscribeImportTask: (taskId) => {
    const { sseClients } = get();
    const client = sseClients.get(taskId);
    if (client) {
      client.close();
      sseClients.delete(taskId);
      set({ sseClients: new Map(sseClients) });
    }
  },

  unsubscribeAllImportTasks: () => {
    const { sseClients } = get();
    sseClients.forEach((client) => client.close());
    sseClients.clear();
    set({ sseClients: new Map() });
  },
}));
