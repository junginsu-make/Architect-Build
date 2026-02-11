# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Architect Enterprise Builder — a multi-model AI workbench that analyzes business requirements through a 5-phase diagnostic chat flow and generates dual outputs: a **client-facing business proposal** and **developer technical documents** (PRD, LLD, sprint plans). Korean/English bilingual. Currently at PoC stage.

## Commands

```bash
npm run dev      # Vite dev server on port 3000 (--force cache bypass)
npm run build    # Production build
npm run preview  # Preview production build
```

No test framework is configured. No linter is configured.

## Environment Variables

Defined in `.env.local` at project root (loaded by Vite's `loadEnv` from `.`):

- `GEMINI_API_KEY` — Required. Exposed as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` via Vite `define`.
- `ANTHROPIC_API_KEY` — Optional. Falls back to empty string; Claude features degrade gracefully via `hasClaudeApiKey()`.

API keys are injected at build time through `vite.config.ts` `define` — they are **not** runtime env vars.

## Architecture

### Three-Layer Structure

```
UI Layer (React components)
    ↓
Orchestration Layer (useChat hook + services)
    ↓
Persistence Layer (Zustand stores + Dexie/IndexedDB)
```

### Core Data Flow: 5-Phase Diagnostic → Parallel Generation

1. **Phases 1–5**: `useChat.tsx` drives a multi-turn chat collecting business background, solution model, process logic, tech environment, and KPI goals. Each phase calls `geminiService.generateFollowUpQuestion()`.
2. **Phase 6**: Approval checkpoint with exact-match regex validation (`^확인$|^승인$|^Approve$|^Confirm$`).
3. **Phase 7**: Parallel generation via `Promise.allSettled`:
   - Gemini (`generateSolutionBlueprint`) → client proposal + blueprint with Google Search grounding
   - Claude (`generateImplementationPlan`) → PRD/LLD/sprint/API/DB design (graceful skip if no API key)
4. **Phase 8**: Free-form chat continuation maintaining full context.

### State Management — 4 Zustand Stores

- `chatStore` — messages, isLoading, chatPhase, userResponses[], additionalContext
- `uiStore` — lang (KO/EN), showGuide, activePanel, intakeMode
- `deliverableStore` — blueprint (SolutionBlueprint), isExporting
- `projectStore` — projects CRUD (backed by Dexie IndexedDB)

Stores are independent (no cross-store dependencies). Access via `useChatStore()`, `useUIStore()`, etc.

### AI Model Usage

| Model | Purpose | Service Function |
|---|---|---|
| `gemini-3-pro-preview` | Blueprint generation with Google Search grounding | `generateSolutionBlueprint` |
| `gemini-3-flash-preview` | Follow-up questions, document analysis, free chat | `generateFollowUpQuestion`, `analyzeDocument`, `generateContinuingChat` |
| `gemini-2.0-flash` | Audio/meeting minutes analysis | `analyzeAudio` |
| `gemini-2.5-flash-native-audio` | Live bidirectional translation | `liveTranslationService` |
| `claude-sonnet-4-5-20250929` | Implementation plan (PRD/LLD/code) | `generateImplementationPlan` |

### Key Patterns

**stateRef pattern in useChat**: A `useRef` syncs with current state each render so `deps=[]` callbacks always access latest values without re-subscribing.

**Gemini JSON responses**: Several Gemini calls use `responseMimeType: 'application/json'` with `responseSchema` for structured output.

**Mermaid diagrams**: Rendered client-side via CDN (`cdn.jsdelivr.net`). Security: `securityLevel: 'strict'` + `textContent` (never `innerHTML`). Three diagram types: system architecture, sequence, tech-stack.

**Markdown in chat**: ChatBubble uses limited custom parsing (bold/italic only) — not a full markdown renderer.

**Agent framework** (`agents/`): DAG-based with `BaseAgent` abstract class, `AgentRegistry` (singleton with topological sort), and `PipelineScheduler` (Promise.allSettled). Currently only `ArchitectBlueprintAgent` is registered.

### Dual-View Output (ResultPanel.tsx)

The largest component (~745 lines) renders two tabs:
- **Client View**: Business-oriented proposal (problem/solution/features/milestones/ROI/security)
- **Developer View**: 4 sub-tabs — Roadmap, Architecture (Mermaid diagrams), Implementation (project structure/API/DB/modules), Documents (full PRD/LLD markdown)

### Export System (DownloadManager.tsx)

Supports HTML reports (separate client/developer), ZIP (structured folders with blueprint.json), JSON raw export, and print (new window with A4 page breaks).

## Path Aliases

`@/*` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`).

## i18n

All UI strings are in `translations.ts` as a `Record<Language, Record<string, string>>` object (KO/EN). AI responses are also language-aware via `lang` parameter passed to all service functions.

## Stubs (Not Yet Implemented)

- `services/emailService.ts` — placeholder for future email delivery
- `services/gdriveService.ts` — placeholder for future Google Drive integration
- No backend/proxy server — all API calls are direct from browser (CSP-controlled)
