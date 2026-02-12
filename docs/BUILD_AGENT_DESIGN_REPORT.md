# Build Agent 시스템 - 종합 설계 보고서

> Architect Enterprise Builder의 멀티모델 AI 에이전트 시스템 현황 및 설계 방향
> 최종 업데이트: 2026-02-12

---

## 1. 시스템 비전

```
클라이언트 <── 제안서/기대효과 ── 담당자(사용자) ── 기술명세/코드 ──> 개발자
                                       |
                               Architect System
                         (Gemini + Claude 멀티모델 병렬 생성)
```

**핵심 가치**: 비기술자인 담당자가 음성/문서/텍스트를 입력하면, AI가 양쪽(클라이언트/개발자) 모두에게 전달할 수 있는 전문 산출물을 자동 생성합니다.

---

## 2. 현재 아키텍처 (Phase A 완료)

### 2.1 3계층 구조

```
+-- UI Layer ------------------------------------------------+
|  App.tsx → ChatPanel / IntakeForm → ResultPanel             |
|  (클라이언트 뷰 + 개발자 4탭 뷰)                               |
+--------------------------+---------------------------------+
                           |
+-- Service Layer ---------v---------------------------------+
|  useChat (오케스트레이터)                                     |
|  ├── geminiService.ts (Gemini 비즈니스 분석)                  |
|  ├── claudeService.ts (Claude 구현 설계)                     |
|  ├── reportGenerator.ts (HTML 보고서 생성)                   |
|  └── liveTranslationService.ts (실시간 통역)                 |
|                                                            |
|  Agent Framework (스켈레톤)                                  |
|  ├── BaseAgent / AgentRegistry / PipelineScheduler          |
|  └── architectBlueprint.agent.ts                           |
+--------------------------+---------------------------------+
                           |
+-- Persistence Layer -----v---------------------------------+
|  Zustand (메모리 상태) + Dexie.js (IndexedDB 영속 저장)       |
+------------------------------------------------------------+
```

### 2.2 멀티모델 병렬 생성

```
Phase 7 Blueprint 생성:

  ┌─────────────────────────────────────────┐
  │           useChat (오케스트레이터)          │
  │                                         │
  │   Promise.allSettled([                   │
  │     ┌─────────────────────┐             │
  │     │ Gemini 3 Pro        │ → SolutionBlueprint      │
  │     │ (비즈니스 분석)        │   + ClientProposal      │
  │     └─────────────────────┘             │
  │     ┌─────────────────────┐             │
  │     │ Claude Sonnet 4.5   │ → ImplementationPlan     │
  │     │ (구현 설계)           │   (PRD/LLD/Sprint/Code) │
  │     └─────────────────────┘             │
  │   ])                                    │
  │                                         │
  │   → deliverableStore.setBlueprint()     │
  └─────────────────────────────────────────┘
```

---

## 3. 입력 시스템

### 3.1 다중 입력 방식

| 입력 방식 | 분석 모델 | 결과 형식 |
|:---|:---|:---|
| **채팅 (5단계 진단)** | Gemini Flash (후속 질문) | userResponses[] |
| **구조화 양식 (IntakeForm)** | — (파일 첨부 시 Gemini 2.5 Flash) | userResponses[] + additionalContext |
| **다중 파일 업로드** (최대 10개, 20MB/파일) | Gemini 2.5 Flash (Vision) | `DocumentAnalysis` JSON |
| **지원 포맷** | PDF, JPG, PNG, GIF, WebP, BMP, TIFF | 이미지 내 텍스트/표/수치 추출 |
| **장문 텍스트 붙여넣기** | Gemini 2.5 Flash | `DocumentAnalysis` JSON |
| **음성 녹음** (5초~30분) | Gemini 2.5 Flash | `MeetingMinutes` JSON |

### 3.2 문서/회의록 → 블루프린트 자동 변환

분석된 `designKeywords`(background, model, process, tech, goal)가 userResponses에 자동 매핑되어 즉시 블루프린트 생성 가능:
- "문서 기반으로 설계 시작" → DocumentAnalysis의 designKeywords 매핑
- "회의록 기반으로 설계 시작" → MeetingMinutes의 designKeywords 매핑

### 3.3 5대 설계 영역

| 영역 | 설명 | Phase |
|:---|:---|:---:|
| COMPANY_CONTEXT | 비즈니스 배경/문제 | 1 |
| SOLUTION_MODEL | 희망 시스템 모델 | 2 |
| MODULE_LOGIC | 사용자 및 업무 흐름 | 3 |
| TECH_INTEGRATION | 기술 환경/제약 | 4 |
| BUSINESS_GOAL | 성공 지표/KPI | 5 |

---

## 4. 양방향 산출물

### 4.1 클라이언트용 (ClientProposal)

기술 용어 없이 비즈니스 가치 중심으로 작성. 검증되지 않은 가상 수치 금지.

