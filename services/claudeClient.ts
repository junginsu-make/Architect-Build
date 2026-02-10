import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getApiKey(): string {
  return process.env.ANTHROPIC_API_KEY || '';
}

export function hasClaudeApiKey(): boolean {
  return !!getApiKey();
}

export function getClaudeClient(): Anthropic {
  if (!_client) {
    const key = getApiKey();
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일에 추가해 주세요.');
    }
    _client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  return _client;
}
