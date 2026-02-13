import OpenAI from "openai";

let _client: OpenAI | null = null;

function getApiKey(): string {
  return process.env.OPENAI_API_KEY || '';
}

export function hasOpenAiApiKey(): boolean {
  return !!getApiKey();
}

export function getOpenAiClient(): OpenAI {
  if (!_client) {
    const key = getApiKey();
    if (!key) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다. .env.local 파일에 추가해 주세요.');
    }
    _client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }
  return _client;
}
