# Build Agent 시스템 - 종합 설계 보고서

> 4개 전문 에이전트(아키텍처, UX/워크플로우, 기술스택, 산출물)의 분석을 종합한 결과입니다.
> 작성일: 2026-02-10

---

## 1. 시스템 비전 요약

```
클라이언트 <-- 제안서/ROI --- 담당자(사용자) --- 기술명세/코드 --> 개발자
                                    |
                            Build Agent System
                          (SuperAIAgent + Sub Agents)
```

**핵심 가치**: 비기술자인 담당자가 음성/문서/텍스트를 입력하면, AI가 양쪽(클라이언트/개발자) 모두에게 전달할 수 있는 전문 산출물을 자동 생성합니다.

---

## 2. 아키텍처

### 2.1 3계층 구조

```
+-- UI Layer ------------------------------------------------+
|  ProjectDashboard -> WorkbenchView -> DeliverableViewer     |
+--------------------------+---------------------------------+
                           |
+-- Orchestration Layer ---v---------------------------------+
|  SuperAIAgent                                              |
|  +-- Intent Classifier (의도 분류)                          |
|  +-- Pipeline Planner (실행 계획)                           |
|  +-- Agent Scheduler (병렬 실행 - Promise.allSettled)       |
|  +-- Result Aggregator (결과 병합)                          |
|                                                            |
|  Sub Agent Registry (플러그인 구조)                          |
|  +-- meeting-minutes    +-- tech-spec                      |
|  +-- document-analysis  +-- architecture-diagram           |
|  +-- market-research    +-- client-brief                   |
|  +-- code-scaffold      +-- cost-estimate                  |
|  +-- (새 에이전트: 파일 1개 + 등록 1줄)                      |
+--------------------------+---------------------------------+
                           |
+-- Persistence Layer -----v---------------------------------+
|  IndexedDB (Dexie.js) - 프로젝트 단위 영속 저장             |
+------------------------------------------------------------+
```

### 2.2 에이전트 의존성 DAG (병렬 실행 순서)

```
Layer 1 (병렬): meeting-minutes | document-analysis | market-research
       |
Layer 2 (병렬): tech-spec | cost-estimate
       |
Layer 3 (병렬): architecture-diagram | sequence-diagram | erd-generator
       |
Layer 4 (병렬): client-brief | code-scaffold | executive-summary
```

---

## 3. 입력 우선순위 시스템

### 3.1 P1/P2/P3 자동 분류

| 등급 | 이름 | 설계 반영도 | 예시 |
|:---|:---|:---|:---|
| **P1** | 필수 반영 (Must) | 100% 직접 반영 | "물류회사, 실시간 배차 시스템 필요" |
| **P2** | 참조 (Reference) | 조건부 반영 | "현재 엑셀로 관리, 드라이버 30명" |
| **P3** | 배경 (Context) | 맥락 참고만 | "설립 15년, 연 매출 30억" |

### 3.2 적응형 진단 흐름

```
INTAKE (자유 입력) -> TRIAGE (자동 분류+갭 분석) -> DEEP_DIVE (부족한 영역만 질문) -> CONFIRMATION -> GENERATION
```

### 3.3 5대 설계 영역

- BUSINESS_PROBLEM: 비즈니스 배경/문제
- SYSTEM_MODEL: 희망 시스템 모델
- USER_WORKFLOW: 사용자 및 업무 흐름
- TECH_ENVIRONMENT: 기술 환경/제약
- SUCCESS_CRITERIA: 성공 지표/KPI

### 3.4 능동적 질문 우선순위

- **BLOCKER**: 이것 없이는 설계 불가 -> 반드시 답변 필요
- **IMPORTANT**: 없으면 퀄리티 저하 -> 답변 권장
- **NICE_TO_HAVE**: 기본값으로 진행 가능 -> 스킵 가능

---

## 4. 양방향 산출물

### 4.1 3-Layer 산출물

| 산출물 | 대상 | 형식 |
|:---|:---|:---|
| Executive Summary | 클라이언트 | PDF |
| 비즈니스 제안서 (ROI/경쟁사 분석) | 클라이언트 | PDF |
| 프로젝트 타임라인 | 클라이언트 | Mermaid Gantt |
| 기술 명세서 (API/DB/인프라) | 개발자 | Markdown |
| 아키텍처/시퀀스/ERD 다이어그램 | 개발자 | Mermaid |
| 코드 스캐폴딩 | 개발자 | ZIP |
| n8n 워크플로우 JSON | 개발자 | JSON |
| SOP 운영 문서 | 개발자 | Markdown |
| 회의록 | 내부 | Markdown |
| 프로젝트 추적/피드백 이력 | 내부 | 대시보드 |

