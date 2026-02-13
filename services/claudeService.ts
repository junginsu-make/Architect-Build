import { getClaudeClient, hasClaudeApiKey } from "./claudeClient";
import { getGeminiClient, hasGeminiApiKey } from "./geminiClient";
import { getOpenAiClient, hasOpenAiApiKey } from "./openaiClient";
import { Type } from "@google/genai";
import { Language } from "../types/common";
import { findRelevantDocs, formatDocsForPrompt } from "./techReference";
import { callWithFallback, type ModelProvider, type FallbackResult } from "./fallbackChain";

export interface TechStackItem {
  category: string;
  name: string;
  version: string;
  purpose: string;
}

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  requestBody?: string;
  responseBody?: string;
  errorCodes?: string[];
}

export interface DatabaseTable {
  name: string;
  description: string;
  columns: { name: string; type: string; constraint: string }[];
}

export interface ModuleSpec {
  name: string;
  description: string;
  file: string;
  language: string;
  code: string;
}

export interface SprintPlan {
  sprint: number;
  title: string;
  duration: string;
  goals: string[];
  deliverables: string[];
  dependencies: string[];
}

export interface ImplementationPlan {
  prd: string;
  lld: string;
  projectStructure: string;
  techStack: TechStackItem[];
  apiDesign: ApiEndpoint[];
  databaseDesign: DatabaseTable[];
  keyModules: ModuleSpec[];
  sprintPlan: SprintPlan[];
  deploymentPlan: string;
  testingStrategy: string;
}

export interface ImplementationPlanResult {
  plan: ImplementationPlan;
  modelUsed: { callA: ModelProvider; callB: ModelProvider };
  fallbackLog: { callA: string[]; callB: string[] };
}

export { hasClaudeApiKey };

// ════════════════════════════════════════════
// Shared context builder
// ════════════════════════════════════════════

function buildUserContext(
  userResponses: string[],
  lang: Language,
  additionalContext: string[],
  timeline?: string,
) {
  const [background, model, process, tech, goal] = userResponses;
  const matchedDocs = findRelevantDocs(tech);
  const techRefContext = formatDocsForPrompt(matchedDocs);
  const langText = lang === Language.KO
    ? "모든 내용을 한국어로 작성하세요. 코드 주석도 한국어로."
    : "Write everything in English.";

  return { background, model, process, tech, goal, techRefContext, langText, additionalContext, timeline };
}

// ════════════════════════════════════════════
// Prompt builders (shared across providers)
// ════════════════════════════════════════════

interface CallAResult {
  prd: string;
  lld: string;
  projectStructure: string;
  sprintPlan: SprintPlan[];
  deploymentPlan: string;
  testingStrategy: string;
}

interface CallBResult {
  techStack: TechStackItem[];
  apiDesign: ApiEndpoint[];
  databaseDesign: DatabaseTable[];
  keyModules: ModuleSpec[];
}

