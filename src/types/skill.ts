export interface SkillProviderDTO {
  skillProviderId: string;
  providerName: string;
  providerType: string;
  authType?: string;
  repoUrl?: string;
  status: string;
  skillCount: number;
  creator?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillVersionDTO {
  skillVersionId: string;
  skillId: string;
  skillName?: string;
  version: string;
  description?: string;
  skillFiles?: SkillFileDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillFileDTO {
  path: string;
  fileKey: string;
  suffix?: string;
  size?: number;
  checksum?: string;
}

export interface SkillDTO {
  skillId: string;
  skillProviderId: string;
  providerName?: string;
  skillName: string;
  description?: string;
  status: 'online' | 'offline' | 'draft';
  latestVersion?: SkillVersionDTO;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillImportTaskDTO {
  taskId: string;
  fileName?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  stage?: string;
  progress: number;
  createdAt: string;
}

export interface ImportProgressEvent {
  taskId: string;
  status: string;
  stage?: string;
  progress: number;
  errorMessage?: string;
}

export interface SkillProviderCreateRequest {
  providerName: string;
  repoUrl: string;
  authType?: string;
  authToken?: string;
}

export interface SkillImportRequest {
  providerName: string;
  repoUrl: string;
  authType?: string;
  authToken?: string;
}

export interface SkillUpdateRequest {
  skillId: string;
  skillName?: string;
  description?: string;
  status?: string;
}

export interface SkillFileStructure {
  type: 'file' | 'directory';
  path: string;
  name: string;
}

export interface SkillDraftSaveRequest {
  skillId?: string;
  skillName?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  skillFiles: SkillFileStructure[];
  files: File[];
}

export interface SkillPublishRequest {
  skillId?: string;
  providerId?: string;
  skillName?: string;
  description?: string;
  versionDescription?: string;
  icon?: string;
  imageUrl?: string;
  skillFiles: SkillFileStructure[];
  files: File[];
}