| 항목 | 설명 |
|:---|:---|
| 문제 정의 | 현재 겪는 비즈니스 문제 |
| 해결 방안 | 쉬운 표현으로 작성된 솔루션 개요 |
| 핵심 기능 체크리스트 | 주요 기능 목록 |
| 추진 일정 | 마일스톤 타임라인 (phase/duration/outcome) |
| 기대 효과 | 정성적 표현 (가상 수치 금지) |
| 데이터 보호 방안 | 보안/프라이버시 전략 |
| 투자 대비 효과 요약 | 정성적 ROI 설명 |

### 4.2 개발자용 (ImplementationPlan + 다이어그램)

20년+ 시니어 아키텍트 수준의 전문 문서. 4탭 구조:

| 탭 | 내용 |
|:---|:---|
| **로드맵** | 스프린트 카드 (목표/산출물/의존성/기간) 또는 단계별 로드맵 |
| **아키텍처** | Mermaid 다이어그램 (시스템/시퀀스/기술스택) |
| **구현** | 프로젝트 구조, 기술 스택 테이블, API 명세, DB 스키마, 핵심 코드 모듈 |
| **문서** | PRD (8개 섹션), LLD (8개 섹션) 마크다운 전문 |

### 4.3 내보내기 시스템

| 형식 | 설명 |
|:---|:---|
| **클라이언트 보고서 (HTML)** | 독립 HTML 파일 — 브라우저에서 열거나 PDF 저장 가능 |
| **개발자 문서 (HTML)** | PRD/LLD/스프린트/API/DB 포함 독립 HTML |
| **클라이언트용 인쇄** | 새 창에서 콘텐츠만 열어 인쇄 (브라우저 UI 미포함) |
| **개발자용 인쇄** | 새 창에서 전문 문서만 열어 인쇄 |
| **ZIP 전체 다운로드** | 구조화된 폴더 (client/, developer/, diagrams/) |
| **JSON 원본** | blueprint 전체 데이터 |

ZIP 구조:
```
architect-blueprint.zip
├── blueprint.json
├── client/
│   ├── proposal.md
│   └── proposal.html
├── developer/
│   ├── prd.md
│   ├── lld.md
│   ├── sprint-plan.md
│   ├── api-spec.md
│   ├── db-schema.md
│   ├── implementation.json
│   └── full-report.html
├── diagrams/
│   ├── architecture.mmd
│   ├── sequence.mmd
│   └── tech-stack.mmd
└── report.md
```

---

## 5. 기술 스택

### 5.1 핵심 스택

| 카테고리 | 선택 | 역할 |
|:---|:---|:---|
| 프레임워크 | React 19 + TypeScript 5.8 | UI 렌더링 |
| 빌드 | Vite 6.2 | HMR + 빌드 |
| AI (비즈니스) | @google/genai + Gemini | 분석/설계/채팅 |
| AI (구현) | @anthropic-ai/sdk + Claude | PRD/LLD/코드 |
| 상태 관리 | Zustand 5.x | 4개 독립 스토어 |
| DB | Dexie.js 4.3 | IndexedDB 영속 저장 |
| ZIP | JSZip 3.10 | 구조화된 내보내기 |
| CSS | @tailwindcss/vite 4.x | 빌드타임 CSS |
| 다이어그램 | Mermaid.js CDN | 아키텍처/시퀀스/ERD |

### 5.2 프론트엔드 전용 아키텍처

현재 백엔드 없이 프론트엔드만으로 핵심 기능의 100% 구현:
- AI API 직접 호출 (클라이언트 사이드)
- IndexedDB로 프로젝트 영속 저장
- HTML 보고서 클라이언트 사이드 생성
- ZIP 파일 클라이언트 사이드 생성

---

## 6. 에이전트 프레임워크 (스켈레톤 구축 완료)

### 6.1 현재 구현 상태

Phase A에서 에이전트 프레임워크의 기반 구조가 구축되었습니다:

| 파일 | 역할 | 상태 |
|:---|:---|:---|
| `agents/base.ts` | BaseAgent 추상 클래스 (execute → run 패턴) | 구현 완료 |
| `agents/registry.ts` | AgentRegistry 싱글톤 (register/get/getDependencyOrder) | 구현 완료 |
| `agents/scheduler.ts` | PipelineScheduler (DAG 기반 Promise.allSettled) | 구현 완료 |
| `agents/definitions/architectBlueprint.agent.ts` | 기존 generateSolutionBlueprint 래핑 | 구현 완료 |

### 6.2 향후 에이전트 확장 계획 (Phase B)

```
Layer 1 (병렬): meeting-minutes | document-analysis | market-research
       |
Layer 2 (병렬): tech-spec | cost-estimate
       |
Layer 3 (병렬): architecture-diagram | sequence-diagram | erd-generator
       |
Layer 4 (병렬): client-brief | code-scaffold | executive-summary
```

새 에이전트 추가: BaseAgent 상속 파일 1개 + registry 등록 1줄