function buildCallAPrompt(ctx: ReturnType<typeof buildUserContext>): string {
  return `당신은 20년 이상 경력의 시니어 소프트웨어 아키텍트이자 테크 리드입니다.
아래 요구사항을 기반으로 **주니어 개발자도 이 문서만 보고 구현할 수 있을 수준**의 개발 문서를 JSON으로 작성하세요.

[사용자 요구사항]
1. 비즈니스 배경: ${ctx.background}
2. 희망 시스템 모델: ${ctx.model}
3. 상세 업무 프로세스: ${ctx.process}
4. 기존 기술 환경/제약: ${ctx.tech}
5. 최종 KPI 목표: ${ctx.goal}
${ctx.additionalContext.length > 0 ? `\n[추가 컨텍스트]\n${ctx.additionalContext.join('\n')}` : ''}
${ctx.timeline ? `\n[개발 일정 제약]\n희망 완료 시점: ${ctx.timeline}\n\n**절대 규칙**: 일정이 아무리 짧더라도 시스템의 기능, 구조, 모듈, API, DB 스키마를 절대 줄이거나 생략하지 마세요. 모든 설계 내용은 동일하게 유지하되, 스프린트 기간만 압축하세요.\n- 필요하면 스프린트를 1일, 2일, 3일 단위로 나눠도 됩니다.\n- 병렬 개발 가능한 작업은 동시 진행으로 계획하세요.\n- 로드맵의 모든 단계를 지정된 기간 내에 배치하세요.` : ''}
${ctx.langText}

**[PRD — Product Requirements Document]** (prd 필드, 마크다운)
다음 섹션을 반드시 포함:
- 1. 개요 (Overview): 프로젝트 목적, 배경, 범위
- 2. 목표 및 성공 지표 (Goals & Metrics): 측정 가능한 KPI
- 3. 사용자 페르소나 (User Personas): 주요 사용자 유형별 니즈
- 4. 기능 요구사항 (Functional Requirements): P1/P2/P3 우선순위로 분류
- 5. 비기능 요구사항 (Non-functional Requirements): 성능, 보안, 확장성
- 6. 사용자 스토리 및 시나리오 (User Stories): "~로서 ~를 하면 ~된다" 형식
- 7. 의존성 및 제약사항 (Dependencies & Constraints)
- 8. 릴리스 계획 (Release Plan): 버전별 기능 범위 (MVP → v1.0 → v2.0)

**[LLD — Low-Level Design Document]** (lld 필드, 마크다운)
다음 섹션을 반드시 포함하되, 산문이 아닌 구체적 명세 형태로 작성하세요:
- 1. 시스템 아키텍처 상세: 각 레이어(프론트엔드/API/서비스/데이터)의 역할, 통신 프로토콜(REST/gRPC/WebSocket), 포트 번호
- 2. 모듈 상세 설계: 각 모듈의 클래스/함수 인터페이스를 TypeScript/Python 시그니처로 명시
- 3. 데이터 모델 상세: 테이블 간 관계(1:N, M:N), 인덱스 전략, 마이그레이션 순서
- 4. API 명세 상세: 주요 엔드포인트의 요청/응답 예시 JSON, 상태 코드별 응답 형식
- 5. 인증/인가 설계: JWT 토큰 구조, 리프레시 토큰 플로우, RBAC 권한 매트릭스 (테이블 형식)
- 6. 에러 처리 전략: 에러 코드 체계 (예: E1001~E1999 인증, E2001~E2999 비즈니스), 로깅 레벨, 모니터링 알림 조건
- 7. 성능 최적화 전략: 캐싱 전략 (어떤 데이터를, TTL 얼마로), 쿼리 최적화 (N+1 방지, 페이지네이션), 예상 부하 시나리오
- 8. 보안 설계: OWASP Top 10 각 항목별 대응 방법, 입력 검증 규칙, Rate Limiting 정책

**[프로젝트 구조]** (projectStructure 필드)
실제 디렉토리 트리. 각 폴더와 주요 파일의 역할을 주석으로 포함.

**[스프린트 계획]** (sprintPlan 배열)
${ctx.timeline ? `사용자 희망 일정(${ctx.timeline}) 내에 완료할 수 있도록 스프린트를 구성하세요. 일정이 매우 짧더라도 기능을 빼지 말고 스프린트 단위를 1일~3일로 줄여서라도 모든 기능을 포함하세요. 병렬 진행 가능한 작업은 같은 스프린트에 배치하세요.` : '2주 단위 스프린트.'} 각 스프린트별:
- sprint(번호), title(스프린트 목표), duration("기간: YYYY.MM.DD ~ YYYY.MM.DD" — 일정 제약에 따라 1일~2주 유동적)
- goals(해당 스프린트 목표 목록), deliverables(산출물), dependencies(선행 조건)

**반드시 초기 스프린트(Sprint 1 또는 Sprint 2)에 "UI/UX 설계 및 디자인 시스템 구축" 단계를 포함하세요.**
- 디자인 토큰 정의 (색상, 타이포그래피, 간격)
- 와이어프레임 및 페이지 흐름도 작성
- 컴포넌트 아키텍처 설계
- UI 목업 제작
이 단계가 프론트엔드 개발 스프린트의 선행 조건(dependency)이 되어야 합니다.

**[배포 계획]** (deploymentPlan 필드, 마크다운)
사용자의 기술 환경(${ctx.tech})에 맞춰 구체적으로 작성하세요:
- CI/CD: 실제 파이프라인 단계 (lint → test → build → deploy), 사용 도구와 설정 파일명
- 환경 구성: 각 환경(dev/staging/prod)의 차이점, 환경 변수 목록
- 무중단 배포: 선택한 전략(Blue-Green/Rolling/Canary)과 그 이유
- 롤백: 롤백 트리거 조건, 자동/수동 롤백 절차
- 모니터링: 헬스체크 엔드포인트, 알림 조건 (CPU > 80%, 에러율 > 5% 등)

**[테스트 전략]** (testingStrategy 필드, 마크다운)
프로젝트의 핵심 기능에 맞춰 구체적으로 작성하세요:
- 단위 테스트: 테스트 대상 모듈 목록, 각 모듈의 핵심 테스트 케이스 예시, 모킹 전략
- 통합 테스트: API 엔드포인트별 테스트 시나리오 (정상/에러), 테스트 DB 설정
- E2E 테스트: 핵심 사용자 시나리오 3~5개의 테스트 플로우
- 도구: 선택한 테스트 프레임워크와 그 이유
- CI 통합: 테스트 자동화 파이프라인 단계, 커버리지 임계값 (예: 80% 미만 시 빌드 실패)

JSON 스키마:
{
  "prd": "string (전체 PRD 마크다운 문서)",
  "lld": "string (전체 LLD 마크다운 문서)",
  "projectStructure": "string (디렉토리 트리)",
  "sprintPlan": [{"sprint":number,"title":"string","duration":"string","goals":["string"],"deliverables":["string"],"dependencies":["string"]}],
  "deploymentPlan": "string (마크다운)",
  "testingStrategy": "string (마크다운)"
}

JSON만 출력하세요. 마크다운 코드 블록이나 추가 설명 없이 순수 JSON만 반환하세요.`;
}

