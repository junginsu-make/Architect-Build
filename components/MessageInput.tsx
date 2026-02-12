
import React, { useState, useRef, useEffect } from 'react';
import DocumentModal from './DocumentModal';
import VoiceRecorderModal from './VoiceRecorderModal';
import { Language } from '../types';
import { translations } from '../translations';
import type { FileEntry } from '../services/geminiService';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onUploadDocuments: (files: FileEntry[]) => void;
  onUploadText: (data: string, name: string) => void;
  onUploadAudio: (data: string, mimeType: string) => void;
  isLoading: boolean;
  onRestart: () => void;
  lang: Language;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onUploadDocuments, onUploadText, onUploadAudio, isLoading, onRestart, lang }) => {
  const [text, setText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[lang];

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(180, Math.max(72, el.scrollHeight))}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 transition-all text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed group"
          title={t.attachDoc}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
          <span className="hidden sm:inline">{t.attachDoc}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-100 transition-all text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed group"
          title={t.voiceIntel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
          <span className="hidden sm:inline">{t.voiceIntel}</span>
        </button>

        <div className="flex-grow"></div>

        <button
          type="button"
          onClick={onRestart}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 transition-all text-[11px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          title={t.restart}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="hidden sm:inline">{t.restart}</span>
        </button>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-1">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? t.loading : t.placeholder}
            disabled={isLoading}
            rows={2}
            className="w-full pl-4 md:pl-5 pr-12 md:pr-14 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-700 text-sm font-medium resize-none leading-relaxed"
            style={{ minHeight: '72px', maxHeight: '180px' }}
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-100 disabled:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 px-1">
          {t.enterToSend}
        </p>
      </form>

      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadMultiple={onUploadDocuments}
        onUploadText={onUploadText}
        lang={lang}
      />
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onUploadAudio={onUploadAudio}
        lang={lang}
      />
    </div>
  );
};

export default MessageInput;
