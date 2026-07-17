/**
 * Zustand store for eval case management
 * Manages case list, pagination, filters, and CRUD operations
 * No polling - cases are static data
 */

import { create } from 'zustand';
import { message } from 'antd';
import { listCases, createCase, updateCase, deleteCase } from '@/api/modules/eval';
import type {
  CaseView,
  CaseCreateRequest,
  CaseUpdateRequest,
  ListCasesQuery,
} from '@/types/eval';

/**
 * Filter state for case list
 */
export interface CaseListFilters {
  nameLike: string; // empty string = no filter
  tags: string[]; // empty array = no filter
}

/**
 * Default filter values
 */
const defaultFilters: CaseListFilters = {
  nameLike: '',
  tags: [],
};

/**
 * Module-level AbortController for race condition handling
 * DON'T store in Zustand state to avoid re-renders
 */
let inflight: AbortController | null = null;

/**
 * Case state
 */
interface CaseState {
  // Data
  cases: CaseView[];
  total: number;
  page: number; // 1-based
  pageSize: number;
  filters: CaseListFilters;
  loading: boolean;

  // Actions
  fetchCases: () => Promise<void>;
  createCase: (req: CaseCreateRequest) => Promise<CaseView>;
  updateCase: (id: string, req: CaseUpdateRequest) => Promise<CaseView>;
  deleteCase: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (patch: Partial<CaseListFilters>) => void;
  resetFilters: () => void;
  applyFiltersAndFetch: (patch: Partial<CaseListFilters>) => void;
}

/**
 * Create case store
 */
export const useCaseStore = create<CaseState>((set, get) => ({
  // Initial state
  cases: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: defaultFilters,
  loading: false,

  // Fetch cases with race condition handling
  fetchCases: async () => {
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
      const queryParams: ListCasesQuery = {
        page: validPage,
        size: validPageSize,
      };

      if (filters.nameLike) {
        queryParams.name_like = filters.nameLike;
      }
      if (filters.tags.length > 0) {
        queryParams.tags = filters.tags;
      }

      const response = await listCases(queryParams);

      // Update state with response
      set({
        cases: response.items,
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

  // Create case
  createCase: async (req: CaseCreateRequest) => {
    const result = await createCase(req);
    message.success('用例创建成功');
    // Refresh list
    await get().fetchCases();
    return result;
  },

  // Update case
  updateCase: async (id: string, req: CaseUpdateRequest) => {
    const result = await updateCase(id, req);
    message.success('用例更新成功');
    // Refresh list
    await get().fetchCases();
    return result;
  },

  // Delete case
  deleteCase: async (id: string) => {
    await deleteCase(id);
    message.success('用例删除成功');
    // Refresh list
    await get().fetchCases();
  },

  // Set page and fetch
  setPage: (page: number) => {
    set({ page });
    get().fetchCases();
  },

  // Set page size, reset page to 1, and fetch
  setPageSize: (pageSize: number) => {
    set({ pageSize, page: 1 });
    get().fetchCases();
  },

  // Update filters (DON'T auto-fetch)
  setFilters: (patch: Partial<CaseListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
    }));
  },

  // Reset filters to default, reset page to 1, and fetch
  resetFilters: () => {
    set({ filters: defaultFilters, page: 1 });
    get().fetchCases();
  },

  // Apply filter patch, reset page to 1, and fetch
  applyFiltersAndFetch: (patch: Partial<CaseListFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
      page: 1,
    }));
    get().fetchCases();
  },
}));

