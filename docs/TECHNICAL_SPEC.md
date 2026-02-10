# Project Architect: Technical Specification

이 문서는 시스템의 기술적 의존성, 파일 구조, 데이터 흐름 및 주요 구현 패턴을 정의합니다.

## 1. 기술 스택

| 구분 | 기술 | 버전/비고 |
|:---|:---|:---|
| **프레임워크** | React + TypeScript | React 19, TS 5.8 |
| **빌드 도구** | Vite | 6.2 |
| **AI SDK** | @google/genai | 1.12+ |
| **스타일링** | Tailwind CSS | v4 (CDN) |
| **다이어그램** | Mermaid.js | CDN (jsdelivr) |
| **패키지 관리** | npm | — |

## 2. AI 서비스 및 모델

| 기능 | 사용 모델 / 도구 | 기술적 특성 |
|:---|:---|:---|
| **설계 및 검색** | `gemini-3-pro-preview` | `googleSearch` 도구 활성화, JSON 스키마 응답, Grounding Metadata 추출 |
| **후속 질문 생성** | `gemini-3-flash-preview` | JSON 스키마 응답 (`responseMimeType: 'application/json'`) |
| **문서 분석** | `gemini-3-flash-preview` | 멀티파트 `inlineData` (PDF/텍스트 Base64) |
| **이미지 생성** | `gemini-2.5-flash-image` | 컨셉 기반 비주얼 로고 생성 (Base64 출력) |
| **음성 분석** | `gemini-2.5-flash-native-audio-preview-12-2025` | 네이티브 오디오 `inlineData` 컨텍스트 처리 |
| **실시간 통역** | `gemini-2.5-flash-native-audio-preview-12-2025` | Live API 세션, PCM 16kHz → 24kHz 스트리밍 |
| **자유 채팅** | `gemini-3-flash-preview` | 맥락 유지 단일 호출 |

## 3. 파일 구조

```
Architect-Build/
├── App.tsx                              # 메인 앱 (useReducer 상태 관리, Phase 흐름 제어)
├── index.tsx                            # React 엔트리포인트 (ErrorBoundary 래핑)
├── index.html                           # HTML + CDN(Tailwind, Mermaid) + CSP 메타 태그
├── types.ts                             # Message, Sender, Language 타입 정의
├── translations.ts                      # KO/EN 다국어 번역 리소스
├── vite.config.ts                       # Vite 설정 (환경변수 define 매핑)
├── package.json                         # 의존성 (react, react-dom, @google/genai)
├── tsconfig.json                        # TypeScript 설정
├── metadata.json                        # Google AI Studio 메타데이터
├── .env.local                           # GEMINI_API_KEY (로컬 실행용)
├── .gitignore
├── services/
│   ├── geminiService.ts                 # 핵심 AI 서비스 (설계/질문/분석/채팅)
│   └── liveTranslationService.ts        # 실시간 양방향 통역 (Live API)
├── components/
│   ├── ErrorBoundary.tsx                # React Error Boundary (앱 레벨 에러 포착)
│   ├── ChatBubble.tsx                   # 채팅 버블 (마크다운 볼드 지원)
│   ├── BotAvatar.tsx                    # AI 아바타
│   ├── MessageInput.tsx                 # 입력창 + 문서/음성 버튼
│   ├── DocumentModal.tsx                # PDF/텍스트 업로드 모달
│   ├── VoiceRecorderModal.tsx           # 음성 녹음 모달 (에러 상태 UI 표시)
│   ├── ResultPanel.tsx                  # 설계 결과 패널 (3탭: 로드맵/다이어그램/분석)
│   └── TranslationHub.tsx              # 실시간 통역 UI (언마운트 시 리소스 정리)
└── docs/
    ├── SYSTEM_SPECIFICATION.md          # 시스템 기능 명세
    └── TECHNICAL_SPEC.md                # 기술 사양 (본 문서)
```

## 4. 주요 데이터 흐름

### 4.1 5단계 진단 → Blueprint 생성 흐름

```
[Phase 0] 초기화
    ↓ dispatch SET_PHASE(1)
[Phase 1] 첫 질문 표시 (비즈니스 배경)
    ↓ 사용자 응답 → ADD_USER_RESPONSE + ADVANCE_PHASE
[Phase 2~5] AI 후속 질문 생성 (generateFollowUpQuestion)
    ↓ 각 단계별 userResponses[] 축적
[Phase 6] 설계 승인 대기
    ↓ "승인/yes/ok" 입력 → SET_PHASE(7)
[Phase 7] Blueprint 생성 (generateSolutionBlueprint)
    ├── Google Search Grounding → sources[]
    ├── Logo Generation → projectLogoBase64
    └── SET_BLUEPRINT + SET_PHASE(8)
[Phase 8] 완료 → 자유 채팅 모드 (generateContinuingChat)
```

### 4.2 멀티모달 입력 흐름

```
[문서/음성 업로드]
    ↓ analyzeDocument() 또는 analyzeAudio()
    ↓ 결과 → dispatch ADD_ADDITIONAL_CONTEXT
    ↓ (userResponses 인덱스에 영향 없음)
    ↓ additionalContext는 서비스 함수에 별도 파라미터로 전달
```

### 4.3 서비스 함수 시그니처

```typescript
// 모든 함수는 checkApiKey(lang) → 미설정 시 throw
analyzeDocument(data, mimeType, lang): Promise<string>
analyzeAudio(base64Data, mimeType, lang): Promise<string>
generateFollowUpQuestion(questionType, userResponses, lang, additionalContext?): Promise<FollowUpQuestion>
generateSolutionBlueprint(userResponses, lang, additionalContext?): Promise<SolutionBlueprint>
generateContinuingChat(userResponses, newMessage, lang, additionalContext?): Promise<string>
```

