# Architect: Enterprise & Agent Builder - System Specification

## 1. 개요 (Overview)
**Architect**는 기업의 비즈니스 요구사항을 다각도로 분석하여 실제 구현 가능한 엔터프라이즈 솔루션 설계도와 실행 로드맵을 생성하는 AI 기반의 솔루션 빌더입니다. 최신 시장 데이터와 시각적 브랜딩 요소를 결합하여 압도적인 퀄리티의 기획서를 제공합니다.

> **플랫폼**: Google AI Studio 기반 / Vite + React 19 + TypeScript
> **상태**: PoC (Proof of Concept) — 프로토타입 단계

## 2. 핵심 기능 (Key Features)

### 2.1 5단계 비즈니스 진단 프로세스 (Chat Phase)
사용자와의 대화를 통해 비즈니스 배경, 시스템 모델, 모듈 로직, 기술 환경, KPI 목표를 파악합니다.

| Phase | 진단 영역 | 동작 방식 |
|:---:|:---|:---|
| 01 | 비즈니스 배경 및 문제점 | 사용자 직접 입력 (텍스트/문서/음성) |
| 02 | 희망 시스템 모델 (SaaS, App, Bot 등) | AI 맥락 기반 후속 질문 자동 생성 |
| 03 | 사용 주체 및 업무 프로세스 | AI 맥락 기반 후속 질문 자동 생성 |
| 04 | 현재 도구 및 기술 환경 | AI 맥락 기반 후속 질문 자동 생성 |
| 05 | 최종 비즈니스 목표 (KPI) | AI 맥락 기반 후속 질문 자동 생성 |
| 06 | 설계 시작 승인 | 사용자 확인 후 Blueprint 생성 |

각 후속 질문에는 AI가 생성한 **예시 답변**과 **Tip**이 함께 제공됩니다.

### 2.2 실시간 시장 지능 (Market Intelligence)
- **Google Search Grounding**: `gemini-3-pro-preview` 모델이 실시간 검색을 수행하여 최신 업계 동향, 경쟁사 분석 및 실질적인 ROI 수치를 설계에 반영합니다.
- **Grounding Citations**: 제안된 전략의 근거가 되는 웹 사이트 링크를 보고서 하단에 즉시 제공하여 신뢰성을 확보합니다.

### 2.3 시각적 아이덴티티 생성 (Visual Identity)
- **Project Logo Generation**: `gemini-2.5-flash-image` 모델을 활용하여 제안된 솔루션의 컨셉에 맞는 전문적인 프로젝트 로고를 자동으로 생성하고 보고서에 포함합니다.
- 로고 생성 실패 시에도 Blueprint는 정상 반환됩니다 (격리된 에러 처리).

### 2.4 멀티모달 입력
| 입력 방식 | 설명 | 분석 모델 |
|:---|:---|:---|
| **텍스트 입력** | 채팅 형태 직접 입력 | — |
| **PDF 업로드** | 사업 기획서, ERD 등 | `gemini-3-flash-preview` |
| **장문 텍스트 붙여넣기** | 요구사항 문서 복사/붙여넣기 | `gemini-3-flash-preview` |
| **음성 녹음** | 회의 녹음 → 비즈니스 회의록 자동 생성 | `gemini-2.5-flash-native-audio` |

문서/음성 분석 결과는 `additionalContext`로 분리 관리되어, 사용자의 단계별 응답(`userResponses`) 인덱스에 영향을 주지 않습니다.

### 2.5 AI 실시간 양방향 통역 (Live Translator)
- **Gemini Live API** 기반의 실시간 한국어 ↔ 영어 음성 통역.
- PCM 오디오 스트리밍으로 저지연 양방향 통역 지원.
- 발화 원문과 번역문이 텍스트로 동시 표시됩니다.
- 화면 우하단 플로팅 버튼으로 활성화/비활성화.

### 2.6 솔루션 설계도 (Blueprint) 산출물
승인 후 AI가 생성하는 산출물 목록:

| 산출물 | 형식 | 설명 |
|:---|:---|:---|
| 실행 로드맵 | 텍스트 리스트 | 단계별 구현 계획 |
| 아키텍처 다이어그램 | Mermaid.js | 시스템 구조도 |
| 시퀀스 다이어그램 | Mermaid.js | 사용자 흐름 |
| 기술 스택 그래프 | Mermaid.js | 기술 의존성 시각화 |
| 분석 요약 | 텍스트 | Executive Summary |
| ROI 추정 | 텍스트 | 시장 데이터 기반 투자 수익률 |
| 보안 전략 | 텍스트 | 보안/컴플라이언스 방안 |
| 프로젝트 로고 | PNG (Base64) | AI 생성 비주얼 아이덴티티 |
| 검색 근거 | URL 리스트 | Google Search 출처 링크 |

### 2.7 결과 내보내기
- **JSON 추출**: Blueprint 전체 데이터를 `architect-blueprint.json` 파일로 다운로드.
- **보고서 인쇄**: 브라우저 인쇄 기능으로 결과 패널 출력.

### 2.8 다국어 지원
- 한국어(KO) / 영어(EN) 전환 지원 (헤더 버튼).
- UI 텍스트 및 AI 응답 언어가 함께 전환됩니다.

