/**
 * Eval API module
 * Provides eval platform CRUD operations with snake_case params
 */

import request from '../request';
import type {
  CaseView,
  CaseCreateRequest,
  CaseUpdateRequest,
  ListCasesQuery,
  UploadContentResp,
  TaskView,
  TaskCreateRequest,
  ListTasksQuery,
  RetryTaskResp,
  InstanceView,
  ListInstancesQuery,
  AgentConfigView,
  ListPage,
} from '@/types/eval';

// ========== Case (6 functions) ==========

/**
 * Upload file content
 * Used in ScriptInput component for file upload
 */
export async function uploadContent(file: File): Promise<UploadContentResp> {
  const formData = new FormData();
  formData.append('file', file);

  return request.post<UploadContentResp>('/api/eval/cases/upload-content', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Create case
 */
export async function createCase(req: CaseCreateRequest): Promise<CaseView> {
  return request.post<CaseView>('/api/eval/cases', req);
}

/**
 * Update case (only send changed fields)
 */
export async function updateCase(id: string, req: CaseUpdateRequest): Promise<CaseView> {
  return request.put<CaseView>(`/api/eval/cases/${id}`, req);
}

/**
 * List cases with filters
 */
export async function listCases(params: ListCasesQuery): Promise<ListPage<CaseView>> {
  const queryParams: Record<string, unknown> = {
    page: params.page,
    size: params.size,
  };

  if (params.name_like !== undefined && params.name_like !== '') {
    queryParams.name_like = params.name_like;
  }
  if (params.tags !== undefined && params.tags.length > 0) {
    queryParams.tags = params.tags.join(',');
  }

  return request.get<ListPage<CaseView>>('/api/eval/cases', { params: queryParams });
}

/**
 * Get case by ID
 */
export async function getCase(id: string): Promise<CaseView> {
  return request.get<CaseView>(`/api/eval/cases/${id}`);
}

/**
 * Delete case
 * May return 409 if case is referenced by active tasks
 */
export async function deleteCase(id: string): Promise<void> {
  return request.delete<void>(`/api/eval/cases/${id}`);
}

// ========== Task (5 functions) ==========

/**
 * Create task (M cases × N agent configs)
 */
export async function createTask(req: TaskCreateRequest): Promise<TaskView> {
  return request.post<TaskView>('/api/eval/tasks', req);
}

/**
 * List tasks with filters
 */
export async function listTasks(params: ListTasksQuery): Promise<ListPage<TaskView>> {
  const queryParams: Record<string, unknown> = {
    page: params.page,
    size: params.size,
  };

  if (params.status !== undefined && params.status !== '') {
    queryParams.status = params.status;
  }

  return request.get<ListPage<TaskView>>('/api/eval/tasks', { params: queryParams });
}

/**
 * Get task by ID
 */
export async function getTask(id: string): Promise<TaskView> {
  return request.get<TaskView>(`/api/eval/tasks/${id}`);
}

/**
 * Retry failed instances of a task
 */
export async function retryTask(id: string): Promise<RetryTaskResp> {
  return request.post<RetryTaskResp>(`/api/eval/tasks/${id}/retry`, {});
}

/**
 * Delete task
 */
export async function deleteTask(id: string): Promise<void> {
  return request.delete<void>(`/api/eval/tasks/${id}`);
}

// ========== Instance (4 functions) ==========

/**
 * List instances for a task
 */
export async function listInstances(
  taskId: string,
  params: ListInstancesQuery
): Promise<ListPage<InstanceView>> {
  const queryParams: Record<string, unknown> = {
    page: params.page,
    size: params.size,
  };

  if (params.status !== undefined && params.status !== '') {
    queryParams.status = params.status;
  }

  return request.get<ListPage<InstanceView>>(`/api/eval/tasks/${taskId}/instances`, {
    params: queryParams,
  });
}

/**
 * Get instance by ID
 */
export async function getInstance(id: string): Promise<InstanceView> {
  return request.get<InstanceView>(`/api/eval/instances/${id}`);
}

/**
 * Get trace ID for instance
 */
export async function getInstanceTrace(id: string): Promise<{ trace_id: string }> {
  return request.get<{ trace_id: string }>(`/api/eval/instances/${id}/trace`);
}

/**
 * Retry instance
 * Only allowed for FAILED/TIMEOUT status
 */
export async function retryInstance(id: string): Promise<InstanceView> {
  return request.post<InstanceView>(`/api/eval/instances/${id}/retry`, {});
}

/**
 * Delete instance
 * May return 409 if instance is running
 */
export async function deleteInstance(id: string): Promise<void> {
  return request.delete<void>(`/api/eval/instances/${id}`);
}

// ========== Agent Config (1 function) ==========

/**
 * List all agent configs
 */
export async function listAgentConfigs(): Promise<AgentConfigView[]> {
  return request.get<AgentConfigView[]>('/api/eval/agent-configs');
}

