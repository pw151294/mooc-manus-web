import { create } from 'zustand';
import type {
  SkillProviderDTO,
  SkillDTO,
  SkillVersionDTO,
  SkillImportTaskDTO,
  SkillImportRequest,
  ImportProgressEvent,
} from '@/types/skill';
import * as skillApi from '@/api/modules/skill';
import SSEClient from '@/api/sse';

interface SkillState {
  providers: SkillProviderDTO[];
  skills: SkillDTO[];
  versions: SkillVersionDTO[];
  importTasks: SkillImportTaskDTO[];

  selectedProviderId: string | null;
  selectedSkillId: string | null;

  loading: boolean;
  versionLoading: boolean;
  taskLoading: boolean;

  sseClients: Map<string, SSEClient>;

  fetchProviders: () => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setSelectedProviderId: (id: string | null) => void;

  fetchSkills: (providerId?: string) => Promise<void>;
  updateSkill: (skillId: string, data: { skillName?: string; description?: string; status?: string }) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  onlineSkill: (id: string) => Promise<void>;
  offlineSkill: (id: string) => Promise<void>;
  setSelectedSkillId: (id: string | null) => void;

  fetchVersions: (skillId: string) => Promise<void>;
  rollbackVersion: (skillId: string, targetVersion: string) => Promise<void>;

  fetchImportTasks: () => Promise<void>;
  createImportTask: (data: SkillImportRequest) => Promise<SkillImportTaskDTO>;
  cancelImportTask: (id: string) => Promise<void>;
  deleteImportTask: (id: string) => Promise<void>;
  updateTaskProgress: (taskId: string, event: ImportProgressEvent) => void;

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

  deleteProvider: async (id) => {
    await skillApi.deleteProvider(id);
    await get().fetchProviders();
  },

  setSelectedProviderId: (id) => {
    set({ selectedProviderId: id });
    get().fetchSkills(id || undefined);
  },

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

  updateSkill: async (skillId, data) => {
    await skillApi.updateSkill({ skillId, ...data });
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  deleteSkill: async (id) => {
    await skillApi.deleteSkill(id);
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  onlineSkill: async (id) => {
    await skillApi.updateSkill({ skillId: id, status: 'online' });
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  offlineSkill: async (id) => {
    await skillApi.updateSkill({ skillId: id, status: 'offline' });
    await get().fetchSkills(get().selectedProviderId || undefined);
  },

  setSelectedSkillId: (id) => {
    set({ selectedSkillId: id });
  },

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

  rollbackVersion: async (skillId, targetVersion) => {
    await skillApi.rollbackVersion(skillId, targetVersion);
    await get().fetchVersions(skillId);
  },

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
    await skillApi.deleteImportTask([id]);
    get().unsubscribeImportTask(id);
    await get().fetchImportTasks();
  },

  deleteImportTask: async (id) => {
    await skillApi.deleteImportTask([id]);
    get().unsubscribeImportTask(id);
    await get().fetchImportTasks();
  },

  updateTaskProgress: (taskId, event) => {
    set((state) => ({
      importTasks: state.importTasks.map((task) =>
        task.taskId === taskId
          ? {
              ...task,
              status: (event.status as SkillImportTaskDTO['status']) || task.status,
              progress: event.progress ?? task.progress,
              stage: event.stage || event.errorMessage || task.stage,
            }
          : task
      ),
    }));
  },

  subscribeImportTask: (taskId) => {
    const { sseClients } = get();
    if (sseClients.has(taskId)) return;
    const client = new SSEClient();
    const url = skillApi.buildImportProgressUrl(taskId);
    try {
      client.subscribe({ url, method: 'GET' }, {
        onEvent: (_type, data) => {
          const event = data as unknown as ImportProgressEvent;
          get().updateTaskProgress(taskId, event);
          if (event.status === 'success' || event.status === 'failed') {
            get().unsubscribeImportTask(taskId);
          }
        },
        onError: () => { get().unsubscribeImportTask(taskId); },
        onComplete: () => { get().unsubscribeImportTask(taskId); },
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