function buildCallBPrompt(ctx: ReturnType<typeof buildUserContext>): string {
  return `당신은 20년 이상 경력의 시니어 소프트웨어 아키텍트이자 테크 리드입니다.
아래 요구사항을 기반으로 기술 구현 명세를 JSON으로 작성하세요.

[사용자 요구사항]
1. 비즈니스 배경: ${ctx.background}
2. 희망 시스템 모델: ${ctx.model}
3. 상세 업무 프로세스: ${ctx.process}
4. 기존 기술 환경/제약: ${ctx.tech}
5. 최종 KPI 목표: ${ctx.goal}
${ctx.additionalContext.length > 0 ? `\n[추가 컨텍스트]\n${ctx.additionalContext.join('\n')}` : ''}
${ctx.techRefContext ? `\n[기술 스택 레퍼런스 — 공식 문서 기반]\n아래는 사용자의 기술 환경에 매칭되는 공식 문서의 최신 패턴입니다. 코드 생성 시 반드시 이 패턴을 참고하세요:\n\n${ctx.techRefContext}\n` : ''}
${ctx.langText}

**[기술 스택]** (techStack 배열)
2025~2026년 기준 최신 안정 버전. 기존 환경(${ctx.tech})과의 호환 필수.
각 항목: category(frontend/backend/database/infra/auth/monitoring/testing), name, version, purpose(선택 이유)

**[API 설계]** (apiDesign 배열)
RESTful 표준. 최소 15개 이상의 실제 엔드포인트.
각 항목: method, path, description, auth(인증 필요 여부), requestBody(요청 본문 JSON 스키마 또는 설명, GET/DELETE는 생략 가능), responseBody(응답 본문 JSON 스키마 또는 설명), errorCodes(해당 엔드포인트의 에러 코드 배열, 예: ["400: 잘못된 입력", "404: 리소스 없음", "409: 중복 데이터"])

**[DB 스키마]** (databaseDesign 배열)
실제 테이블, 컬럼, 타입, 제약조건. 관계형 DB 기준.
각 항목: name, description, columns[{name, type, constraint}]

**[핵심 모듈 코드]** (keyModules 배열)
최소 5개 이상의 핵심 모듈. 실제 동작하는 코드 (pseudocode 금지).
- **중요**: keyModules 코드는 반드시 [기술 스택 레퍼런스]에 제공된 공식 문서의 최신 API 패턴을 따라 작성하세요. 구버전 패턴이나 deprecated API를 사용하지 마세요.
각 항목: name, description, file(경로), language, code

JSON 스키마:
{
  "techStack": [{"category":"string","name":"string","version":"string","purpose":"string"}],
  "apiDesign": [{"method":"string","path":"string","description":"string","auth":boolean,"requestBody":"string (optional)","responseBody":"string","errorCodes":["string"]}],
  "databaseDesign": [{"name":"string","description":"string","columns":[{"name":"string","type":"string","constraint":"string"}]}],
  "keyModules": [{"name":"string","description":"string","file":"string","language":"string","code":"string"}]
}

JSON만 출력하세요. 마크다운 코드 블록이나 추가 설명 없이 순수 JSON만 반환하세요.`;
}

