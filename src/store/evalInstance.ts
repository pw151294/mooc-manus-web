/**
 * Zustand store for eval instance management
 * Manages instance list for a specific task, pagination, filters, and 3s intelligent polling
 */

import { create } from 'zustand';
import { message } from 'antd';
import { listInstances, retryInstance, deleteInstance } from '@/api/modules/eval';
import type { InstanceView, ListInstancesQuery } from '@/types/eval';

/**
 * Filter state for instance list
 */
export interface InstanceListFilters {
  status: string; // '' | 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT'
}

/**
 * Default filter values
 */
const defaultFilters: InstanceListFilters = {
  status: '',
};

/**
 * Module-level AbortController for race condition handling
 */
let inflight: AbortController | null = null;

/**
 * Instance state
 */
interface InstanceState {
  // Data
  taskId: string | null; // Current task being viewed
  instances: InstanceView[];
  total: number;
  page: number; // 1-based
  pageSize: number;
  filters: InstanceListFilters;
  loading: boolean;
  pollingTimer: ReturnType<typeof setInterval> | null;

  // Actions
  fetchInstances: (taskId: string) => Promise<void>;
  retryInstance: (id: string) => Promise<void>;
  deleteInstance: (id: string) => Promise<void>;
  startPolling: (taskId: string) => void;
  stopPolling: () => void;
  reset: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (patch: Partial<InstanceListFilters>) => void;
  resetFilters: () => void;
  applyFiltersAndFetch: (patch: Partial<InstanceListFilters>) => void;
}

/**
 * Create instance store
 */
export const useInstanceStore = create<InstanceState>((set, get) => ({
  // Initial state
  taskId: null,
  instances: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: defaultFilters,
  loading: false,
  pollingTimer: null,

  // Fetch instances for a task
  fetchInstances: async (taskId: string) => {
    // Abort previous inflight request
    if (inflight) {
      inflight.abort();
      inflight = null;
    }

    const { page, pageSize, filters } = get();

    // Validate page (min 1)
    const validPage = Math.max(1, page);

    // Validate pageSize (1-100, default 20)
    let validPageSize = pageSize;
    if (validPageSize < 1 || validPageSize > 100) {
      validPageSize = 20;
    }

    // Create new AbortController
    inflight = new AbortController();

    // Set loading state
    set({ loading: true, taskId });

    try {
      const queryParams: ListInstancesQuery = {
        page: validPage,
        size: validPageSize,
      };

      if (filters.status) {
        queryParams.status = filters.status;
      }

      const response = await listInstances(taskId, queryParams);

      // Update state with response
      set({
        instances: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.size,
        loading: false,
      });

      inflight = null;
    } catch (err: unknown) {
      // Clear inflight
      inflight = null;

      // Set loading to false
      set({ loading: false });

      // Re-throw for caller handling
      throw err;
    }
  },

  // Retry instance
  retryInstance: async (id: string) => {
    await retryInstance(id);
    message.success('实例重试成功');
    // Refresh list and start polling
    const { taskId } = get();
    if (taskId) {
      await get().fetchInstances(taskId);
      get().startPolling(taskId);
    }
  },

  // Delete instance
  deleteInstance: async (id: string) => {
    await deleteInstance(id);
    message.success('实例删除成功');
    // Refresh list
    const { taskId } = get();
    if (taskId) {
      await get().fetchInstances(taskId);
    }
  },

  // Start intelligent polling (3s interval)
  startPolling: (taskId: string) => {
    const state = get();

    // Stop existing timer
    if (state.pollingTimer) {
      clearInterval(state.pollingTimer);
    }

    // Create new timer
    const timer = setInterval(() => {
      const { instances, loading, taskId: currentTaskId } = get();

      // Ensure we're still viewing the same task
      if (currentTaskId !== taskId) {
        get().stopPolling();
        return;
      }

      // Check if any instance is active
      const hasActive = instances.some((inst) =>
        ['PENDING', 'RUNNING'].includes(inst.status)
      );

      if (hasActive && !loading) {
        // Silent refresh (don't set loading to avoid table flashing)
        listInstances(taskId, {
          page: get().page,
          size: get().pageSize,
          status: get().filters.status || undefined,
        })
          .then((response) => {
            set({
              instances: response.items,
              total: response.total,
              page: response.page,
              pageSize: response.size,
            });
          })
          .catch(() => {
            // Silently fail on polling errors
          });
      } else if (!hasActive) {
        // All terminal states, stop polling
        get().stopPolling();
      }
    }, 3000);

    set({ pollingTimer: timer });
  },

  // Stop polling
  stopPolling: () => {
    const { pollingTimer } = get();
    if (pollingTimer) {
      clearInterval(pollingTimer);
      set({ pollingTimer: null });
    }
  },

  // Reset state (called when leaving detail page)
  reset: () => {
    get().stopPolling();
    set({
      taskId: null,
      instances: [],
      total: 0,
      page: 1,
      filters: defaultFilters,
      loading: false,
    });
  },

  // Set page and fetch
  setPage: (page: number) => {
    const { taskId } = get();
    if (!taskId) return;
    set({ page });
    get().fetchInstances(taskId);
  },

  // Set page size, reset page to 1, and fetch
  setPageSize: (pageSize: number) => {
    const { taskId } = get();
    if (!taskId) return;
    set({ pageSize, page: 1 });
    get().fetchInstances(taskId);
  },

  // Update filters (DON'T auto-fetch)
  setFilters: (patch: Partial<InstanceListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
    }));
  },

  // Reset filters to default, reset page to 1, and fetch
  resetFilters: () => {
    const { taskId } = get();
    if (!taskId) return;
    set({ filters: defaultFilters, page: 1 });
    get().fetchInstances(taskId);
  },

  // Apply filter patch, reset page to 1, and fetch
  applyFiltersAndFetch: (patch: Partial<InstanceListFilters>) => {
    const { taskId } = get();
    if (!taskId) return;
    set((state) => ({
      filters: { ...state.filters, ...patch },
      page: 1,
    }));
    get().fetchInstances(taskId);
  },
}));

