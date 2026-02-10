import type { Language } from './common';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  dependsOn: string[];
  execute: (input: AgentInput) => Promise<AgentResult>;
}

export interface AgentInput {
  userResponses: string[];
  additionalContext: string[];
  language: Language;
  previousResults?: Record<string, AgentResult>;
}

export interface AgentResult {
  agentId: string;
  success: boolean;
  data: unknown;
  error?: string;
  durationMs: number;
}

export type PipelineStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface PipelineState {
  status: PipelineStatus;
  completedAgents: string[];
  failedAgents: string[];
  results: Record<string, AgentResult>;
}