// ════════════════════════════════════════════
// Claude provider implementations
// ════════════════════════════════════════════

async function generateDocumentsClaude(prompt: string): Promise<CallAResult> {
  const client = getClaudeClient();
  const stream = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 64000,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  let text = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      text += event.delta.text;
    }
  }

  return parseJsonResponse<CallAResult>(text, 'A-Claude');
}

async function generateTechSpecsClaude(prompt: string): Promise<CallBResult> {
  const client = getClaudeClient();
  const stream = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 64000,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  let text = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      text += event.delta.text;
    }
  }

  return parseJsonResponse<CallBResult>(text, 'B-Claude');
}

// ════════════════════════════════════════════
// Gemini provider implementations
// ════════════════════════════════════════════

const callASchemaGemini = {
  type: Type.OBJECT,
  properties: {
    prd: { type: Type.STRING },
    lld: { type: Type.STRING },
    projectStructure: { type: Type.STRING },
    sprintPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sprint: { type: Type.NUMBER },
          title: { type: Type.STRING },
          duration: { type: Type.STRING },
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
          dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['sprint', 'title', 'duration', 'goals', 'deliverables', 'dependencies'],
      },
    },
    deploymentPlan: { type: Type.STRING },
    testingStrategy: { type: Type.STRING },
  },
  required: ['prd', 'lld', 'projectStructure', 'sprintPlan', 'deploymentPlan', 'testingStrategy'],
};

const callBSchemaGemini = {
  type: Type.OBJECT,
  properties: {
    techStack: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          name: { type: Type.STRING },
          version: { type: Type.STRING },
          purpose: { type: Type.STRING },
        },
        required: ['category', 'name', 'version', 'purpose'],
      },
    },
    apiDesign: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          method: { type: Type.STRING },
          path: { type: Type.STRING },
          description: { type: Type.STRING },
          auth: { type: Type.BOOLEAN },
          requestBody: { type: Type.STRING },
          responseBody: { type: Type.STRING },
          errorCodes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['method', 'path', 'description', 'auth'],
      },
    },
    databaseDesign: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          columns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                constraint: { type: Type.STRING },
              },
              required: ['name', 'type', 'constraint'],
            },
          },
        },
        required: ['name', 'description', 'columns'],
      },
    },
    keyModules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          file: { type: Type.STRING },
          language: { type: Type.STRING },
          code: { type: Type.STRING },
        },
        required: ['name', 'description', 'file', 'language', 'code'],
      },
    },
  },
  required: ['techStack', 'apiDesign', 'databaseDesign', 'keyModules'],
};

