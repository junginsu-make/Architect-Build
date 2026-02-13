import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { useDeliverableStore } from '../store/deliverableStore';
import { Sender, Language } from '../types/common';
import { translations } from '../translations';
import {
  generateSolutionBlueprint,
  generateFollowUpQuestion,
  generateGapFillingQuestion,
  analyzeDocument,
  analyzeMultipleDocuments,
  analyzeAudio,
  generateContinuingChat,
  type EnterpriseQuestionType,
  type MeetingMinutes,
  type DocumentAnalysis,
  type FileEntry,
} from '../services/geminiService';
import { generateImplementationPlan, type ImplementationPlanResult } from '../services/claudeService';
import type { ModelProvider } from '../services/fallbackChain';
import { generateFrontendDesignPlan } from '../services/frontendDesignService';

const QUESTION_TYPES: EnterpriseQuestionType[] = [
  'SOLUTION_MODEL',
  'MODULE_LOGIC',
  'TECH_INTEGRATION',
  'BUSINESS_GOAL',
];

const SECTION_LABELS = ['비즈니스 배경', '시스템 모델', '업무 프로세스', '기술 환경', '성공 지표'];

// Reactive translation wrapper — re-renders when language changes in the store
type TStrings = (typeof translations)[Language.KO];
function T({ render }: { render: (t: TStrings) => ReactNode }) {
  const lang = useUIStore((s) => s.lang);
  return <>{render(translations[lang])}</>;
}

/** Detect if user input looks like a general question rather than a diagnostic answer */
function isGeneralQuestion(text: string): boolean {
  const t = text.trim();
  if (/[?？]\s*$/.test(t)) return true;
  if (/(?:인가요|나요|할까요|뭔가요|뭐야|뭐예요|뭐죠|건가요|을까요|ㄹ까요|ㄴ가요)\s*$/.test(t)) return true;
  return false;
}

