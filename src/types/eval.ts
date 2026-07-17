/**
 * Eval platform type definitions
 * Wire DTOs strictly mirror backend Go json tags (snake_case)
 * Backend sources:
 * - internal/applications/dtos/eval.go
 * - api/handlers/eval.go
 */

// ========== Case ==========

/**
 * Case view DTO (backend: dtos/eval.go)
 */
export interface CaseView {
  id: string;
  name: string;
  description: string;
  init_script: string;
  task_prompt: string;
  verify_script: string;
  tags: string[];
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
}

/**
 * Case create request (backend: dtos/eval.go)
 */
export interface CaseCreateRequest {
  name: string;
  description: string;
  init_script: string;
  task_prompt: string;
  verify_script: string;
  tags: string[];
}

/**
 * Case update request (backend: dtos/eval.go)
 * Only changed fields should be included
 */
export interface CaseUpdateRequest {
  name?: string;
  description?: string;
  init_script?: string;
  task_prompt?: string;
  verify_script?: string;
  tags?: string[];
}

/**
 * List cases query params (backend: dtos/eval.go)
 */
export interface ListCasesQuery {
  name_like?: string;
  tags?: string[];
  page: number;
  size: number;
}

/**
 * Upload content response (backend: handlers/eval.go)
 */
export interface UploadContentResp {
  content: string;
  size: number;
}

// ========== Task ==========

/**
 * Task view DTO (backend: dtos/eval.go)
 */
export interface TaskView {
  id: string;
  name: string;
  case_ids: string[];
  agent_config_ids: string[];
  status: string; // PENDING | RUNNING | SUCCEEDED | FAILED
  total_count: number;
  succeeded_count: number;
  failed_count: number;
  running_count: number;
  created_at: string; // ISO8601
  started_at?: string; // ISO8601
  finished_at?: string; // ISO8601
}

/**
 * Task create request (backend: dtos/eval.go)
 */
export interface TaskCreateRequest {
  name: string;
  case_ids: string[];
  agent_config_ids: string[];
}

/**
 * List tasks query params (backend: dtos/eval.go)
 */
export interface ListTasksQuery {
  status?: string;
  page: number;
  size: number;
}

/**
 * Retry task response (backend: handlers/eval.go)
 */
export interface RetryTaskResp {
  retried_count: number;
}

// ========== Instance ==========

/**
 * Instance view DTO (backend: dtos/eval.go)
 */
export interface InstanceView {
  id: string;
  task_id: string;
  case_id: string;
  status: string; // PENDING | RUNNING | SUCCEEDED | FAILED | TIMEOUT
  attempt: number;
  conversation_id: string;
  message_id: string;
  trace_id: string;
  queued_at?: string; // ISO8601
  started_at?: string; // ISO8601
  finished_at?: string; // ISO8601
  heartbeat_at?: string; // ISO8601
  deadline_at?: string; // ISO8601
  worker_id: string;
  error_message: string;
  result?: ResultView;
}

/**
 * Result view DTO (backend: dtos/eval.go)
 */
export interface ResultView {
  instance_id: string;
  passed: boolean;
  verify_exit_code: number;
  verify_stdout: string;
  verify_stderr: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  agent_latency_ms: number;
  error_log: string;
  finished_at: string; // ISO8601
}

/**
 * List instances query params (backend: dtos/eval.go)
 */
export interface ListInstancesQuery {
  status?: string;
  page: number;
  size: number;
}

// ========== Agent Config ==========

/**
 * Agent config view DTO (backend: dtos/eval.go)
 */
export interface AgentConfigView {
  id: string;
  model_name: string;
  provider: string;
}

// ========== Generic ==========

/**
 * Paginated list response (backend: dtos/eval.go)
 */
export interface ListPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

