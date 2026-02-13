import React, { useEffect, useRef } from 'react';
import ChatBubble from './components/ChatBubble';
import MessageInput from './components/MessageInput';
import ResultPanel from './components/ResultPanel';
// import TranslationHub from './components/TranslationHub'; // 비활성화됨
import IntakeForm from './components/intake/IntakeForm';
import LandingPage from './components/landing/LandingPage';
import { translations } from './translations';
import { useChat } from './hooks/useChat.tsx';
import { useUIStore } from './store/uiStore';
import { useDeliverableStore } from './store/deliverableStore';
import { translateBlueprint, analyzeMultipleDocuments } from './services/geminiService';
import type { FileEntry } from './services/geminiService';
import { useChatStore } from './store/chatStore';

const App: React.FC = () => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, chatPhase, handleSendMessage, handleUploadDocuments, handleUploadText, handleUploadAudio, triggerBlueprint } = useChat();
  const { lang, showGuide, intakeMode, activePanel, showLanding, toggleGuide, setIntakeMode, toggleLang, setActivePanel } = useUIStore();
  const blueprint = useDeliverableStore((s) => s.blueprint);
  const blueprintLang = useDeliverableStore((s) => s.blueprintLang);
  const translatedBlueprints = useDeliverableStore((s) => s.translatedBlueprints);
  const isTranslating = useDeliverableStore((s) => s.isTranslating);
  const setTranslating = useDeliverableStore((s) => s.setTranslating);
  const setTranslatedBlueprint = useDeliverableStore((s) => s.setTranslatedBlueprint);

  const t = translations[lang];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-switch to result panel on mobile when blueprint is generated
  useEffect(() => {
    if (blueprint && window.innerWidth < 768) {
      setActivePanel('result');
    }
  }, [blueprint, setActivePanel]);

  // Trigger blueprint translation when language changes
  useEffect(() => {
    if (!blueprint || !blueprintLang) return;
    if (translatedBlueprints[lang]) return; // cached
    if (isTranslating) return;
    if (lang === blueprintLang) return; // original language

    const doTranslate = async () => {
      setTranslating(true);
      try {
        const translated = await translateBlueprint(blueprint, lang);
        setTranslatedBlueprint(lang, translated);
      } catch (err) {
        console.error('Blueprint translation failed:', err);
      } finally {
        setTranslating(false);
      }
    };
    doTranslate();
  }, [lang, blueprint, blueprintLang, translatedBlueprints, isTranslating, setTranslating, setTranslatedBlueprint]);

  const activeBlueprint = translatedBlueprints[lang] ?? blueprint;

  const addAdditionalContext = useChatStore((s) => s.addAdditionalContext);

  const handleIntakeSubmit = async (userResponses: string[], files?: FileEntry[]) => {
    setIntakeMode('chat');

    // If files were attached, analyze them first and add to context
    if (files && files.length > 0) {
      try {
        const analysis = await analyzeMultipleDocuments(files, lang);
        const at = translations[lang];
        const contextText = [
          `[${at.docAnalysisLabel}: ${analysis.title}]`,
          `${at.designKwBackground}: ${analysis.designKeywords.background}`,
          `${at.designKwModel}: ${analysis.designKeywords.model}`,
          `${at.designKwProcess}: ${analysis.designKeywords.process}`,
          `${at.designKwTech}: ${analysis.designKeywords.tech}`,
          `${at.designKwGoal}: ${analysis.designKeywords.goal}`,
          `${at.keyFindings}: ${analysis.keyFindings.join('; ')}`,
        ].join('\n');
        addAdditionalContext(contextText);
      } catch (err) {
        console.error('Form file analysis failed:', err);
      }
    }

    triggerBlueprint(userResponses);
  };

  if (showLanding) {
    return <LandingPage lang={lang} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden relative">
      <div className={`flex flex-col w-full md:w-[450px] lg:w-[500px] h-full border-r border-slate-200 bg-white shadow-2xl z-20 relative ${activePanel !== 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <header className="flex-shrink-0 bg-black text-white p-3 md:p-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black shadow-inner shadow-white/20 text-xs">AI</div>
            <div>
              <h1 className="font-bold tracking-tight text-sm leading-none">{t.appTitle}</h1>
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{t.appSubtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="flex bg-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setIntakeMode('chat')}
                className={`px-3 py-1.5 text-[10px] font-black tracking-widest transition-all ${
                  intakeMode === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.chatMode}
              </button>
              <button
                onClick={() => setIntakeMode('form')}
                className={`px-3 py-1.5 text-[10px] font-black tracking-widest transition-all ${
                  intakeMode === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.formMode}
              </button>
            </div>
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
              title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}
            >
              {lang === 'ko' ? 'EN' : 'KO'}
            </button>
            <button onClick={toggleGuide} className={`p-2 rounded-lg transition-all ${showGuide ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
            </button>
          </div>
        </header>

        {showGuide && (
          <div className="absolute top-20 left-3 right-3 md:left-6 md:right-6 bg-white border border-blue-100 shadow-2xl rounded-2xl z-30 p-5 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-blue-900 text-sm flex items-center gap-2">
                {t.guideTitle}
              </h4>
              <button onClick={toggleGuide} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <ul className="space-y-3">
              <li className="flex gap-3 text-xs leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">1</span>
                <p>{t.guideTip1}</p>
              </li>
              <li className="flex gap-3 text-xs leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">2</span>
                <p>{t.guideTip2}</p>
              </li>
            </ul>
          </div>
        )}

        {intakeMode === 'form' ? (
          <IntakeForm onSubmit={handleIntakeSubmit} />
        ) : (
          <>
            <main className="flex-grow p-3 md:p-6 overflow-y-auto space-y-6 bg-slate-50/30">
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
              {isLoading && chatPhase < 7 && (
                <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl w-fit animate-pulse">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.aiAnalyzing}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </main>
            <MessageInput
              onSendMessage={handleSendMessage}
              onUploadDocuments={handleUploadDocuments}
              onUploadText={handleUploadText}
              onUploadAudio={handleUploadAudio}
              isLoading={isLoading}
              onRestart={() => window.location.reload()}
              lang={lang}
            />
          </>
        )}
      </div>

      <div className={`flex-grow h-full bg-[#f1f5f9] overflow-hidden relative ${activePanel !== 'result' ? 'hidden md:block' : 'block'}`}>
        <ResultPanel isLoading={isLoading && chatPhase === 7} isTranslating={isTranslating} blueprint={activeBlueprint} lang={lang} />
      </div>

      {/* Mobile FAB toggle button */}
      <button
        onClick={() => setActivePanel(activePanel === 'chat' ? 'result' : 'chat')}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
        title={activePanel === 'chat' ? t.switchToResult : t.switchToChat}
      >
        {activePanel === 'chat' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default App;