export function useChat() {
  const {
    messages,
    isLoading,
    chatPhase,
    userResponses,
    additionalContext,
    addMessage,
    setLoading,
    setPhase,
    addUserResponse,
    addAdditionalContext,
  } = useChatStore();

  const lang = useUIStore((s) => s.lang);
  const setBlueprint = useDeliverableStore((s) => s.setBlueprint);

  const gapFillingRef = useRef({
    active: false,
    count: 0,
    dataGaps: [] as string[],
    designKeywords: null as { background: string; model: string; process: string; tech: string; goal: string } | null,
  });
  const timelineRef = useRef({ asked: false, response: '' });

  const stateRef = useRef({ chatPhase, userResponses, additionalContext, lang });
  stateRef.current = { chatPhase, userResponses, additionalContext, lang };

  // Core: run a specific phase with explicitly passed data
  const runBotPhase = useCallback(
    async (
      phase: number,
      responses: string[],
      context: string[],
      currentLang: Language,
    ) => {
      const currentT = translations[currentLang];
      setLoading(true);
      try {
        switch (phase) {
          case 1: {
            addMessage(
              <T render={(t) =>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase">{t.analysisStart}</span>
                    <div className="h-px flex-grow bg-blue-50"></div>
                  </div>
                  <h2 className="text-lg font-black text-blue-900 leading-tight">{t.phase1Title}</h2>
                  <p className="text-gray-700 text-xs leading-relaxed">{t.phase1Desc}</p>
                  <p className="text-xs text-blue-500 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {t.phase1Tip}
                  </p>
                  <div className="grid grid-cols-1 gap-2 py-2">
                    {t.steps.map((step: string, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border ${i === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 opacity-60'}`}>
                        <span className={`font-black text-xs ${i === 0 ? 'text-blue-600' : 'text-slate-400'}`}>0{i + 1}</span>
                        <span className={`text-xs font-bold ${i === 0 ? 'text-blue-900' : 'text-slate-500'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
                    <p className="font-bold text-white mb-1 text-xs flex items-center gap-2">
                      <span className="animate-pulse">●</span> {t.questionPrefix + ' 01'}
                    </p>
                    <p className="text-blue-50 text-sm font-medium">{t.startPrompt}</p>
                  </div>
                </div>
              } />,
              Sender.BOT,
            );
            break;
          }
          case 2:
          case 3:
          case 4:
          case 5: {
            const response = await generateFollowUpQuestion(
              QUESTION_TYPES[phase - 2],
              responses,
              currentLang,
              context,
            );
            addMessage(
              <T render={(t) =>
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase">
                      {t.stepPrefix + ' ' + String(phase).padStart(2, '0') + ' / 05'}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 leading-snug">{response.question}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {response.examples.map((ex: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        {ex}
                      </div>
                    ))}
                  </div>
                  {response.suggestion && (
                    <div className="mt-2 p-4 bg-yellow-50/50 rounded-xl text-xs text-yellow-800 italic border border-yellow-100 leading-relaxed">
                      <span className="font-bold mr-1">{t.tip}</span> {response.suggestion}
                    </div>
                  )}
                </div>
              } />,
              Sender.BOT,
            );
            break;
          }
          case 6: {
            // Message 1: Collected data summary
            addMessage(
              <T render={(t) =>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-900 text-xs mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                    </svg>
                    {t.collectedSummary}
                  </h4>
                  <div className="space-y-3">
                    {t.sectionLabels.map((label: string, i: number) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5">{i + 1}</span>
                        <div className="flex-grow min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                          <p className="text-xs text-slate-700 leading-relaxed break-words">{responses[i] || t.notEntered}</p>
                        </div>
                      </div>
                    ))}
                    {context.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t.additionalContextLabel}</p>
                        <p className="text-xs text-slate-500">{context.length + t.docsReflected}</p>
                      </div>
                    )}
                  </div>
                </div>
              } />,
              Sender.BOT,
            );
            // Message 2: Timeline question (prominent, like a step)
            addMessage(
              <T render={(t) =>
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase">
                      {t.stepPrefix + ' 06'}
                    </span>
                    <div className="h-px flex-grow bg-blue-50"></div>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
                    <p className="font-bold text-white mb-1 text-xs flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      {t.timelineQuestion}
                    </p>
                    <p className="text-blue-100 text-xs font-medium">{t.timelineExamples}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {['3' + (t.timelineExampleMonths || '개월'), '6' + (t.timelineExampleMonths || '개월'), t.timelineExampleAsap || '가능한 빨리'].map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        {ex}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-4 bg-yellow-50/50 rounded-xl text-xs text-yellow-800 italic border border-yellow-100 leading-relaxed">
                    <span className="font-bold mr-1">{t.tip}</span> {t.timelineSkipHint}
                  </div>
                </div>
              } />,
              Sender.BOT,
            );
            break;
          }
          case 7: {
            addMessage(
              <T render={(t) =>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span className="animate-pulse">●</span>
                    {t.geminiGenerating}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <span className="animate-pulse">●</span>
                    {t.implGenerating}
                  </div>
                </div>
              } />,
              Sender.BOT,
            );

            const timeline = timelineRef.current.response || undefined;
            const geminiPromise = generateSolutionBlueprint(responses, currentLang, context, timeline);
            const implPromise = generateImplementationPlan(responses, currentLang, context, timeline);

            // Await Gemini first — both promises already running in parallel
            const geminiResult = await geminiPromise;

            if (!geminiResult.roadmap || !Array.isArray(geminiResult.roadmap) || geminiResult.roadmap.length === 0) {
              throw new Error(currentT.blueprintInvalid);
            }

            // Show Gemini results immediately in the result panel
            setBlueprint({ ...geminiResult }, currentLang);

            // Start frontend design generation (depends on Gemini completion)
            let frontendDesignError: Error | null = null;
            const frontendDesignPromise = generateFrontendDesignPlan(
              responses, currentLang, context,
            ).catch((err) => {
              console.warn('[FrontendDesign] 프론트엔드 디자인 생성 실패:', err);
              frontendDesignError = err instanceof Error ? err : new Error(String(err));
              return null;
            });

            // Gemini done — show progress, implementation + frontend design still working
            addMessage(
              <T render={(t) =>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {t.geminiCompleteProgress}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <span className="animate-pulse">●</span>
                    {t.claudeStillWorking}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 p-2 rounded-lg border border-teal-100">
                    <span className="animate-pulse">●</span>
                    {t.frontendDesignGenerating}
                  </div>
                </div>
              } />,
              Sender.BOT,
            );

            // Wait for both implementation plan and frontend design in parallel
            const [implResult, frontendDesignResult] = await Promise.all([implPromise, frontendDesignPromise]);

            // Merge results into blueprint
            const mergedBlueprint: typeof geminiResult = { ...geminiResult };
            const hasImplContent = implResult.plan.prd || implResult.plan.techStack.length > 0;
            if (hasImplContent) {
              mergedBlueprint.implementationPlan = implResult.plan;
            }
            if (frontendDesignResult) {
              mergedBlueprint.frontendDesignPlan = frontendDesignResult;
            }
            setBlueprint(mergedBlueprint, currentLang);

            // Helper to get model display classes (full strings for Tailwind JIT)
            const modelClasses: Record<ModelProvider, string> = {
              claude: 'text-purple-700 bg-purple-50 border-purple-100',
              gemini: 'text-blue-700 bg-blue-50 border-blue-100',
              gpt: 'text-green-700 bg-green-50 border-green-100',
            };
            const modelLabel = (p: ModelProvider, t: typeof currentT) =>
              p === 'claude' ? t.implModelClaude : p === 'gemini' ? t.implModelGemini : t.implModelGPT;

            // Completion message with model info
            addMessage(
              <T render={(t) => {
                const clsA = modelClasses[implResult.modelUsed.callA];
                const clsB = modelClasses[implResult.modelUsed.callB];
                const allFailed = !hasImplContent;
                return (
                  <div className="space-y-2">
                    <p className="font-bold text-green-800 text-xs">{t.complete}</p>
                    {!allFailed && (
                      <>
                        <div className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${clsA}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          {t.implCallALabel}: {modelLabel(implResult.modelUsed.callA, t)}
                        </div>
                        <div className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${clsB}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          {t.implCallBLabel}: {modelLabel(implResult.modelUsed.callB, t)}
                        </div>
                        {(implResult.modelUsed.callA !== 'claude' || implResult.modelUsed.callB !== 'claude') && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            {t.implFallbackUsed}
                          </div>
                        )}
                      </>
                    )}
                    {allFailed && (
                      <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline mr-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        {t.implAllFailed}
                      </div>
                    )}
                    {frontendDesignResult && (
                      <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {t.frontendDesignComplete}
                      </div>
                    )}
                    {!frontendDesignResult && frontendDesignError && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        {t.frontendDesignFailed + ' '}{frontendDesignError.message}
                      </div>
                    )}
                  </div>
                );
              }} />,
              Sender.BOT,
            );

            // Post-generation review prompt
            addMessage(
              <T render={(t) =>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <p className="font-black text-slate-900 text-xs">{t.finalReview}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{__html: t.reviewGuide.split('\n').join('<br/>')}} />
                </div>
              } />,
              Sender.BOT,
            );
            setPhase(8);
            break;
          }
        }
      } catch (err) {
        console.error('[runBotPhase] phase', phase, err);
        addMessage(<T render={(t) => t.errorMessage} />, Sender.BOT);
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, setBlueprint, setPhase],
  );

  // Initial load only — show Q1 on mount
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (chatPhase === 0) {
      initRef.current = true;
      setPhase(1);
      runBotPhase(1, [], [], lang);
    }
  }, [chatPhase, lang, setPhase, runBotPhase]);

  // ── User sends a chat message ──
  const handleSendMessage = useCallback(
    async (text: string) => {
      addMessage(text, Sender.USER);
      const s = stateRef.current;
      const currentT = translations[s.lang];

      // Check for document-based blueprint trigger
      if (text.match(/문서.*기반.*설계|문서.*설계.*시작|document.*blueprint|문서.*바로.*시작/i) && lastDocRef.current) {
        const d = lastDocRef.current;
        const responses = [
          d.designKeywords.background,
          d.designKeywords.model,
          d.designKeywords.process,
          d.designKeywords.tech,
          d.designKeywords.goal,
        ];
        addMessage(
          <T render={(t) =>
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
              <p className="font-bold text-green-900 text-xs mb-1">{t.docBasedDesign}</p>
              <p className="text-xs text-green-700">{t.docBasedDesignDesc}</p>
            </div>
          } />,
          Sender.BOT,
        );
        responses.forEach((r) => addUserResponse(r));

        // Gap-filling: if dataGaps exist, ask follow-up questions before proceeding
        if (d.dataGaps && d.dataGaps.length > 0) {
          gapFillingRef.current = { active: true, count: 0, dataGaps: d.dataGaps, designKeywords: d.designKeywords };
          addMessage(
            <T render={(t) =>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                <p className="font-bold text-amber-900 text-xs">{t.gapFillingTitle}</p>
                <p className="text-xs text-amber-700">{t.gapFillingDesc}</p>
                <p className="text-xs text-amber-500 italic">{t.gapFillingSkipHint}</p>
              </div>
            } />,
            Sender.BOT,
          );
          setLoading(true);
          try {
            const question = await generateGapFillingQuestion(d.dataGaps, d.designKeywords, s.additionalContext, s.lang);
            gapFillingRef.current.count = 1;
            addMessage(
              <T render={(t) =>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase">
                      {t.gapFillingQuestion + ' 01'}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 leading-snug">{question.question}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {question.examples.map((ex: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                        {ex}
                      </div>
                    ))}
                  </div>
                  {question.suggestion && (
                    <div className="mt-2 p-4 bg-yellow-50/50 rounded-xl text-xs text-yellow-800 italic border border-yellow-100 leading-relaxed">
                      <span className="font-bold mr-1">{t.tip}</span> {question.suggestion}
                    </div>
                  )}
                </div>
              } />,
              Sender.BOT,
            );
          } catch {
            // If gap-filling question fails, skip to phase 6
            gapFillingRef.current.active = false;
            setPhase(6);
            await runBotPhase(6, responses, s.additionalContext, s.lang);
          } finally {
            setLoading(false);
          }
        } else {
          setPhase(6);
          await runBotPhase(6, responses, s.additionalContext, s.lang);
        }
        return;
      }

      // Check for meeting-based blueprint trigger
      if (text.match(/회의록.*기반.*설계|회의록.*설계.*시작|meeting.*blueprint|회의.*바로.*시작/i) && lastMeetingRef.current) {
        const m = lastMeetingRef.current;
        const responses = [
          m.designKeywords.background,
          m.designKeywords.model,
          m.designKeywords.process,
          m.designKeywords.tech,
          m.designKeywords.goal,
        ];
        addMessage(
          <T render={(t) =>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="font-bold text-blue-900 text-xs mb-1">{t.meetingBasedDesign}</p>
              <p className="text-xs text-blue-700">{t.meetingBasedDesignDesc}</p>
            </div>
          } />,
          Sender.BOT,
        );
        responses.forEach((r) => addUserResponse(r));

        // Gap-filling: if dataGaps exist, ask follow-up questions before proceeding
        if (m.dataGaps && m.dataGaps.length > 0) {
          gapFillingRef.current = { active: true, count: 0, dataGaps: m.dataGaps, designKeywords: m.designKeywords };
          addMessage(
            <T render={(t) =>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                <p className="font-bold text-amber-900 text-xs">{t.gapFillingTitle}</p>
                <p className="text-xs text-amber-700">{t.gapFillingDesc}</p>
                <p className="text-xs text-amber-500 italic">{t.gapFillingSkipHint}</p>
              </div>
            } />,
            Sender.BOT,
          );
          setLoading(true);
          try {
            const question = await generateGapFillingQuestion(m.dataGaps, m.designKeywords, s.additionalContext, s.lang);
            gapFillingRef.current.count = 1;
            addMessage(
              <T render={(t) =>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase">
                      {t.gapFillingQuestion + ' 01'}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 leading-snug">{question.question}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {question.examples.map((ex: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                        {ex}
                      </div>
                    ))}
                  </div>
                  {question.suggestion && (
                    <div className="mt-2 p-4 bg-yellow-50/50 rounded-xl text-xs text-yellow-800 italic border border-yellow-100 leading-relaxed">
                      <span className="font-bold mr-1">{t.tip}</span> {question.suggestion}
                    </div>
                  )}
                </div>
              } />,
              Sender.BOT,
            );
          } catch {
            gapFillingRef.current.active = false;
            setPhase(6);
            await runBotPhase(6, responses, s.additionalContext, s.lang);
          } finally {
            setLoading(false);
          }
        } else {
          setPhase(6);
          await runBotPhase(6, responses, s.additionalContext, s.lang);
        }
        return;
      }

      // Gap-filling response handler
      if (gapFillingRef.current.active) {
        const gf = gapFillingRef.current;
        const skipPattern = /^(건너뛰기|skip|넘어가기|pass)$/i;

        if (skipPattern.test(text.trim())) {
          gf.active = false;
          addMessage(
            <T render={(t) =>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="font-bold text-slate-700 text-xs">{t.gapFillingSkipped}</p>
              </div>
            } />,
            Sender.BOT,
          );
          setPhase(6);
          await runBotPhase(6, s.userResponses, s.additionalContext, s.lang);
        } else {
          addAdditionalContext(text);
          gf.count++;

          if (gf.count >= 3) {
            gf.active = false;
            addMessage(
              <T render={(t) =>
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="font-bold text-green-900 text-xs">{t.gapFillingComplete}</p>
                </div>
              } />,
              Sender.BOT,
            );
            setPhase(6);
            await runBotPhase(6, s.userResponses, [...s.additionalContext, text], s.lang);
          } else {
            setLoading(true);
            try {
              const remaining = gf.dataGaps.slice(gf.count);
              const question = await generateGapFillingQuestion(remaining, gf.designKeywords!, [...s.additionalContext, text], s.lang);
              addMessage(
                <T render={(t) =>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase">
                        {t.gapFillingQuestion + ' ' + String(gf.count + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 leading-snug">{question.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {question.examples.map((ex: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                          {ex}
                        </div>
                      ))}
                    </div>
                    {question.suggestion && (
                      <div className="mt-2 p-4 bg-yellow-50/50 rounded-xl text-xs text-yellow-800 italic border border-yellow-100 leading-relaxed">
                        <span className="font-bold mr-1">{t.tip}</span> {question.suggestion}
                      </div>
                    )}
                  </div>
                } />,
                Sender.BOT,
              );
            } catch {
              gf.active = false;
              setPhase(6);
              await runBotPhase(6, s.userResponses, [...s.additionalContext, text], s.lang);
            } finally {
              setLoading(false);
            }
          }
        }
        return;
      }

      // Off-topic question during diagnostic phases — answer without advancing
      if (s.chatPhase >= 1 && s.chatPhase <= 5 && isGeneralQuestion(text)) {
        setLoading(true);
        try {
          const answer = await generateContinuingChat(s.userResponses, text, s.lang, s.additionalContext);
          addMessage(answer, Sender.BOT);
          addMessage(
            <T render={(t) =>
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {t.offTopicAnswered}
              </div>
            } />,
            Sender.BOT,
          );
        } catch {
          addMessage(<T render={(t) => t.errorMessage} />, Sender.BOT);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (s.chatPhase >= 1 && s.chatPhase <= 5) {
        const updatedResponses = [...s.userResponses, text];
        addUserResponse(text);
        const nextPhase = s.chatPhase + 1;
        setPhase(nextPhase);
        await runBotPhase(nextPhase, updatedResponses, s.additionalContext, s.lang);
      } else if (s.chatPhase === 6) {
        const normalized = text.trim().replace(/[.!?,;。！？、；\s]+$/g, '');
        const isApproval = /^(승인|시작|네|좋아|응|해줘|해주세요|진행|진행해\s?주세요|시작해\s?주세요|좋습니다|확인|yes|ok|start|go)$/i.test(normalized);

        if (isApproval) {
          if (!timelineRef.current.response) {
            timelineRef.current.response = currentT.timelineFlexible;
          }
          setPhase(7);
          await runBotPhase(7, s.userResponses, s.additionalContext, s.lang);
        } else if (!timelineRef.current.asked) {
          // First non-approval response → treat as timeline
          timelineRef.current = { asked: true, response: text.trim() };
          addMessage(
            <T render={(t) =>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="font-bold text-green-900 text-xs flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {t.timelineReceived} {text.trim()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="font-bold text-green-900 mb-1 text-sm">{t.designStartConfirm}</p>
                  <p className="text-sm text-green-800 leading-relaxed" dangerouslySetInnerHTML={{__html: t.confirmMsg}} />
                </div>
              </div>
            } />,
            Sender.BOT,
          );
        } else {
          // Timeline already set, additional context
          addAdditionalContext(text);
          addMessage(
            <T render={(t) =>
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                <p className="font-bold text-yellow-900 text-xs mb-1">{t.additionalReqApplied}</p>
                <p className="text-xs text-yellow-700 leading-relaxed" dangerouslySetInnerHTML={{__html: t.additionalReqDesc.split('\n').join('<br/>')}} />
              </div>
            } />,
            Sender.BOT,
          );
        }
      } else {
        // Free chat after blueprint (phase 8+)
        setLoading(true);
        try {
          const res = await generateContinuingChat(s.userResponses, text, s.lang, s.additionalContext);
          addMessage(res, Sender.BOT);
        } catch {
          addMessage(<T render={(t) => t.errorMessage} />, Sender.BOT);
        } finally {
          setLoading(false);
        }
      }
    },
    [addMessage, addUserResponse, addAdditionalContext, setPhase, setLoading, runBotPhase],
  );

  // ── Trigger blueprint generation from Intake Form ──
  const triggerBlueprint = useCallback(
    async (responses: string[]) => {
      addMessage(
        <T render={(t) =>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="font-bold text-blue-900 text-xs mb-1">{t.formDataReceived}</p>
            <p className="text-xs text-blue-700">{t.formDataDesc}</p>
          </div>
        } />,
        Sender.BOT,
      );
      responses.forEach((r) => addUserResponse(r));
      setPhase(6);
      await runBotPhase(6, responses, stateRef.current.additionalContext, stateRef.current.lang);
    },
    [addMessage, addUserResponse, setPhase, runBotPhase],
  );

  // ── Document upload ──
  const lastDocRef = useRef<DocumentAnalysis | null>(null);

  const handleUploadDocuments = useCallback(
    async (files: FileEntry[]) => {
      const s = stateRef.current;
      const fileNames = files.map(f => f.fileName).join(', ');
      addMessage(<T render={(t) => <>{t.attachedFiles + ' ' + fileNames}</>} />, Sender.USER);
      setLoading(true);
      try {
        // Show progress message
        if (files.length > 1) {
          addMessage(
            <T render={(t) =>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                {t.analyzingFileProgress} {files.length} {files.length > 1 ? t.multiFileAnalysisComplete.split('—')[0].trim() : ''}...
              </div>
            } />,
            Sender.BOT,
          );
        }

        const doc = await analyzeMultipleDocuments(files, s.lang);
        lastDocRef.current = doc;

        // Structured document analysis display
        addMessage(
          <T render={(t) =>
            <div className="space-y-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">DOCUMENT ANALYSIS</p>
                      <h4 className="text-base font-bold text-white">{doc.title}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Overview */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.docSummary}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{doc.overview}</p>
                  </div>

                  {/* 5 Key Areas */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.coreAnalysis}</p>
                    <div className="space-y-2">
                      {[
                        { label: t.sectionLabels[0], value: doc.businessBackground, color: 'blue' },
                        { label: t.sectionLabels[1], value: doc.systemModel, color: 'purple' },
                        { label: t.sectionLabels[2], value: doc.workProcess, color: 'green' },
                        { label: t.sectionLabels[3], value: doc.techEnvironment, color: 'orange' },
                        { label: t.sectionLabels[4], value: doc.finalGoal, color: 'red' },
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                            <span className="font-semibold text-xs text-slate-500 uppercase">{item.label}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed ml-7">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Findings */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.keyFindings}</p>
                    <div className="space-y-1">
                      {doc.keyFindings.map((finding, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Gaps */}
                  {doc.dataGaps.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.additionalCheck}</p>
                      <div className="space-y-1">
                        {doc.dataGaps.map((gap, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                            <span className="mt-0.5 flex-shrink-0">&#9888;</span>
                            <span>{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Design Keywords */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.designKeywords}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { label: '배경', value: doc.designKeywords.background },
                        { label: '모델', value: doc.designKeywords.model },
                        { label: '프로세스', value: doc.designKeywords.process },
                        { label: '기술', value: doc.designKeywords.tech },
                        { label: '목표', value: doc.designKeywords.goal },
                      ].map((kw, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">{kw.label}</span>
                          <span className="text-xs text-slate-600">{kw.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />,
          Sender.BOT,
        );

        // Store as context
        const contextText = [
          `[문서 분석: ${doc.title}]`,
          `요약: ${doc.overview}`,
          `배경: ${doc.designKeywords.background}`,
          `모델: ${doc.designKeywords.model}`,
          `프로세스: ${doc.designKeywords.process}`,
          `기술: ${doc.designKeywords.tech}`,
          `목표: ${doc.designKeywords.goal}`,
          `핵심 발견: ${doc.keyFindings.join('; ')}`,
        ].join('\n');
        addAdditionalContext(contextText);

        // Guide message
        addMessage(
          <T render={(t) =>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100 leading-relaxed" dangerouslySetInnerHTML={{__html: t.docReflectedGuide}} />
            </div>
          } />,
          Sender.BOT,
        );
      } catch {
        addMessage(<T render={(t) => t.docAnalysisFailed} />, Sender.BOT);
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, addAdditionalContext],
  );

  const handleUploadText = useCallback(
    async (text: string, name: string) => {
      const s = stateRef.current;
      addMessage(<T render={(t) => <>{t.attachedFile + ' ' + name}</>} />, Sender.USER);
      setLoading(true);
      try {
        const base64 = btoa(unescape(encodeURIComponent(text)));
        const doc = await analyzeDocument(base64, 'text/plain', s.lang);
        lastDocRef.current = doc;

        // Reuse the same structured display (delegated below via shared rendering)
        addMessage(
          <T render={(t) =>
            <div className="space-y-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-slate-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">DOCUMENT ANALYSIS</p>
                      <h4 className="text-base font-bold text-white">{doc.title}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.docSummary}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{doc.overview}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.keyFindings}</p>
                    <div className="space-y-1">
                      {doc.keyFindings.map((finding: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />,
          Sender.BOT,
        );

        const contextText = [
          `[문서 분석: ${doc.title}]`,
          `요약: ${doc.overview}`,
          `배경: ${doc.designKeywords.background}`,
          `모델: ${doc.designKeywords.model}`,
          `프로세스: ${doc.designKeywords.process}`,
          `기술: ${doc.designKeywords.tech}`,
          `목표: ${doc.designKeywords.goal}`,
          `핵심 발견: ${doc.keyFindings.join('; ')}`,
        ].join('\n');
        addAdditionalContext(contextText);

        addMessage(
          <T render={(t) =>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100 leading-relaxed" dangerouslySetInnerHTML={{__html: t.docReflectedGuide}} />
            </div>
          } />,
          Sender.BOT,
        );
      } catch {
        addMessage(<T render={(t) => t.docAnalysisFailed} />, Sender.BOT);
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, addAdditionalContext],
  );

  // ── Audio upload ──
  const lastMeetingRef = useRef<MeetingMinutes | null>(null);

  const handleUploadAudio = useCallback(
    async (base64: string, mimeType: string) => {
      const s = stateRef.current;
      addMessage(<T render={(t) => t.voiceSubmitted} />, Sender.USER);
      setLoading(true);
      try {
        const minutes = await analyzeAudio(base64, mimeType, s.lang);
        lastMeetingRef.current = minutes;

        // Structured meeting minutes display
        addMessage(
          <T render={(t) =>
            <div className="space-y-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">MEETING MINUTES</p>
                      <h4 className="text-base font-bold text-white">{minutes.meetingTitle}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Executive Summary */}
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">{t.meetingExecSummary}</p>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{minutes.executiveSummary}</p>
                  </div>

                  {/* Overview */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingOverview}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{minutes.overview}</p>
                  </div>

                  {/* Key Decisions */}
                  {minutes.keyDecisions?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingKeyDecisions}</p>
                      <div className="space-y-2">
                        {minutes.keyDecisions.map((d, i) => (
                          <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5 flex-shrink-0 font-bold">&#10003;</span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{d.decision}</p>
                                <p className="text-xs text-slate-500 mt-1"><span className="font-semibold text-slate-600">{t.meetingDecisionRationale}:</span> {d.rationale}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Options Evaluation */}
                  {minutes.optionsEvaluation?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingOptionsEval}</p>
                      <div className="space-y-2">
                        {minutes.optionsEvaluation.map((opt, i) => (
                          <div key={i} className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                            <span className="font-semibold text-sm text-violet-900">{opt.name}</span>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">{opt.evaluation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Topics (Strategic Discussion) */}
                  {(minutes.keyTopics?.length ?? 0) > 0 && <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingTopics}</p>
                    <div className="space-y-2">
                      {minutes.keyTopics?.map((topic, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                            <span className="font-semibold text-sm text-slate-900">{topic.title}</span>
                            <span className="text-[10px] text-slate-400 ml-auto">{topic.speakers}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed ml-7">{topic.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>}

                  {/* Detailed Feedback */}
                  {minutes.detailedFeedback?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingDetailedFeedback}</p>
                      <div className="space-y-1">
                        {minutes.detailedFeedback.map((fb, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="text-orange-400 mt-0.5 flex-shrink-0">&#9654;</span>
                            <span>{fb}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements */}
                  {(minutes.requirements?.length ?? 0) > 0 && <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingRequirements}</p>
                    <div className="space-y-1">
                      {minutes.requirements?.map((req, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>}

                  {/* Action Items (structured) */}
                  {minutes.actionItems?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingActionItems}</p>
                      <div className="space-y-2">
                        {minutes.actionItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600 p-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">&#9679;</span>
                            <div className="flex-1">
                              <span className="text-slate-800">{typeof item === 'string' ? item : item.task}</span>
                              {typeof item !== 'string' && (
                                <div className="flex gap-3 mt-1">
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">{t.meetingActionAssignee}: {item.assignee}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded">{t.meetingActionDeadline}: {item.deadline}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Gaps */}
                  {minutes.dataGaps?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.additionalCheck}</p>
                      <div className="space-y-1">
                        {minutes.dataGaps.map((gap, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                            <span className="mt-0.5 flex-shrink-0">&#9888;</span>
                            <span>{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Design Keywords */}
                  {minutes.designKeywords && <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.designKeywords}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { label: t.designKwBackground, value: minutes.designKeywords?.background ?? '' },
                        { label: t.designKwModel, value: minutes.designKeywords?.model ?? '' },
                        { label: t.designKwProcess, value: minutes.designKeywords?.process ?? '' },
                        { label: t.designKwTech, value: minutes.designKeywords?.tech ?? '' },
                        { label: t.designKwGoal, value: minutes.designKeywords?.goal ?? '' },
                      ].map((kw, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded">{kw.label}</span>
                          <span className="text-xs text-slate-600">{kw.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>}

                  {/* Future Planning */}
                  {minutes.futurePlanning?.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.meetingFuturePlanning}</p>
                      <div className="space-y-1">
                        {minutes.futurePlanning.map((plan, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="text-indigo-400 mt-0.5 flex-shrink-0">&#10148;</span>
                            <span>{plan}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          } />,
          Sender.BOT,
        );

        // Store as context (flatten to text for blueprint prompt)
        const contextParts = [
          `[회의록: ${minutes.meetingTitle}]`,
          `핵심요약: ${minutes.executiveSummary}`,
          `배경: ${minutes.overview}`,
        ];
        if (minutes.keyDecisions?.length > 0) {
          contextParts.push(`결정사항: ${minutes.keyDecisions.map(d => d.decision).join('; ')}`);
        }
        if (minutes.requirements?.length > 0) {
          contextParts.push(`요구사항: ${minutes.requirements.join('; ')}`);
        }
        if (minutes.designKeywords) {
          contextParts.push(
            `비즈니스배경: ${minutes.designKeywords.background ?? ''}`,
            `시스템모델: ${minutes.designKeywords.model ?? ''}`,
            `프로세스: ${minutes.designKeywords.process ?? ''}`,
            `기술환경: ${minutes.designKeywords.tech ?? ''}`,
            `목표: ${minutes.designKeywords.goal ?? ''}`,
          );
        }
        if (minutes.actionItems?.length > 0) {
          contextParts.push(`후속조치: ${minutes.actionItems.map(a => typeof a === 'string' ? a : `${a.task} (${a.assignee}, ${a.deadline})`).join('; ')}`);
        }
        if (minutes.futurePlanning?.length > 0) {
          contextParts.push(`향후계획: ${minutes.futurePlanning.join('; ')}`);
        }
        const contextText = contextParts.join('\n');
        addAdditionalContext(contextText);

        // Guide message
        addMessage(
          <T render={(t) =>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100 leading-relaxed" dangerouslySetInnerHTML={{__html: t.meetingReflectedGuide}} />
            </div>
          } />,
          Sender.BOT,
        );
      } catch (err) {
        console.error('[Audio] handleUploadAudio error:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        addMessage(
          <T render={(t) =>
            <div className="space-y-2">
              <p>{t.voiceAnalysisFailed}</p>
              <p className="text-[10px] text-red-400 font-mono break-all">{errMsg}</p>
            </div>
          } />,
          Sender.BOT,
        );
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, addAdditionalContext],
  );

  return {
    messages,
    isLoading,
    chatPhase,
    handleSendMessage,
    handleUploadDocuments,
    handleUploadText,
    handleUploadAudio,
    triggerBlueprint,
  };
}