---

## 7. 마이그레이션 로드맵

### Phase A: 기반 구축 (완료)
- [x] types/ 분리 (common, project, agent, deliverable, intake)
- [x] Zustand 4개 스토어 도입 (chatStore, uiStore, deliverableStore, projectStore)
- [x] Dexie.js IndexedDB 연동
- [x] Tailwind CDN → @tailwindcss/vite 빌드 통합
- [x] agents/ 기반 구조 (base, registry, scheduler)
- [x] useChat 훅 추출 (App.tsx 344줄 → ~125줄)
- [x] Claude Sonnet 4.5 구현 설계 엔진 연동
- [x] 클라이언트/개발자 이중 뷰 ResultPanel
- [x] 독립 HTML 보고서 생성 (reportGenerator)
- [x] 구조화된 ZIP 내보내기 (JSZip)
- [x] 구조화된 문서 분석 (DocumentAnalysis JSON)
- [x] 구조화된 회의록 시스템 (MeetingMinutes JSON)
- [x] 문서/회의록 → 블루프린트 자동 변환
- [x] IntakeForm 구조화 양식 시스템
- [x] 음성 녹음 안정성 개선 (5초~30분, 자동 정지)
- [x] 보안 강화: Mermaid `securityLevel: 'strict'` 적용
- [x] 보안 강화: CSP `connect-src`에 `api.anthropic.com` 추가
- [x] 보안 강화: Gemini `systemInstruction` 분리 (프롬프트 인젝션 방어)
- [x] 보안 강화: Phase 6 승인 정확 매칭 (`^...$` 앵커)
- [x] 로고 생성 기능 제거 (Gemini Flash Image 호출 삭제, 전 소스/문서 정리)
- [x] 다중 파일 업로드 (최대 10개, PDF/이미지 7종 지원)
- [x] 이미지 비전 분석 (Gemini 2.5 Flash Vision — 슬라이드/발표자료 텍스트/수치 추출)
- [x] 대용량 PDF 2단계 분석 (>5MB: 원시 추출 → 구조화 JSON)
- [x] AI 기반 분석 병합 (4+ 파일 결과 지능적 통합)
- [x] 양식(Form) 탭 파일 첨부 기능
- [x] 전체 11개 Gemini API 호출 maxOutputTokens 명시적 설정
- [x] 오디오/문서 분석 모델 gemini-2.0-flash → gemini-2.5-flash 업그레이드

### Phase B: 에이전트 마이그레이션 (예정)
- [ ] geminiService.ts → Sub Agent 분리
- [ ] SuperAIAgent 구현 (의도 분류 + 파이프라인 계획)
- [ ] P1/P2/P3 우선순위 자동 분류
- [ ] 적응형 진단 흐름 (INTAKE → TRIAGE → DEEP_DIVE → CONFIRMATION → GENERATION)

### Phase C: 확장 기능 (예정)
- [ ] PDF 다운로드 (html2pdf 또는 서버사이드)
- [ ] 이메일 발송 (emailService 구현)
- [ ] Google Drive 저장 (gdriveService 구현)
- [ ] Mermaid CDN → 빌드 통합
- [ ] 프록시 서버 도입 (API 키 보안)

### Phase D: 신규 에이전트 + 고급 기능 (예정)
- [ ] CodeScaffold, ERD, n8n 워크플로우 생성
- [ ] 기업 분석 + 웹 서치 강화
- [ ] 프로젝트 버전 관리 + 피드백 루프
- [ ] 멀티 디바이스 동기화 (클라우드 DB)
- [ ] OAuth/SSO 인증

---

## 8. 리스크 및 대응

| 리스크 | 현재 대응 |
|:---|:---|
| Gemini API 비용 초과 | Flash 우선 사용, Pro는 설계 시에만 |
| Claude API 미설정 | Graceful fallback (Gemini 단독 동작) |
| IndexedDB 데이터 손실 | JSON 내보내기 + ZIP 다운로드 |
| 가상 수치 신뢰성 문제 | 프롬프트에 가상 수치 금지 규칙 적용 |
| 대용량 PDF/음성 처리 | PDF 20MB/파일 제한, 음성 30분 제한, >5MB PDF는 2단계 분석 |
| 다중 파일 병합 품질 | 4+ 파일은 AI 기반 통합 병합, 실패 시 단순 병합 폴백 |
| 출력 토큰 잘림 | 전체 11개 Gemini 호출에 maxOutputTokens 명시적 설정 (8192~65536) |
| Preview 모델 변경 | GA 모델 출시 시 전환 |
| API 키 클라이언트 노출 | Phase C에서 프록시 서버 도입 예정 |
| 프롬프트 인젝션 | systemInstruction 분리로 사용자 데이터 격리 |
| XSS (Mermaid) | securityLevel: 'strict' + textContent 사용 |
| Phase 6 오인식 | 정확 매칭 (^...$) 앵커 적용 |
