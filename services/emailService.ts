// Email service interface + stub implementation (Phase C)

export interface EmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  attachments?: { filename: string; data: Uint8Array; mimeType: string }[];
}

export interface EmailService {
  send(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Stub implementation - will be replaced in Phase C
class StubEmailService implements EmailService {
  async send(_payload: EmailPayload) {
    console.warn('[EmailService] Stub: email sending not implemented yet (Phase C)');
    return { success: false, error: 'Email service not yet implemented. Coming in Phase C.' };
  }
}

export const emailService: EmailService = new StubEmailService();