## 5. 주요 구현 패턴

### 5.1 상태 관리: useReducer + stateRef
```
AppState → useReducer(appReducer, initialState)
    ├── dispatch: 참조 안정성 보장 → useEffect 의존성 문제 해결
    └── stateRef: useCallback 내에서 최신 상태 참조
        → handleBotResponse는 deps=[]로 선언, stateRef.current로 상태 접근
```

### 5.2 에러 처리 계층
```
[서비스 계층] checkApiKey() → throw (사용자 친화적 메시지)
                             → JSON.parse try-catch → throw
                             → response.text null 안전 (?.trim() ?? '{}')
    ↓ throw
[컴포넌트 계층] try-catch-finally
    ├── catch → dispatch ADD_MESSAGE (에러 메시지)
    └── finally → dispatch SET_LOADING(false) 보장
    ↓ 렌더링 에러
[앱 계층] ErrorBoundary → getDerivedStateFromError → 복구 UI
```

### 5.3 검색 근거 추출 (Grounding)
`ai.models.generateContent` 응답의 `candidates[0].groundingMetadata.groundingChunks` 배열에서 웹 소스(Web Sources)를 필터링하여 UI에 전달합니다.

```typescript
const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
blueprint.sources = chunks?.filter(c => c.web).map(c => ({ title: c.web.title, uri: c.web.uri }));
```

### 5.4 이미지 처리
생성된 이미지는 별도의 서버 저장 없이 `inlineData`에서 추출된 Base64 문자열을 통해 `ResultPanel` 컴포넌트에서 즉시 렌더링됩니다.

```html
<img src="data:image/png;base64,${projectLogoBase64}" />
```

### 5.5 Mermaid 다이어그램 렌더링
- `textContent`로 차트 문자열 삽입 (XSS 방지)
- `window.mermaid` 존재 여부 확인 후 렌더링 시도
- 렌더링 실패 시 원본 텍스트 폴백 표시

### 5.6 LiveTranslator 리소스 관리
```
start() → API 키 검증 → GoogleGenAI 지연 초기화
       → AudioContext(24kHz 출력), AudioContext(16kHz 입력) 생성
       → MediaStream, ScriptProcessorNode 참조 저장
       → Live API 세션 연결

stop()  → session.close() (try-catch)
       → AudioBufferSourceNode 전체 정지
       → ScriptProcessorNode disconnect
       → MediaStream 트랙 정지
       → AudioContext(입력/출력) close
       → 모든 참조 null 초기화
```

## 6. 환경변수 설정

### 6.1 Google AI Studio
플랫폼이 API 키를 자동 주입합니다. 별도 설정 불필요.

### 6.2 로컬 실행
`.env.local` 파일에 Gemini API 키를 설정합니다:
```
GEMINI_API_KEY=your_api_key_here
```

`vite.config.ts`에서 `define`을 통해 `process.env.API_KEY`로 매핑됩니다:
```typescript
define: { 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY) }
```

## 7. 보안 설정

### 7.1 CSP (Content Security Policy)
`index.html`에 적용된 정책:
| 지시자 | 허용 대상 |
|:---|:---|
| `default-src` | 'self' |
| `script-src` | 'self', 'unsafe-inline', 'unsafe-eval', cdn.tailwindcss.com, cdn.jsdelivr.net |
| `style-src` | 'self', 'unsafe-inline' |
| `connect-src` | 'self', generativelanguage.googleapis.com, *.googleapis.com |
| `img-src` | 'self', data:, blob: |
| `media-src` | 'self', blob: |
| `font-src` | 'self', data: |

### 7.2 XSS 방지
- Mermaid 렌더링: `textContent` 사용 (innerHTML 미사용)
- ChatBubble: `renderFormattedText`에서 제한된 마크다운만 파싱 (**bold** 지원)

## 8. 데이터 타입 정의

### 8.1 핵심 인터페이스 (types.ts)
```typescript
enum Sender { USER = 'user', BOT = 'bot' }
enum Language { KO = 'ko', EN = 'en' }
interface Message { id: string; text: ReactNode; sender: Sender }
interface DocumentContext { fileName?: string; content: string; type: 'pdf' | 'text' }
```

### 8.2 서비스 인터페이스 (geminiService.ts)
```typescript
interface FollowUpQuestion { question: string; examples: string[]; suggestion: string }
interface GroundingSource { title: string; uri: string }
interface SolutionBlueprint {
  roadmap: string[];
  architectureDiagram: string;   // Mermaid
  sequenceDiagram: string;       // Mermaid
  techStackGraph: string;        // Mermaid
  analysisSummary: string;
  estimatedROI: string;
  securityStrategy: string;
  projectLogoBase64?: string;    // AI 생성 로고 (Base64)
  sources?: GroundingSource[];   // 검색 근거
}
type EnterpriseQuestionType = 'COMPANY_CONTEXT' | 'SOLUTION_MODEL' | 'MODULE_LOGIC' | 'TECH_INTEGRATION' | 'BUSINESS_GOAL'
```

### 8.3 앱 상태 (App.tsx)
```typescript
interface AppState {
  messages: Message[];
  isLoading: boolean;
  chatPhase: number;             // 0(초기) ~ 8(완료)
  userResponses: string[];       // 단계별 응답 [배경, 모델, 프로세스, 기술, 목표]
  additionalContext: string[];   // 문서/음성 분석 결과 (별도 관리)
  blueprint: SolutionBlueprint | null;
  showGuide: boolean;
  lang: Language;
}
```
