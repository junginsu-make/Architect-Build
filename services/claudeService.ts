import { getClaudeClient, hasClaudeApiKey } from "./claudeClient";
import { Language } from "../types/common";

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
  additionalContext: string[] = []
): Promise<ImplementationPlan> => {
  const client = getClaudeClient();
  const [background, model, process, tech, goal] = userResponses;
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
다음 섹션을 반드시 포함:
- 1. 시스템 아키텍처 상세 설명 (텍스트로 각 레이어의 역할과 통신 방식)
- 2. 모듈 상세 설계: 각 모듈의 책임, 인터페이스, 데이터 흐름
- 3. 데이터 모델 상세: ERD 설명, 각 테이블 관계와 인덱스 전략
- 4. API 명세 상세: 각 엔드포인트의 요청/응답 스키마, 에러 코드
- 5. 인증/인가 설계: 인증 흐름, 토큰 관리, 권한 체계
- 6. 에러 처리 전략: 에러 분류, 로깅, 모니터링
- 7. 성능 최적화 전략: 캐싱, 인덱싱, 쿼리 최적화
- 8. 보안 설계: OWASP Top 10 대응, 데이터 암호화, 입력 검증

**[프로젝트 구조]** (projectStructure 필드)
실제 디렉토리 트리. 각 폴더와 주요 파일의 역할을 주석으로 포함.

**[기술 스택]** (techStack 배열)
2025~2026년 기준 최신 안정 버전. 기존 환경(${tech})과의 호환 필수.
각 항목: category(frontend/backend/database/infra/auth/monitoring/testing), name, version, purpose(선택 이유)

**[API 설계]** (apiDesign 배열)
RESTful 표준. 최소 15개 이상의 실제 엔드포인트.
각 항목: method, path, description, auth(인증 필요 여부)

**[DB 스키마]** (databaseDesign 배열)
실제 테이블, 컬럼, 타입, 제약조건. 관계형 DB 기준.
각 항목: name, description, columns[{name, type, constraint}]

**[핵심 모듈 코드]** (keyModules 배열)
최소 5개 이상의 핵심 모듈. 실제 동작하는 코드 (pseudocode 금지).
각 항목: name, description, file(경로), language, code

**[스프린트 계획]** (sprintPlan 배열)
2주 단위 스프린트. 각 스프린트별:
- sprint(번호), title(스프린트 목표), duration("2주: YYYY.MM.DD ~ YYYY.MM.DD")
- goals(해당 스프린트 목표 목록), deliverables(산출물), dependencies(선행 조건)

**[배포 계획]** (deploymentPlan 필드, 마크다운)
CI/CD 파이프라인, 환경 구성(dev/staging/prod), 무중단 배포, 롤백 전략

**[테스트 전략]** (testingStrategy 필드, 마크다운)
단위/통합/E2E 테스트, 도구 선택, 커버리지 목표, QA 프로세스

JSON 스키마:
{
  "prd": "string (전체 PRD 마크다운 문서)",
  "lld": "string (전체 LLD 마크다운 문서)",
  "projectStructure": "string (디렉토리 트리)",
  "techStack": [{"category":"string","name":"string","version":"string","purpose":"string"}],
  "apiDesign": [{"method":"string","path":"string","description":"string","auth":boolean}],
  "databaseDesign": [{"name":"string","description":"string","columns":[{"name":"string","type":"string","constraint":"string"}]}],
  "keyModules": [{"name":"string","description":"string","file":"string","language":"string","code":"string"}],
  "sprintPlan": [{"sprint":number,"title":"string","duration":"string","goals":["string"],"deliverables":["string"],"dependencies":["string"]}],
  "deploymentPlan": "string (마크다운)",
  "testingStrategy": "string (마크다운)"
}

JSON만 출력하세요. 마크다운 코드 블록이나 추가 설명 없이 순수 JSON만 반환하세요.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ImplementationPlan;
  } catch {
    throw new Error('Claude 응답을 파싱할 수 없습니다.');
  }
};
