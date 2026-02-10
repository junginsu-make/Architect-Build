// Google Drive service interface + stub implementation (Phase C)

export interface GDriveUploadPayload {
  fileName: string;
  mimeType: string;
  data: Uint8Array | string;
  folderId?: string;
}

export interface GDriveService {
  upload(payload: GDriveUploadPayload): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }>;
}

// Stub implementation - will be replaced in Phase C
class StubGDriveService implements GDriveService {
  async upload(_payload: GDriveUploadPayload) {
    console.warn('[GDriveService] Stub: Google Drive upload not implemented yet (Phase C)');
    return { success: false, error: 'Google Drive service not yet implemented. Coming in Phase C.' };
  }
}

export const gdriveService: GDriveService = new StubGDriveService();
