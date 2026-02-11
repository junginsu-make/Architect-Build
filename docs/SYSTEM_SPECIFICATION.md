# Architect: Enterprise Builder - System Specification

## 1. 개요 (Overview)
**Architect**는 기업의 비즈니스 요구사항을 다각도로 분석하여 **클라이언트용 비즈니스 제안서**와 **개발자용 전문 설계 문서**(PRD, LLD, 스프린트 계획)를 동시에 생성하는 멀티모델 AI 워크벤치입니다.

> **플랫폼**: Vite 6.2 + React 19 + TypeScript 5.8
> **AI 엔진**: Google Gemini (비즈니스 분석) + Anthropic Claude Sonnet 4.5 (구현 설계)
> **상태 관리**: Zustand v5 + Dexie.js (IndexedDB)

## 2. 핵심 기능 (Key Features)

### 2.1 5단계 비즈니스 진단 프로세스

| Phase | 진단 영역 | 동작 방식 |
|:---:|:---|:---|
| 01 | 비즈니스 배경 및 문제점 | 사용자 직접 입력 (텍스트/문서/음성) |
| 02 | 희망 시스템 모델 (SaaS, App, Bot 등) | AI 맥락 기반 후속 질문 자동 생성 |
| 03 | 사용 주체 및 업무 프로세스 | AI 맥락 기반 후속 질문 자동 생성 |
| 04 | 현재 도구 및 기술 환경 | AI 맥락 기반 후속 질문 자동 생성 |
| 05 | 최종 비즈니스 목표 (KPI) | AI 맥락 기반 후속 질문 자동 생성 |
| 06 | 수집 데이터 요약 + 설계 승인 | 사용자 확인/수정 후 생성 시작 |
| 07 | Gemini + Claude 병렬 생성 | 클라이언트 제안서 + 개발자 문서 동시 생성 |
| 08 | 완료 → 자유 채팅 모드 | 설계 결과에 대한 추가 질문/수정 |

### 2.2 멀티모델 AI 엔진

| 역할 | 모델 | 산출물 |
|:---|:---|:---|
| **비즈니스 분석** | Gemini 3 Pro | 로드맵, 다이어그램, 보안 전략, 클라이언트 제안서 |
| **구현 설계** | Claude Sonnet 4.5 | PRD, LLD, 스프린트 계획, API 설계, DB 스키마, 핵심 코드 모듈 |
| **후속 질문** | Gemini 3 Flash | 맥락 기반 질문 + 예시 + 팁 |
| **문서 분석** | Gemini 3 Flash | 구조화된 문서 분석 (JSON) |
| **음성 분석** | Gemini 2.0 Flash | 구조화된 회의록 (JSON) |
| **자유 채팅** | Gemini 3 Flash | 설계 후 후속 상담 |
| **실시간 통역** | Gemini 2.5 Flash Native Audio | Live API 한국어 ↔ 영어 |

Claude API 키가 없으면 Gemini 단독으로 동작합니다 (graceful fallback).

### 2.3 클라이언트/개발자 이중 뷰

#### 클라이언트용 (비개발자)
기술 용어 없이 비즈니스 가치 중심으로 작성:
- 현재 겪는 문제 정의
- 해결 방안 (쉬운 표현)
- 핵심 기능 체크리스트
- 추진 일정 (마일스톤 타임라인)
- 기대 효과 (검증되지 않은 가상 수치 금지)
- 투자 대비 효과 요약
- 데이터 보호 방안

#### 개발자용 (4탭 구조)
20년+ 시니어 아키텍트 수준의 전문 문서:
- **로드맵**: 스프린트 카드 (목표/산출물/의존성) 또는 단계별 로드맵
- **아키텍처**: Mermaid 다이어그램 (시스템/시퀀스/기술스택)
- **구현**: 프로젝트 구조, 기술 스택, API 테이블, DB 스키마, 핵심 코드 모듈
- **문서**: PRD (8개 섹션), LLD (8개 섹션) 마크다운 전문

### 2.4 멀티모달 입력

| 입력 방식 | 분석 모델 | 결과 형식 |
|:---|:---|:---|
| **텍스트 입력** | — | 직접 userResponses에 저장 |
| **PDF 업로드** (최대 20MB) | `gemini-3-flash-preview` | `DocumentAnalysis` JSON |
| **장문 텍스트 붙여넣기** | `gemini-3-flash-preview` | `DocumentAnalysis` JSON (text part 직접 전송) |
| **음성 녹음** (5초~30분) | `gemini-2.0-flash` | `MeetingMinutes` JSON |

