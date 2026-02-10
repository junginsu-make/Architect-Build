import React, { useEffect, useRef } from 'react';
import ChatBubble from './components/ChatBubble';
import MessageInput from './components/MessageInput';
import ResultPanel from './components/ResultPanel';
import TranslationHub from './components/TranslationHub';
import IntakeForm from './components/intake/IntakeForm';
import { translations } from './translations';
import { useChat } from './hooks/useChat.tsx';
import { useUIStore } from './store/uiStore';
import { useDeliverableStore } from './store/deliverableStore';

const App: React.FC = () => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, chatPhase, handleSendMessage, handleUploadDocument, handleUploadAudio, triggerBlueprint } = useChat();
  const { lang, showGuide, intakeMode, toggleGuide, setIntakeMode } = useUIStore();
  const blueprint = useDeliverableStore((s) => s.blueprint);

  const t = translations[lang];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIntakeSubmit = (userResponses: string[]) => {
    setIntakeMode('chat');
    triggerBlueprint(userResponses);
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden relative">
      <div className="flex flex-col w-full md:w-[450px] lg:w-[500px] h-full border-r border-slate-200 bg-white shadow-2xl z-20 relative">
        <header className="bg-black text-white p-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black shadow-inner shadow-white/20 text-xs">AI</div>
            <div>
              <h1 className="font-bold tracking-tight text-sm leading-none">{t.appTitle}</h1>
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{t.appSubtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setIntakeMode('chat')}
                className={`px-3 py-1.5 text-[10px] font-black tracking-widest transition-all ${
                  intakeMode === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                채팅
              </button>
              <button
                onClick={() => setIntakeMode('form')}
                className={`px-3 py-1.5 text-[10px] font-black tracking-widest transition-all ${
                  intakeMode === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                양식
              </button>
            </div>
            <button onClick={toggleGuide} className={`p-2 rounded-lg transition-all ${showGuide ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
            </button>
          </div>
        </header>

        {showGuide && (
          <div className="absolute top-20 left-6 right-6 bg-white border border-blue-100 shadow-2xl rounded-2xl z-30 p-5 animate-in slide-in-from-top-4 duration-300">
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
            <main className="flex-grow p-6 overflow-y-auto space-y-6 bg-slate-50/30">
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
              {isLoading && chatPhase < 7 && (
                <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl w-fit animate-pulse">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">AI 분석 중...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </main>
            <MessageInput
              onSendMessage={handleSendMessage}
              onUploadDocument={handleUploadDocument}
              onUploadAudio={handleUploadAudio}
              isLoading={isLoading}
              onRestart={() => window.location.reload()}
              lang={lang}
            />
          </>
        )}
      </div>

      <div className="flex-grow h-full bg-[#f1f5f9] overflow-hidden relative">
        <ResultPanel isLoading={isLoading && chatPhase === 7} blueprint={blueprint} lang={lang} />
        <TranslationHub lang={lang} />
      </div>
    </div>
  );
};

export default App;
