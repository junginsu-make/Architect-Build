import { getClaudeClient, hasClaudeApiKey } from "./claudeClient";
import { Language } from "../types/common";
import { findRelevantDocs, formatDocsForPrompt } from "./techReference";

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
  requestBody?: string;   // JSON schema or description of request body
  responseBody?: string;   // JSON schema or description of response
  errorCodes?: string[];   // e.g., ["400: Invalid input", "404: Not found"]
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

export { hasClaudeApiKey };

export const generateImplementationPlan = async (
  userResponses: string[],
  lang: Language = Language.KO,
  additionalContext: string[] = [],
  timeline?: string,
): Promise<ImplementationPlan> => {
  const client = getClaudeClient();
  const [background, model, process, tech, goal] = userResponses;
  const matchedDocs = findRelevantDocs(tech);
  const techRefContext = formatDocsForPrompt(matchedDocs);
  const langText = lang === Language.KO
    ? "모든 내용을 한국어로 작성하세요. 코드 주석도 한국어로."
    : "Write everything in English.";

  const prompt = `당신은 20년 이상 경력의 시니어 소프트웨어 아키텍트이자 테크 리드입니다.
아래 요구사항을 기반으로 **주니어 개발자도 이 문서만 보고 구현할 수 있을 수준**의 개발 문서를 JSON으로 작성하세요.

[사용자 요구사항]
1. 비즈니스 배경: ${background}
2. 희망 시스템 모델: ${model}
3. 상세 업무 프로세스: ${process}
4. 기존 기술 환경/제약: ${tech}
5. 최종 KPI 목표: ${goal}
${additionalContext.length > 0 ? `\n[추가 컨텍스트]\n${additionalContext.join('\n')}` : ''}
${timeline ? `\n[개발 일정 제약]\n희망 완료 시점: ${timeline}\n\n**절대 규칙**: 일정이 아무리 짧더라도 시스템의 기능, 구조, 모듈, API, DB 스키마를 절대 줄이거나 생략하지 마세요. 모든 설계 내용은 동일하게 유지하되, 스프린트 기간만 압축하세요.\n- 필요하면 스프린트를 1일, 2일, 3일 단위로 나눠도 됩니다.\n- 병렬 개발 가능한 작업은 동시 진행으로 계획하세요.\n- 로드맵의 모든 단계를 지정된 기간 내에 배치하세요.` : ''}
${techRefContext ? `\n[기술 스택 레퍼런스 — 공식 문서 기반]\n아래는 사용자의 기술 환경에 매칭되는 공식 문서의 최신 패턴입니다. 코드 생성 시 반드시 이 패턴을 참고하세요:\n\n${techRefContext}\n` : ''}
${langText}

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

**[기술 스택]** (techStack 배열)
2025~2026년 기준 최신 안정 버전. 기존 환경(${tech})과의 호환 필수.
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

**[스프린트 계획]** (sprintPlan 배열)
${timeline ? `사용자 희망 일정(${timeline}) 내에 완료할 수 있도록 스프린트를 구성하세요. 일정이 매우 짧더라도 기능을 빼지 말고 스프린트 단위를 1일~3일로 줄여서라도 모든 기능을 포함하세요. 병렬 진행 가능한 작업은 같은 스프린트에 배치하세요.` : '2주 단위 스프린트.'} 각 스프린트별:
- sprint(번호), title(스프린트 목표), duration("기간: YYYY.MM.DD ~ YYYY.MM.DD" — 일정 제약에 따라 1일~2주 유동적)
- goals(해당 스프린트 목표 목록), deliverables(산출물), dependencies(선행 조건)

**[배포 계획]** (deploymentPlan 필드, 마크다운)
사용자의 기술 환경(${tech})에 맞춰 구체적으로 작성하세요:
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
  "techStack": [{"category":"string","name":"string","version":"string","purpose":"string"}],
  "apiDesign": [{"method":"string","path":"string","description":"string","auth":boolean,"requestBody":"string (optional)","responseBody":"string","errorCodes":["string"]}],
  "databaseDesign": [{"name":"string","description":"string","columns":[{"name":"string","type":"string","constraint":"string"}]}],
  "keyModules": [{"name":"string","description":"string","file":"string","language":"string","code":"string"}],
  "sprintPlan": [{"sprint":number,"title":"string","duration":"string","goals":["string"],"deliverables":["string"],"dependencies":["string"]}],
  "deploymentPlan": "string (마크다운)",
  "testingStrategy": "string (마크다운)"
}

JSON만 출력하세요. 마크다운 코드 블록이나 추가 설명 없이 순수 JSON만 반환하세요.`;

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

  return parseClaudeResponse(text);
};

function parseClaudeResponse(text: string): ImplementationPlan {
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
    return JSON.parse(cleaned) as ImplementationPlan;
  } catch (e1) {
    console.warn('[Claude] Direct JSON parse failed, attempting recovery...', (e1 as Error).message);
  }

  // Step 4: Fix common JSON issues — truncated strings, trailing commas
  try {
    let fixed = cleaned;
    // Remove trailing commas before } or ]
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    // Try to close unclosed strings/arrays/objects (truncated response)
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    // If truncated, try to close the JSON
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      // Check if we're inside an unclosed string
      const lastQuote = fixed.lastIndexOf('"');
      const afterLastQuote = fixed.slice(lastQuote + 1).trim();
      if (afterLastQuote === '' || afterLastQuote.endsWith(',') || afterLastQuote.endsWith(':')) {
        // Truncated inside a string value — close it
        fixed = fixed.slice(0, lastQuote + 1);
        if (afterLastQuote.endsWith(':')) {
          fixed += '""';
        }
      }
      // Remove any trailing comma
      fixed = fixed.replace(/,\s*$/, '');
      // Close remaining brackets/braces
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    }
    return JSON.parse(fixed) as ImplementationPlan;
  } catch (e2) {
    console.error('[Claude] JSON recovery failed:', (e2 as Error).message);
    console.error('[Claude] Response length:', text.length, 'First 500 chars:', text.slice(0, 500));
    throw new Error('Claude 응답을 파싱할 수 없습니다.');
  }
}
