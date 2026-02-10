import { BaseAgent } from '../base';
import type { AgentInput } from '../../types/agent';
import { generateSolutionBlueprint, type SolutionBlueprint } from '../../services/geminiService';

export class ArchitectBlueprintAgent extends BaseAgent {
  id = 'architect-blueprint';
  name = 'Architect Blueprint Generator';
  description = 'Generates the full solution blueprint using Gemini with Google Search grounding';
  dependsOn: string[] = [];

  protected async run(input: AgentInput): Promise<SolutionBlueprint> {
    return generateSolutionBlueprint(
      input.userResponses,
      input.language,
      input.additionalContext
    );
  }
}
