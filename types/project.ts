import type { Language } from './common';

export type ProjectStatus = 'draft' | 'intake' | 'diagnosing' | 'building' | 'completed';

export type IntakeMode = 'chat' | 'form';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  intakeMode: IntakeMode;
  language: Language;
  userResponses: string[];
  additionalContext: string[];
  createdAt: number;
  updatedAt: number;
}
