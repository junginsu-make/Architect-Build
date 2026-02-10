import { useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { useDeliverableStore } from '../store/deliverableStore';
import { Sender, Language } from '../types/common';
import { translations } from '../translations';
import {
  generateSolutionBlueprint,
  generateFollowUpQuestion,
  analyzeDocument,
  analyzeAudio,
  generateContinuingChat,
  type EnterpriseQuestionType,
  type MeetingMinutes,
  type DocumentAnalysis,
} from '../services/geminiService';
import { generateImplementationPlan, hasClaudeApiKey } from '../services/claudeService';

const QUESTION_TYPES: EnterpriseQuestionType[] = [
  'SOLUTION_MODEL',
  'MODULE_LOGIC',
  'TECH_INTEGRATION',
  'BUSINESS_GOAL',
];

const SECTION_LABELS = ['비즈니스 배경', '시스템 모델', '업무 프로세스', '기술 환경', '성공 지표'];

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
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase">분석 시작</span>
                  <div className="h-px flex-grow bg-blue-50"></div>
                </div>
                <h2 className="text-xl font-black text-blue-900 leading-tight">{currentT.phase1Title}</h2>
                <p className="text-gray-700 text-sm leading-relaxed">{currentT.phase1Desc}</p>
                <p className="text-xs text-blue-500 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {currentT.phase1Tip}
                </p>
                <div className="grid grid-cols-1 gap-2 py-2">
                  {currentT.steps.map((step: string, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 opacity-60'}`}>
                      <span className={`font-black text-xs ${i === 0 ? 'text-blue-600' : 'text-slate-400'}`}>0{i + 1}</span>
                      <span className={`text-xs font-bold ${i === 0 ? 'text-blue-900' : 'text-slate-500'}`}>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200">
                  <p className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                    <span className="animate-pulse">●</span> 질문 01
                  </p>
                  <p className="text-blue-50 font-medium">{currentT.startPrompt}</p>
                </div>
              </div>,
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
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase">
                    단계 {String(phase).padStart(2, '0')} / 05
                  </span>
                </div>
                <p className="font-bold text-lg text-slate-900 leading-snug">{response.question}</p>
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
                    <span className="font-bold mr-1">팁:</span> {response.suggestion}
                  </div>
                )}
              </div>,
              Sender.BOT,
            );
            break;
          }
          case 6: {
            // Show collected data summary for user verification
            addMessage(
              <div className="space-y-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                    </svg>
                    수집된 요구사항 요약
                  </h4>
                  <div className="space-y-3">
                    {SECTION_LABELS.map((label, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black mt-0.5">{i + 1}</span>
                        <div className="flex-grow min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                          <p className="text-sm text-slate-700 leading-relaxed break-words">{responses[i] || '(미입력)'}</p>
                        </div>
                      </div>
                    ))}
                    {context.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">추가 컨텍스트</p>
                        <p className="text-xs text-slate-500">{context.length}건의 문서/음성 데이터가 반영됩니다.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                  <p className="font-bold text-green-900 mb-1 text-sm">설계 시작 확인</p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    위 내용이 맞으면 <strong>'시작'</strong>을, 수정할 부분이 있으면 수정 내용을 입력해 주세요.
                  </p>
                </div>
              </div>,
              Sender.BOT,
            );
            break;
          }
          case 7: {
            const usesClaude = hasClaudeApiKey();

            addMessage(
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <span className="animate-pulse">●</span>
                  Gemini: 비즈니스 분석 및 클라이언트 제안서 생성 중...
                </div>
                {usesClaude && (
                  <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <span className="animate-pulse">●</span>
                    Claude Sonnet 4.5: PRD, LLD, 구현 계획 생성 중...
                  </div>
                )}
              </div>,
              Sender.BOT,
            );

            // Gemini: 비즈니스 분석 + 다이어그램 + 로고 + 클라이언트 제안서
            // Claude: PRD, LLD, 스프린트 계획, 구현 계획 (API key가 있을 때만)
            const geminiPromise = generateSolutionBlueprint(responses, currentLang, context);
            const claudePromise = usesClaude
              ? generateImplementationPlan(responses, currentLang, context).catch((err) => {
                  console.warn('[Claude] 구현 계획 생성 실패, Gemini 결과만 사용:', err);
                  return null;
                })
              : Promise.resolve(null);

            const [geminiResult, claudeResult] = await Promise.all([geminiPromise, claudePromise]);

            if (!geminiResult.roadmap || !Array.isArray(geminiResult.roadmap) || geminiResult.roadmap.length === 0) {
              throw new Error('Blueprint 생성 결과가 유효하지 않습니다.');
            }

            // Merge results
            const blueprint = { ...geminiResult };
            if (claudeResult) {
              blueprint.implementationPlan = claudeResult;
            }

            setBlueprint(blueprint);

            // Completion message
            addMessage(
              <div className="space-y-2">
                <p className="font-bold text-green-800 text-sm">{currentT.complete}</p>
                {claudeResult && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      PRD, LLD, 스프린트 계획이 생성되었습니다 — 개발자용 뷰에서 확인하세요
                    </div>
                  </div>
                )}
                {!usesClaude && (
                  <div className="text-xs text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    ANTHROPIC_API_KEY를 .env.local에 추가하면 Claude Sonnet 4.5의 PRD, LLD, 스프린트 계획도 함께 생성됩니다.
                  </div>
                )}
              </div>,
              Sender.BOT,
            );

            // Post-generation review prompt
            addMessage(
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="font-black text-slate-900 text-sm">최종 검토</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  오른쪽 패널에서 설계 결과를 확인해 주세요.<br/>
                  내용이 원하시는 방향과 맞는지, 빠진 부분은 없는지 확인 후<br/>
                  수정/보완이 필요하면 말씀해 주세요.
                </p>
              </div>,
              Sender.BOT,
            );
            setPhase(8);
            break;
          }
        }
      } catch (err) {
        console.error('[runBotPhase] phase', phase, err);
        addMessage('요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.', Sender.BOT);
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
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
            <p className="font-bold text-green-900 text-sm mb-1">문서 기반 설계 시작</p>
            <p className="text-xs text-green-700">문서에서 추출된 요구사항을 기반으로 설계를 진행합니다.</p>
          </div>,
          Sender.BOT,
        );
        responses.forEach((r) => addUserResponse(r));
        setPhase(7);
        await runBotPhase(7, responses, s.additionalContext, s.lang);
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
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="font-bold text-blue-900 text-sm mb-1">회의록 기반 설계 시작</p>
            <p className="text-xs text-blue-700">회의에서 도출된 요구사항을 기반으로 설계를 진행합니다.</p>
          </div>,
          Sender.BOT,
        );
        responses.forEach((r) => addUserResponse(r));
        setPhase(7);
        await runBotPhase(7, responses, s.additionalContext, s.lang);
        return;
      }

      if (s.chatPhase >= 1 && s.chatPhase <= 5) {
        const updatedResponses = [...s.userResponses, text];
        addUserResponse(text);
        const nextPhase = s.chatPhase + 1;
        setPhase(nextPhase);
        await runBotPhase(nextPhase, updatedResponses, s.additionalContext, s.lang);
      } else if (s.chatPhase === 6) {
        if (text.match(/승인|시작|네|좋아|응|해줘|해주세요|진행|yes|ok|start|go/i)) {
          setPhase(7);
          await runBotPhase(7, s.userResponses, s.additionalContext, s.lang);
        } else {
          // User provided corrections or additions — store as context
          addAdditionalContext(text);
          addMessage(
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
              <p className="font-bold text-yellow-900 text-sm mb-1">추가 요구사항 반영 완료</p>
              <p className="text-xs text-yellow-700 leading-relaxed">
                입력하신 내용이 추가 컨텍스트로 반영되었습니다.<br/>
                설계를 시작하려면 <strong>'시작'</strong>을 입력해 주세요.
              </p>
            </div>,
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
          addMessage(translations[s.lang].errorMessage, Sender.BOT);
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
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="font-bold text-blue-900 text-sm mb-1">양식 데이터 수신 완료</p>
          <p className="text-xs text-blue-700">입력하신 요구사항을 기반으로 설계를 시작합니다.</p>
        </div>,
        Sender.BOT,
      );
      responses.forEach((r) => addUserResponse(r));
      setPhase(7);
      await runBotPhase(7, responses, stateRef.current.additionalContext, stateRef.current.lang);
    },
    [addMessage, addUserResponse, setPhase, runBotPhase],
  );

  // ── Document upload ──
  const lastDocRef = useRef<DocumentAnalysis | null>(null);

  const handleUploadDocument = useCallback(
    async (data: string, type: 'pdf' | 'text', name?: string) => {
      addMessage(`첨부 파일: ${name || '문서'}`, Sender.USER);
      setLoading(true);
      const s = stateRef.current;
      try {
        const mimeType = type === 'pdf' ? 'application/pdf' : 'text/plain';
        const doc = await analyzeDocument(data, mimeType, s.lang);
        lastDocRef.current = doc;

        // Structured document analysis display
        addMessage(
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">문서 요약</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{doc.overview}</p>
                </div>

                {/* 5 Key Areas */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">핵심 분석 항목</p>
                  <div className="space-y-2">
                    {[
                      { label: '비즈니스 배경', value: doc.businessBackground, color: 'blue' },
                      { label: '시스템 모델', value: doc.systemModel, color: 'purple' },
                      { label: '업무 프로세스', value: doc.workProcess, color: 'green' },
                      { label: '기술 환경', value: doc.techEnvironment, color: 'orange' },
                      { label: '최종 목표', value: doc.finalGoal, color: 'red' },
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">핵심 발견 사항</p>
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">추가 확인 필요</p>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">설계 반영 키워드</p>
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
          </div>,
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
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100 leading-relaxed">
              문서가 분석되어 설계에 반영됩니다.
              현재 질문에 대한 답변을 계속 입력하거나,
              <strong> '문서 기반으로 설계 시작'</strong>을 입력하면
              문서 내용만으로 바로 설계를 시작합니다.
            </div>
          </div>,
          Sender.BOT,
        );
      } catch {
        addMessage('문서 분석에 실패했습니다. 다시 시도해 주세요.', Sender.BOT);
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
      addMessage('음성 녹음을 제출했습니다.', Sender.USER);
      setLoading(true);
      const s = stateRef.current;
      try {
        const minutes = await analyzeAudio(base64, mimeType, s.lang);
        lastMeetingRef.current = minutes;

        // Structured meeting minutes display
        addMessage(
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
                {/* Overview */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">요약</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{minutes.overview}</p>
                </div>

                {/* Key Topics */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">주요 논의 사항</p>
                  <div className="space-y-2">
                    {minutes.keyTopics.map((topic, i) => (
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
                </div>

                {/* Requirements */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">도출된 요구사항</p>
                  <div className="space-y-1">
                    {minutes.requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                {minutes.actionItems.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">후속 조치</p>
                    <div className="space-y-1">
                      {minutes.actionItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-blue-500 mt-0.5 flex-shrink-0">&#9679;</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Design Keywords */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">설계 반영 키워드</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { label: '배경', value: minutes.designKeywords.background },
                      { label: '모델', value: minutes.designKeywords.model },
                      { label: '프로세스', value: minutes.designKeywords.process },
                      { label: '기술', value: minutes.designKeywords.tech },
                      { label: '목표', value: minutes.designKeywords.goal },
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
          </div>,
          Sender.BOT,
        );

        // Store as context (flatten to text for blueprint prompt)
        const contextText = [
          `[회의록: ${minutes.meetingTitle}]`,
          `요약: ${minutes.overview}`,
          `요구사항: ${minutes.requirements.join('; ')}`,
          `배경: ${minutes.designKeywords.background}`,
          `모델: ${minutes.designKeywords.model}`,
          `프로세스: ${minutes.designKeywords.process}`,
          `기술: ${minutes.designKeywords.tech}`,
          `목표: ${minutes.designKeywords.goal}`,
        ].join('\n');
        addAdditionalContext(contextText);

        // Guide message
        addMessage(
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100 leading-relaxed">
              회의록이 분석되어 설계에 반영됩니다.
              현재 질문에 대한 답변을 계속 입력하거나,
              <strong> '회의록 기반으로 설계 시작'</strong>을 입력하면
              회의 내용만으로 바로 설계를 시작합니다.
            </div>
          </div>,
          Sender.BOT,
        );
      } catch {
        addMessage('음성 분석에 실패했습니다. 다시 시도해 주세요.', Sender.BOT);
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
    handleUploadDocument,
    handleUploadAudio,
    triggerBlueprint,
  };
}
