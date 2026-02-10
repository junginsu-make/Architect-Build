import type { AgentDefinition, AgentInput, AgentResult } from '../types/agent';

export abstract class BaseAgent implements AgentDefinition {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract dependsOn: string[];

  async execute(input: AgentInput): Promise<AgentResult> {
    const start = performance.now();
    try {
      const data = await this.run(input);
      return {
        agentId: this.id,
        success: true,
        data,
        durationMs: performance.now() - start,
      };
    } catch (err) {
      return {
        agentId: this.id,
        success: false,
        data: null,
        error: err instanceof Error ? err.message : String(err),
        durationMs: performance.now() - start,
      };
    }
  }

  protected abstract run(input: AgentInput): Promise<unknown>;
}
