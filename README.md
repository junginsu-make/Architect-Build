# Architect - Enterprise Builder

기업의 비즈니스 요구사항을 다각도로 분석하여 **클라이언트용 비즈니스 제안서**와 **개발자용 전문 설계 문서**(PRD, LLD, 스프린트 계획)를 동시에 생성하는 멀티모델 AI 워크벤치입니다. 실시간 시장 데이터를 반영한 기획서 수준의 산출물을 제공합니다.

**플랫폼**: Vite + React 19 + TypeScript  
**상태**: PoC (Proof of Concept)

---

## 핵심 기능

- **5단계 비즈니스 진단**: 채팅 또는 양식(Intake Form)으로 비즈니스 배경, 시스템 모델, 업무 프로세스, 기술 환경, KPI 목표를 수집 후 Blueprint 생성
- **실시간 시장 지능**: Google Search Grounding으로 최신 업계 동향·경쟁사·ROI 반영, 설계 근거(Citations) 제공
- **멀티모달 입력**: 텍스트 채팅, PDF/장문 텍스트 업로드, 음성 녹음(회의록 자동 생성)
- **실시간 양방향 통역**: Gemini Live API 기반 한국어/영어 음성 통역
- **이중 뷰 산출물**: 클라이언트 제안서 (비즈니스 중심) + 개발자 문서 (PRD/LLD/스프린트/API/DB/코드)
- **Blueprint 산출물**: 실행 로드맵, Mermaid 아키텍처/시퀀스/기술스택 다이어그램, 분석 요약, ROI 추정, 보안 전략, 검색 근거 URL
- **결과 내보내기**: HTML 보고서, ZIP (구조화 폴더), JSON, 인쇄
- **다국어**: 한국어(KO) / 영어(EN) UI 및 응답

---

## 기술 스택

| 구분 | 기술 |
|:---|:---|
| 프론트엔드 | React 19, TypeScript 5.8, Vite 6 |
| 상태 관리 | Zustand |
| 스타일 | Tailwind CSS v4 |
| AI | @google/genai (Gemini), @anthropic-ai/sdk (Claude) |
| 영속화 | Dexie (IndexedDB) |
| 다이어그램 | Mermaid.js |
| 기타 | jszip |

에이전트 레이어는 `agents/`에서 BaseAgent 확장 및 스케줄러/레지스트리로 구성됩니다. 설계 생성은 `ArchitectBlueprintAgent`가 Gemini 서비스를 호출합니다.

---

## 프로젝트 구조 (요약)

```
Architect-Build/
  App.tsx                 # 메인 앱 (채팅/양식 전환, 가이드, 결과 패널)
  hooks/useChat.tsx       # 채팅·Blueprint 트리거 로직
  store/                  # Zustand: chatStore, uiStore, deliverableStore, projectStore
  agents/                 # BaseAgent, ArchitectBlueprintAgent, 스케줄러·레지스트리
  components/             # ChatBubble, MessageInput, ResultPanel, IntakeForm, DocumentModal, VoiceRecorderModal, TranslationHub 등
  services/                # geminiService, liveTranslationService, claudeService, gdriveService, reportGenerator 등
  db/                      # Dexie 기반 database, operations
  types/                    # 공통 타입 및 에이전트·산출물 타입
  docs/                     # SYSTEM_SPECIFICATION.md, TECHNICAL_SPEC.md, BUILD_AGENT_DESIGN_REPORT.md
```

---

## 로컬 실행

**필수**: Node.js

1. 의존성 설치  
   `npm install`

2. 환경 변수
   프로젝트 루트에 `.env.local`을 만들고 API 키를 설정합니다.
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key  # 선택 — 미설정 시 Gemini 단독 동작
   ```

3. 개발 서버 실행  
   `npm run dev`

4. (선택) 프로덕션 빌드  
   `npm run build`  
   `npm run preview`

---

## 문서

- [시스템 명세](docs/SYSTEM_SPECIFICATION.md): 기능, AI 모델 활용, 보안, 제약 및 로드맵
- [기술 사양](docs/TECHNICAL_SPEC.md): 데이터 흐름, 구현 패턴, 환경 변수, CSP
- [Build Agent 설계 보고서](docs/BUILD_AGENT_DESIGN_REPORT.md): 에이전트 아키텍처 및 산출물 체계

---

## 라이선스

Private repository.