### 4.2 ResultPanel 확장

```
[클라이언트용]  [개발자용]  [프로젝트 관리]
    +- 요약       +- Tech Spec    +- 회의록
    +- 제안서     +- 아키텍처     +- 진행현황
    +- 타임라인   +- 코드베이스   +- 피드백
    +- ROI        +- n8n 워크플로  +- 버전이력
                  +- SOP
```

---

## 5. 기술 스택

### 5.1 핵심 스택

| 카테고리 | 선택 | 번들 크기 |
|:---|:---|:---|
| 프레임워크 | React 19 + TypeScript | 유지 |
| 빌드 | Vite 6.2 | 유지 |
| AI | @google/genai + Gemini | 유지 |
| 상태 관리 | Zustand 5.x | ~2KB |
| DB | Dexie.js 4.3 | ~29KB |
| PDF | pdfmake | ~588KB (지연로딩) |
| DOCX | docx | 중간 (지연로딩) |
| ZIP | JSZip | ~12KB |
| CSS | @tailwindcss/vite | 빌드타임 |

### 5.2 프론트엔드 vs 백엔드

- 프론트엔드만으로 핵심 기능의 90% 구현 가능
- 백엔드 필요: API 키 보안, 멀티 디바이스 동기화, 팀 협업

---

## 6. 파일 구조

```
Architect-Build/
+-- types/
|   +-- project.ts
|   +-- agent.ts
|   +-- deliverable.ts
|   +-- ui.ts
|   +-- index.ts
+-- store/
|   +-- projectStore.ts
|   +-- agentStore.ts
|   +-- deliverableStore.ts
|   +-- uiStore.ts
+-- db/
|   +-- database.ts
+-- agents/
|   +-- superAgent.ts
|   +-- scheduler.ts
|   +-- registry.ts
|   +-- base.ts
|   +-- definitions/
|       +-- meetingMinutes.agent.ts
|       +-- techSpec.agent.ts
|       +-- clientBrief.agent.ts
|       +-- codeScaffold.agent.ts
|       +-- ...
+-- services/
|   +-- geminiClient.ts
|   +-- liveTranslationService.ts
+-- hooks/
|   +-- useProject.ts
|   +-- useAgentPipeline.ts
|   +-- useDeliverables.ts
+-- components/
|   +-- project/
|   +-- workbench/
|   +-- deliverables/
|   +-- input/
|   +-- translation/
+-- docs/
    +-- BUILD_AGENT_DESIGN_REPORT.md
    +-- SYSTEM_SPECIFICATION.md
    +-- TECHNICAL_SPEC.md
```

---

## 7. 마이그레이션 로드맵

### Phase A: 기반 구축
- types/ 분리, Zustand 도입, Dexie.js 연동
- Tailwind CDN -> 빌드 통합
- agents/ 기반 구조 (registry, base, scheduler)

### Phase B: 에이전트 마이그레이션
- geminiService.ts -> Sub Agent 분리
- SuperAIAgent 구현
- P1/P2/P3 우선순위 시스템
- 적응형 진단 흐름

### Phase C: UI 전환
- ProjectDashboard, WorkbenchView
- DeliverableViewer (3-뷰)
- 내보내기 (PDF/DOCX/ZIP)

### Phase D: 신규 에이전트 + 고급 기능
- CodeScaffold, ERD, n8n 워크플로우 생성
- 기업 분석 + 웹 서치 강화
- 버전 관리 + 피드백 루프

---

## 8. 리스크 및 대응

| 리스크 | 대응 |
|:---|:---|
| Gemini API 비용 초과 | 에이전트별 토큰 한도, Flash 우선 |
| n8n JSON 생성 품질 | 템플릿 기반 + 핵심 노드 15개 제한 |
| IndexedDB 데이터 손실 | persist() + JSON 내보내기 |
| 한국어 PDF 폰트 | Noto Sans KR 임베딩 |
| Preview 모델 변경 | GA 모델 출시 시 전환 |