async function generateDocumentsGemini(prompt: string): Promise<CallAResult> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: callASchemaGemini,
      maxOutputTokens: 65536,
    },
  });

  const text = response.text ?? '';
  return parseJsonResponse<CallAResult>(text, 'A-Gemini');
}

async function generateTechSpecsGemini(prompt: string): Promise<CallBResult> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: callBSchemaGemini,
      maxOutputTokens: 65536,
    },
  });

  const text = response.text ?? '';
  return parseJsonResponse<CallBResult>(text, 'B-Gemini');
}

// ════════════════════════════════════════════
// GPT provider implementations
// ════════════════════════════════════════════

async function generateDocumentsGPT(prompt: string): Promise<CallAResult> {
  const client = getOpenAiClient();
  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    max_tokens: 64000,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? '';
  return parseJsonResponse<CallAResult>(text, 'A-GPT');
}

async function generateTechSpecsGPT(prompt: string): Promise<CallBResult> {
  const client = getOpenAiClient();
  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    max_tokens: 64000,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? '';
  return parseJsonResponse<CallBResult>(text, 'B-GPT');
}

// ════════════════════════════════════════════
// Default empty results
// ════════════════════════════════════════════

const DEFAULT_CALL_A: CallAResult = {
  prd: '',
  lld: '',
  projectStructure: '',
  sprintPlan: [],
  deploymentPlan: '',
  testingStrategy: '',
};

const DEFAULT_CALL_B: CallBResult = {
  techStack: [],
  apiDesign: [],
  databaseDesign: [],
  keyModules: [],
};

// ════════════════════════════════════════════
// Main orchestrator: parallel Call A + Call B with fallback
// ════════════════════════════════════════════

export const generateImplementationPlan = async (
  userResponses: string[],
  lang: Language = Language.KO,
  additionalContext: string[] = [],
  timeline?: string,
): Promise<ImplementationPlanResult> => {
  const ctx = buildUserContext(userResponses, lang, additionalContext, timeline);
  const promptA = buildCallAPrompt(ctx);
  const promptB = buildCallBPrompt(ctx);

  const [resultA, resultB] = await Promise.all([
    callWithFallback<CallAResult>('Call-A', [
      { provider: 'claude', execute: () => generateDocumentsClaude(promptA), isAvailable: hasClaudeApiKey },
      { provider: 'gemini', execute: () => generateDocumentsGemini(promptA), isAvailable: hasGeminiApiKey },
      { provider: 'gpt', execute: () => generateDocumentsGPT(promptA), isAvailable: hasOpenAiApiKey },
    ], DEFAULT_CALL_A),
    callWithFallback<CallBResult>('Call-B', [
      { provider: 'claude', execute: () => generateTechSpecsClaude(promptB), isAvailable: hasClaudeApiKey },
      { provider: 'gemini', execute: () => generateTechSpecsGemini(promptB), isAvailable: hasGeminiApiKey },
      { provider: 'gpt', execute: () => generateTechSpecsGPT(promptB), isAvailable: hasOpenAiApiKey },
    ], DEFAULT_CALL_B),
  ]);

  const plan: ImplementationPlan = {
    prd: resultA.data.prd ?? '',
    lld: resultA.data.lld ?? '',
    projectStructure: resultA.data.projectStructure ?? '',
    sprintPlan: resultA.data.sprintPlan ?? [],
    deploymentPlan: resultA.data.deploymentPlan ?? '',
    testingStrategy: resultA.data.testingStrategy ?? '',
    techStack: resultB.data.techStack ?? [],
    apiDesign: resultB.data.apiDesign ?? [],
    databaseDesign: resultB.data.databaseDesign ?? [],
    keyModules: resultB.data.keyModules ?? [],
  };

  return {
    plan,
    modelUsed: { callA: resultA.modelUsed, callB: resultB.modelUsed },
    fallbackLog: { callA: resultA.fallbackLog, callB: resultB.fallbackLog },
  };
};

