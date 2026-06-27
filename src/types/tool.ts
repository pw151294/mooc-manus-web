export interface ToolProviderDTO {
  providerId: string;
  providerName: string;
  providerDesc: string;
  providerType: string;
  providerUrl?: string;
  providerTransport?: string;
}

export interface ToolFunctionDTO {
  functionId: string;
  providerId: string;
  functionName: string;
  functionDesc: string;
  properties?: Record<string, unknown>;
}

export interface ToolProviderCreateRequest {
  providerName: string;
  providerDesc?: string;
  providerType: string;
  providerUrl?: string;
  providerTransport?: string;
}

export interface ToolProviderUpdateRequest extends ToolProviderCreateRequest {
  providerId: string;
}

export interface ToolFunctionCreateRequest {
  providerId: string;
  functionName: string;
  functionDesc?: string;
  parameters?: Record<string, unknown>;
}

export interface ToolFunctionUpdateRequest extends ToolFunctionCreateRequest {
  functionId: string;
}
