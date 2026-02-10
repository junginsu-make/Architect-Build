import type { AgentDefinition } from '../types/agent';

class AgentRegistry {
  private static instance: AgentRegistry;
  private agents = new Map<string, AgentDefinition>();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  register(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  get(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAll(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getDependencyOrder(): AgentDefinition[] {
    const sorted: AgentDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (agent: AgentDefinition) => {
      if (visited.has(agent.id)) return;
      if (visiting.has(agent.id)) {
        throw new Error(`Circular dependency detected: ${agent.id}`);
      }
      visiting.add(agent.id);

      for (const depId of agent.dependsOn) {
        const dep = this.agents.get(depId);
        if (dep) visit(dep);
      }

      visiting.delete(agent.id);
      visited.add(agent.id);
      sorted.push(agent);
    };

    for (const agent of this.agents.values()) {
      visit(agent);
    }

    return sorted;
  }
}

export const agentRegistry = AgentRegistry.getInstance();
