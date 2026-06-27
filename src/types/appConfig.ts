export interface AppConfigDTO {
  appConfigId: string;
  baseUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  maxIterations: number;
  maxRetries: number;
  maxSearchResults: number;
}

export interface AppConfigCreateRequest {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  maxIterations?: number;
  maxRetries?: number;
  maxSearchResults?: number;
}

export interface AppConfigUpdateRequest extends AppConfigCreateRequest {
  appConfigId: string;
}
