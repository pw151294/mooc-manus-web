/**
 * AppConfig 模块类型定义
 */

// AppConfig DTO (对应后端返回数据)
export interface AppConfigDTO {
  id: string;
  model_name: string;
  base_url: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  timeout: number;
  stream: boolean;
  created_at: string;
  updated_at: string;
}

// 创建请求
export interface AppConfigCreateRequest {
  model_name: string;
  base_url: string;
  api_key: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  timeout?: number;
  stream?: boolean;
}

// 更新请求
export interface AppConfigUpdateRequest extends AppConfigCreateRequest {
  appConfigId: string;
}