// ════════════════════════════════════════════
// JSON parser with multi-level recovery
// ════════════════════════════════════════════

function parseJsonResponse<T>(text: string, callLabel: string): T {
  // Step 1: Strip markdown code fences
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  // Step 2: Extract JSON object if surrounded by other text
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  // Step 3: Try direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (e1) {
    console.warn(`[${callLabel}] Direct JSON parse failed, attempting recovery...`, (e1 as Error).message);
  }

  // Step 4: Advanced truncated JSON recovery
  try {
    let fixed = cleaned;

    // Remove trailing commas before } or ]
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');

    // Count brackets
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      // Check if truncated inside a string literal
      let inString = false;
      for (let i = 0; i < fixed.length; i++) {
        if (fixed[i] === '\\' && inString) { i++; continue; }
        if (fixed[i] === '"') inString = !inString;
      }

      if (inString) {
        // Find position of last properly-closed string
        let quoteCount = 0;
        let lastClosedQuote = -1;
        for (let i = 0; i < fixed.length; i++) {
          if (fixed[i] === '\\') { i++; continue; }
          if (fixed[i] === '"') {
            quoteCount++;
            if (quoteCount % 2 === 0) lastClosedQuote = i;
          }
        }
        if (lastClosedQuote > 0) {
          fixed = fixed.slice(0, lastClosedQuote + 1);
        }
      }

      // Clean up partial key-value pairs at the end
      fixed = fixed.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
      fixed = fixed.replace(/,\s*$/, '');
      fixed = fixed.replace(/,\s*"[^"]*$/, '');
      fixed = fixed.replace(/,\s*$/, '');

      // Close remaining brackets/braces
      const ob = (fixed.match(/{/g) || []).length;
      const cb = (fixed.match(/}/g) || []).length;
      const oB = (fixed.match(/\[/g) || []).length;
      const cB = (fixed.match(/]/g) || []).length;
      for (let i = 0; i < oB - cB; i++) fixed += ']';
      for (let i = 0; i < ob - cb; i++) fixed += '}';
    }

    return JSON.parse(fixed) as T;
  } catch (e2) {
    console.warn(`[${callLabel}] Advanced recovery failed:`, (e2 as Error).message);
  }

  // Step 5: Last resort — extract individual fields
  try {
    const extractField = (field: string): string => {
      const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, 's');
      const match = cleaned.match(regex);
      return match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
    };

    const extractArray = (field: string): any[] => {
      const regex = new RegExp(`"${field}"\\s*:\\s*(\\[(?:[^\\[\\]]|\\[(?:[^\\[\\]]|\\[[^\\[\\]]*\\])*\\])*\\])`, 's');
      const match = cleaned.match(regex);
      if (match) {
        try { return JSON.parse(match[1]); } catch { return []; }
      }
      return [];
    };

    // Build partial result with whatever fields are available
    const partial: Record<string, any> = {};
    const stringFields = ['prd', 'lld', 'projectStructure', 'deploymentPlan', 'testingStrategy'];
    const arrayFields = ['techStack', 'apiDesign', 'databaseDesign', 'keyModules', 'sprintPlan'];

    for (const f of stringFields) {
      const val = extractField(f);
      if (val) partial[f] = val;
    }
    for (const f of arrayFields) {
      const val = extractArray(f);
      if (val.length > 0) partial[f] = val;
    }

    console.warn(`[${callLabel}] Recovered ${Object.keys(partial).length} fields via extraction`);
    return partial as T;
  } catch (e3) {
    console.error(`[${callLabel}] All recovery methods failed:`, (e3 as Error).message);
    console.error(`[${callLabel}] Response length:`, text.length, 'First 500 chars:', text.slice(0, 500));
    throw new Error(`${callLabel} 응답을 파싱할 수 없습니다.`);
  }
}
