import type { AgentInput, AgentResult, PipelineState } from '../types/agent';
import { agentRegistry } from './registry';

export class PipelineScheduler {
  private state: PipelineState = {
    status: 'idle',
    completedAgents: [],
    failedAgents: [],
    results: {},
  };

  getState(): PipelineState {
    return { ...this.state };
  }

  async run(input: AgentInput): Promise<PipelineState> {
    this.state = {
      status: 'running',
      completedAgents: [],
      failedAgents: [],
      results: {},
    };

    const agents = agentRegistry.getDependencyOrder();
    const completed = new Set<string>();

    // Group agents into layers by dependency
    while (completed.size < agents.length) {
      const ready = agents.filter(
        (a) =>
          !completed.has(a.id) &&
          a.dependsOn.every((dep) => completed.has(dep))
      );

      if (ready.length === 0) break;

      const results = await Promise.allSettled(
        ready.map((agent) =>
          agent.execute({
            ...input,
            previousResults: this.state.results,
          })
        )
      );

      for (let i = 0; i < ready.length; i++) {
        const agent = ready[i];
        const result = results[i];

        if (result.status === 'fulfilled') {
          const agentResult = result.value;
          this.state.results[agent.id] = agentResult;

          if (agentResult.success) {
            this.state.completedAgents.push(agent.id);
          } else {
            this.state.failedAgents.push(agent.id);
          }
        } else {
          this.state.failedAgents.push(agent.id);
          this.state.results[agent.id] = {
            agentId: agent.id,
            success: false,
            data: null,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason || 'Unknown error'),
            durationMs: 0,
          };
        }

        completed.add(agent.id);
      }
    }

    this.state.status = this.state.failedAgents.length > 0 ? 'failed' : 'completed';
    return this.getState();
  }
}