모든 분석 결과는 구조화된 JSON으로 반환됩니다:
- **DocumentAnalysis**: 문서 요약, 5대 핵심 영역, 핵심 발견 사항, 데이터 갭, 설계 키워드
- **MeetingMinutes**: 회의 제목, 요약, 주요 논의 사항, 요구사항, 후속 조치, 설계 키워드

사용자가 "문서 기반으로 설계 시작" 또는 "회의록 기반으로 설계 시작"을 입력하면 분석된 designKeywords를 자동 매핑하여 즉시 블루프린트를 생성합니다.

### 2.5 내보내기 시스템

| 기능 | 설명 |
|:---|:---|
| **클라이언트 보고서 (HTML)** | 독립 HTML 파일 — 브라우저에서 열거나 PDF 저장 가능 |
| **개발자 문서 (HTML)** | PRD/LLD/스프린트/API/DB 포함 독립 HTML |
| **클라이언트용 인쇄** | 새 창에서 결과 콘텐츠만 열어 인쇄 |
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

### 2.6 AI 실시간 양방향 통역
- Gemini Live API 기반 실시간 한국어 ↔ 영어 음성 통역
- PCM 오디오 스트리밍 (16kHz 입력 / 24kHz 출력)
- 플로팅 버튼으로 활성화/비활성화

### 2.7 다국어 지원
한국어(KO) / 영어(EN) 전환 지원. UI 텍스트 및 AI 응답 언어가 함께 전환됩니다.

## 3. 상태 관리 아키텍처

### 3.1 Zustand 스토어 구조

| 스토어 | 역할 |
|:---|:---|
| `chatStore` | messages, isLoading, chatPhase, userResponses, additionalContext |
| `uiStore` | lang, showGuide, activePanel |
| `deliverableStore` | blueprint, isExporting |
| `projectStore` | projects, currentProjectId, CRUD |

### 3.2 커스텀 훅
- `useChat()`: 전체 채팅 흐름 관리 (5단계 진단, 문서/음성 처리, 블루프린트 생성, 자유 채팅)
- `stateRef` 패턴으로 콜백 내 최신 상태 안전 참조

## 4. 보안

### 4.1 API 키 보호
- Gemini: `.env.local`의 `GEMINI_API_KEY` → Vite define → `process.env.API_KEY`
- Claude: `.env.local`의 `ANTHROPIC_API_KEY` → Vite define → `process.env.ANTHROPIC_API_KEY`
- API 키 미설정 시 해당 서비스만 비활성화 (앱 전체 크래시 없음)

### 4.2 XSS 방지
- Mermaid 렌더링: `securityLevel: 'strict'` + `textContent` 사용
- ChatBubble: 제한된 마크다운만 파싱

### 4.3 프롬프트 인젝션 방어
- Gemini 서비스 함수에서 `config.systemInstruction`으로 AI 지시문과 사용자 데이터를 격리
- 사용자 입력이 시스템 프롬프트 컨텍스트에 직접 삽입되지 않음

### 4.4 Phase 6 설계 승인 검증
- 정확 매칭(`^...$` 앵커) 적용으로 부분 일치 오인식 방지
- 허용된 확인 키워드만 정확히 일치할 때 생성 단계 진행

### 4.5 클라이언트 보고서 수치 정책
클라이언트 보고서에 검증되지 않은 가상 수치(%, 금액, 배수, 회수 기간)를 포함하지 않습니다. "업무 효율화 증가", "운영 비용 절감 기대" 등 정성적 표현만 사용합니다.

## 5. 제약 사항 및 로드맵

| 현재 상태 | 향후 개선 방향 |
|:---|:---|
| Dexie.js (IndexedDB) 로컬 저장 | 클라우드 동기화 |
| Preview 모델 의존 | GA 모델로 전환 |
| 백엔드 부재 (API 키 클라이언트 노출) | 프록시 서버 도입 |
| 인증/권한 체계 없음 | OAuth/SSO 연동 |
| PDF 다운로드 미구현 | html2pdf 또는 서버사이드 PDF 생성 |
| 이메일 발송 / Google Drive 미구현 | Phase C에서 구현 |
