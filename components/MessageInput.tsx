
import React, { useState } from 'react';
import DocumentModal from './DocumentModal';
import VoiceRecorderModal from './VoiceRecorderModal';
import { Language } from '../types';
import { translations } from '../translations';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onUploadDocument: (data: string, type: 'pdf' | 'text', name?: string) => void;
  onUploadAudio: (data: string, mimeType: string) => void;
  isLoading: boolean;
  onRestart: () => void;
  lang: Language;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onUploadDocument, onUploadAudio, isLoading, onRestart, lang }) => {
  const [text, setText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const t = translations[lang];

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
    <div className="bg-white border-t border-slate-100">
      <form onSubmit={handleSubmit} className="flex items-center p-5 gap-4">
        <div className="flex gap-2">
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
                className="p-3.5 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 transition-all shadow-sm group"
                title={t.attachDoc}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>

            <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                disabled={isLoading}
                className="p-3.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 transition-all shadow-sm group"
                title={t.voiceIntel}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
            </button>
        </div>
        
        <button
          type="button"
          onClick={onRestart}
          disabled={isLoading}
          className="p-3.5 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 transition-all"
          title={t.restart}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        <div className="relative flex-grow">
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? t.loading : t.placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-700 font-medium shadow-inner resize-none overflow-hidden"
              style={{ minHeight: '56px', maxHeight: '120px', overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden', height: `${Math.min(120, Math.max(56, 28 + text.split('\n').length * 24))}px` }}
          />
          <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-100"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
          </button>
        </div>
      </form>
      <DocumentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUpload={onUploadDocument} 
      />
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onUploadAudio={onUploadAudio}
      />
    </div>
  );
};

export default MessageInput;
