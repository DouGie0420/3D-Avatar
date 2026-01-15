export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  type: 'front' | 'back' | 'full' | 'closeup';
}

export type AvatarViewType = 'front' | 'back' | 'full' | 'closeup';

export interface GenerationConfig {
  prompt: string;
  referenceImages: UploadedImage[];
}

export interface VideoResult {
  uri: string;
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}