### 2.9 자유 채팅 모드
- Blueprint 생성 완료(Phase 8) 후, 설계 결과에 대한 추가 질문 및 상담이 가능합니다.
- 기존 비즈니스 맥락과 추가 컨텍스트가 포함된 상태에서 대화가 이어집니다.

## 3. AI 모델 활용 명세

| 작업 (Task) | 사용 모델 | 주요 특징 |
|:---|:---|:---|
| **솔루션 설계** | `gemini-3-pro-preview` | **Google Search 연동**, JSON 스키마 응답, Grounding Metadata 추출 |
| **비주얼 생성** | `gemini-2.5-flash-image` | 프로젝트 컨셉 로고 실시간 생성 (Base64 출력) |
| **후속 질문 생성** | `gemini-3-flash-preview` | 맥락 기반 질문 + 예시 + 팁 JSON 구조 생성 |
| **문서 분석** | `gemini-3-flash-preview` | PDF/텍스트 멀티파트 컨텍스트 처리 |
| **음성 분석** | `gemini-2.5-flash-native-audio-preview-12-2025` | 네이티브 오디오 컨텍스트 → 회의록 생성 |
| **실시간 통역** | `gemini-2.5-flash-native-audio-preview-12-2025` | Live API 세션, PCM 16kHz 입력 / 24kHz 출력 |
| **자유 채팅** | `gemini-3-flash-preview` | 설계 완료 후 후속 상담 |

## 4. 상태 관리 아키텍처

### 4.1 useReducer 기반 중앙 상태 관리
`App.tsx`에서 `useReducer`를 사용하여 모든 앱 상태를 단일 리듀서로 관리합니다.

```
AppState {
  messages[]          — 채팅 메시지 목록
  isLoading           — AI 처리 중 여부
  chatPhase           — 현재 진단 단계 (0~8)
  userResponses[]     — 단계별 사용자 응답 (인덱스 기반)
  additionalContext[] — 문서/음성 분석 결과 (분리 저장)
  blueprint           — 생성된 설계도
  showGuide           — 가이드 패널 표시 여부
  lang                — 현재 언어 (KO/EN)
}
```

`dispatch`의 참조 안정성을 활용하여 `useEffect` 의존성 문제를 해결하고, `stateRef` 패턴으로 콜백 내에서 최신 상태를 안전하게 참조합니다.

### 4.2 에러 처리 전략
- **서비스 계층**: 모든 함수에서 `checkApiKey()` 호출 후 `throw` 기반 에러 전파.
- **컴포넌트 계층**: 모든 서비스 호출에 `try-catch-finally` 적용, `isLoading` 상태 보장.
- **앱 계층**: `ErrorBoundary` 컴포넌트로 예기치 않은 렌더링 에러 포착 및 복구 UI 제공.

## 5. 보안

### 5.1 Content Security Policy (CSP)
`index.html`에 CSP 메타 태그가 적용되어 허용된 도메인만 스크립트/연결을 허용합니다.

### 5.2 XSS 방지
Mermaid 다이어그램 렌더링 시 `innerHTML` 대신 `textContent`를 사용하여 AI 생성 문자열의 스크립트 주입을 방지합니다.

### 5.3 API 키 보호
- Google AI Studio 내부 실행 시 플랫폼이 API 키를 자동 주입합니다.
- 로컬 실행 시 `.env.local`의 `GEMINI_API_KEY`가 Vite define을 통해 `process.env.API_KEY`로 매핑됩니다.
- API 키 미설정 시 모듈 크래시 대신 각 함수에서 사용자 친화적 에러 메시지를 반환합니다.

### 5.4 민감 정보 보호
사용자의 비즈니스 배경 데이터 중 민감 정보는 검색 쿼리에서 제외되도록 프롬프트 가이드라인이 설정되어 있습니다.

## 6. 기대 효과 (Impact)
1. **데이터 기반 의사결정**: 학습 데이터가 아닌 현재 시점의 시장 데이터를 기반으로 설계합니다.
2. **시각적 몰입감**: 로고와 다이어그램이 결합된 보고서로 프로젝트의 실체감을 높입니다.
3. **전문성 확보**: 근거 자료(Citations)를 통해 기획서의 객관적 타당성을 증명합니다.
4. **접근성**: 텍스트, 문서, 음성 등 다양한 입력 방식으로 비기술 사용자도 쉽게 활용 가능합니다.
5. **글로벌 대응**: 한국어/영어 전환 및 실시간 통역으로 다국어 비즈니스 환경을 지원합니다.

## 7. 제약 사항 및 로드맵
| 현재 제약 | 향후 개선 방향 |
|:---|:---|
| 데이터 영속성 없음 (새로고침 시 소실) | DB/LocalStorage 연동 |
| Preview 모델 의존 (변경/폐기 위험) | GA 모델로 전환 |
| 백엔드 부재 (API 키 클라이언트 노출) | 프록시 서버 도입 |
| 인증/권한 체계 없음 | OAuth/SSO 연동 |
| 고정된 5단계 선형 흐름 | 단계 이동/수정/건너뛰기 지원 |
| Mermaid 구문 오류 가능성 | 다이어그램 검증/재생성 로직 |
| PDF/인쇄만 지원 | DOCX/PPT 내보내기, 공유 링크 |
