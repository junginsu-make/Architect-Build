import { GoogleGenAI } from "@google/genai";
import { Language } from "../types/common";

let _client: GoogleGenAI | null = null;

function getApiKey(): string {
  return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
}

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const key = getApiKey();
    if (!key) {
      throw new Error('API key is not configured. Please set GEMINI_API_KEY in .env.local file.');
    }
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

export function hasGeminiApiKey(): boolean {
  return !!getApiKey();
}

export function checkApiKey(lang: Language): void {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      lang === Language.KO
        ? 'API 키가 설정되지 않았습니다. .env.local 파일에 GEMINI_API_KEY를 설정해 주세요.'
        : 'API key is not configured. Please set GEMINI_API_KEY in .env.local file.'
    );
  }
}
