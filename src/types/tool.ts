// Tool Provider DTO
export interface ToolProviderDTO {
  id: string;
  name: string;
  description: string;
  provider_type: string; // 例如: "mcp", "builtin", "custom"
  status: 'active' | 'inactive';
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Tool Function DTO
export interface ToolFunctionDTO {
  id: string;
  provider_id: string;
  provider_name: string; // 冗余字段,方便显示
  name: string;
  description: string;
  function_schema: Record<string, unknown>; // JSON Schema
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Provider 请求
export interface ToolProviderCreateRequest {
  name: string;
  description: string;
  provider_type: string;
  status?: 'active' | 'inactive';
  config?: Record<string, unknown>;
}

export interface ToolProviderUpdateRequest extends ToolProviderCreateRequest {
  id: string;
}

// Function 请求
export interface ToolFunctionCreateRequest {
  provider_id: string;
  name: string;
  description: string;
  function_schema: Record<string, unknown>;
  enabled?: boolean;
}

export interface ToolFunctionUpdateRequest extends ToolFunctionCreateRequest {
  id: string;
}
