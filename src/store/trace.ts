/**
 * Zustand store for trace list page
 * Manages pagination, filters, and loading state with race condition handling
 */

import { create } from 'zustand';
import { message } from 'antd';
import { listTraces } from '../api/modules/trace';
import type { TraceSummaryDTO } from '../types/trace';

/**
 * Filter state for trace list
 */
export interface TraceListFilters {
  conversationId: string; // empty string = no filter
  agentName: string; // empty string = no filter
  isError: 'all' | 'true' | 'false'; // three-state
  startTimeFrom: number | null; // Unix ns
  startTimeTo: number | null; // Unix ns
}

/**
 * Default filter values
 */
const defaultFilters: TraceListFilters = {
  conversationId: '',
  agentName: '',
  isError: 'all',
  startTimeFrom: null,
  startTimeTo: null,
};

/**
 * Module-level AbortController for race condition handling
 * DON'T store in Zustand state to avoid re-renders
 */
let inflight: AbortController | null = null;

/**
 * Trace list state
 */
interface TraceState {
  // Data
  traces: TraceSummaryDTO[];
  total: number;
  page: number; // 1-based
  pageSize: number;
  filters: TraceListFilters;
  loading: boolean;

  // Actions
  fetchTraces: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (patch: Partial<TraceListFilters>) => void;
  resetFilters: () => void;
  applyFiltersAndFetch: (patch: Partial<TraceListFilters>) => void;
}

/**
 * Create trace store
 */
export const useTraceStore = create<TraceState>((set, get) => ({
  // Initial state
  traces: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: defaultFilters,
  loading: false,

  // Fetch traces with race condition handling
  fetchTraces: async () => {
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
      const response = await listTraces({
        conversationId: filters.conversationId || undefined,
        agentName: filters.agentName || undefined,
        isError: filters.isError,
        startTimeFrom: filters.startTimeFrom,
        startTimeTo: filters.startTimeTo,
        page: validPage,
        pageSize: validPageSize,
      });

      // Update state with response (snake_case → camelCase handled by response)
      set({
        traces: response.traces,
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
        loading: false,
      });

      inflight = null;
    } catch (err: unknown) {
      // Clear inflight
      inflight = null;

      // Set loading to false
      set({ loading: false });

      // Extract error message
      const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
      const errorMessage =
        axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? '查询失败';

      // Show error toast
      message.error(errorMessage);

      // Re-throw for caller handling
      throw err;
    }
  },

  // Set page and fetch
  setPage: (page: number) => {
    set({ page });
    get().fetchTraces();
  },

  // Set page size, reset page to 1, and fetch
  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchTraces();
  },

  // Update filters (DON'T auto-fetch)
  setFilters: (patch: Partial<TraceListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
    }));
  },

  // Reset filters to default, reset page to 1, and fetch
  resetFilters: () => {
    set({ filters: defaultFilters, page: 1 });
    get().fetchTraces();
  },

  // Apply filter patch, reset page to 1, and fetch
  applyFiltersAndFetch: (patch: Partial<TraceListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
      page: 1,
    }));
    get().fetchTraces();
  },
}));
