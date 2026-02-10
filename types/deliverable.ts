export type DeliverableFormat = 'json' | 'zip' | 'pdf' | 'markdown';

export type ExportTarget = 'download' | 'email' | 'gdrive' | 'display';

export interface ExportRequest {
  format: DeliverableFormat;
  target: ExportTarget;
  projectId?: string;
  recipientEmail?: string;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  error?: string;
}
