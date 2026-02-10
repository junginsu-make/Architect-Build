import { agentRegistry } from '../registry';
import { ArchitectBlueprintAgent } from './architectBlueprint.agent';

export function registerAllAgents(): void {
  agentRegistry.register(new ArchitectBlueprintAgent());
}
