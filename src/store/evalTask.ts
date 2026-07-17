/**
 * Zustand store for eval task management
 * Manages task list, pagination, filters, CRUD operations, and 5s intelligent polling
 */

import { create } from 'zustand';
import { message } from 'antd';
import { listTasks, createTask, deleteTask, retryTask } from '@/api/modules/eval';
import type { TaskView, TaskCreateRequest, ListTasksQuery } from '@/types/eval';

/**
 * Filter state for task list
 */
export interface TaskListFilters {
  status: string; // '' | 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
}

/**
 * Default filter values
 */
const defaultFilters: TaskListFilters = {
  status: '',
};

/**
 * Module-level AbortController for race condition handling
 */
let inflight: AbortController | null = null;

/**
 * Task state
 */
interface TaskState {
  // Data
  tasks: TaskView[];
  total: number;
  page: number; // 1-based
  pageSize: number;
  filters: TaskListFilters;
  loading: boolean;
  pollingTimer: ReturnType<typeof setInterval> | null;

  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (req: TaskCreateRequest) => Promise<TaskView>;
  deleteTask: (id: string) => Promise<void>;
  retryTask: (id: string) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (patch: Partial<TaskListFilters>) => void;
  resetFilters: () => void;
  applyFiltersAndFetch: (patch: Partial<TaskListFilters>) => void;
}

/**
 * Create task store
 */
export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: defaultFilters,
  loading: false,
  pollingTimer: null,

  // Fetch tasks with race condition handling
  fetchTasks: async () => {
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
    set({ loading: true });

    try {
      const queryParams: ListTasksQuery = {
        page: validPage,
        size: validPageSize,
      };

      if (filters.status) {
        queryParams.status = filters.status;
      }

      const response = await listTasks(queryParams);

      // Update state with response
      set({
        tasks: response.items,
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

  // Create task
  createTask: async (req: TaskCreateRequest) => {
    const result = await createTask(req);
    message.success('任务创建成功');
    // Refresh list and start polling
    await get().fetchTasks();
    get().startPolling();
    return result;
  },

  // Delete task
  deleteTask: async (id: string) => {
    await deleteTask(id);
    message.success('任务删除成功');
    // Refresh list
    await get().fetchTasks();
  },

  // Retry task (retry failed instances)
  retryTask: async (id: string) => {
    const result = await retryTask(id);
    message.success(`重试了 ${result.retried_count} 个实例`);
    // Refresh list and start polling
    await get().fetchTasks();
    get().startPolling();
  },

  // Start intelligent polling (5s interval)
  startPolling: () => {
    const state = get();

    // Stop existing timer
    if (state.pollingTimer) {
      clearInterval(state.pollingTimer);
    }

    // Create new timer
    const timer = setInterval(() => {
      const { tasks, loading } = get();

      // Check if any task is active
      const hasActive = tasks.some((t) =>
        ['PENDING', 'RUNNING'].includes(t.status)
      );

      if (hasActive && !loading) {
        // Silent refresh (don't set loading to avoid table flashing)
        listTasks({
          page: get().page,
          size: get().pageSize,
          status: get().filters.status || undefined,
        })
          .then((response) => {
            set({
              tasks: response.items,
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
    }, 5000);

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

  // Set page and fetch
  setPage: (page: number) => {
    set({ page });
    get().fetchTasks();
  },

  // Set page size, reset page to 1, and fetch
  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchTasks();
  },

  // Update filters (DON'T auto-fetch)
  setFilters: (patch: Partial<TaskListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
    }));
  },

  // Reset filters to default, reset page to 1, and fetch
  resetFilters: () => {
    set({ filters: defaultFilters, page: 1 });
    get().fetchTasks();
  },

  // Apply filter patch, reset page to 1, and fetch
  applyFiltersAndFetch: (patch: Partial<TaskListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
      page: 1,
    }));
    get().fetchTasks();
  },
}));

