export enum DownloadStatus {
  Success = 'success',
  Skipped = 'skipped',
  Failed = 'failed',
}

export interface DownloadResult {
  lesson: string;
  status: DownloadStatus;
  reason?: string;
  filePath?: string;
}
