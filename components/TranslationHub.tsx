
import React, { useState, useEffect, useRef } from 'react';
import { LiveTranslator, TranslationCallback } from '../services/liveTranslationService';
import { Language } from '../types';
import { translations } from '../translations';

interface TranslationLog {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface TranslationHubProps {
  lang: Language;
}

const TranslationHub: React.FC<TranslationHubProps> = ({ lang }) => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<TranslationLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const translatorRef = useRef<LiveTranslator | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const toggleTranslation = async () => {
    if (isActive) {
      translatorRef.current?.stop();
      translatorRef.current = null;
      setIsActive(false);
    } else {
      setError(null);
      if (!translatorRef.current) {
        translatorRef.current = new LiveTranslator();
      }
      
      const callbacks: TranslationCallback = {
        onTranscription: (text, isUser) => {
          setLogs(prev => [...prev, { id: Math.random().toString(), text, isUser, timestamp: new Date() }]);
        },
        onStatusChange: (status) => setIsActive(status),
        onError: (err) => {
          setError(err);
          setIsActive(false);
        }
      };
      await translatorRef.current.start(callbacks);
    }
  };

  useEffect(() => {
    return () => {
      translatorRef.current?.stop();
      translatorRef.current = null;
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed bottom-32 right-8 z-[90] flex flex-col items-end gap-4">
      {isActive && (
        <div className="w-[380px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
          <header className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
             <h4 className="text-xs font-black uppercase tracking-widest">{t.liveTranslator}</h4>
             <button onClick={toggleTranslation} className="text-slate-400 hover:text-white">✕</button>
          </header>
          <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/50">
             {logs.map((log) => (
                <div key={log.id} className={`flex flex-col ${log.isUser ? 'items-start' : 'items-end'}`}>
                   <div className={`px-4 py-3 rounded-2xl text-xs font-medium border ${log.isUser ? 'bg-white text-slate-700 border-slate-100' : 'bg-blue-600 text-white border-blue-500'}`}>
                      {log.text}
                   </div>
                </div>
             ))}
             <div ref={logEndRef} />
          </div>
        </div>
      )}
      <button
        onClick={toggleTranslation}
        className={`group flex items-center gap-4 px-8 py-5 rounded-full shadow-2xl transition-all border-2 ${isActive ? 'bg-red-500 border-red-400' : 'bg-slate-900 border-slate-800'}`}
      >
        <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
          {isActive ? '중지' : t.liveTranslator}
        </span>
      </button>
    </div>
  );
};

export default TranslationHub;
