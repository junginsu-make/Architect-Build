
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: string, type: 'pdf' | 'text', name?: string) => void;
  lang: Language;
}

const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, onUpload, lang }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [longText, setLongText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const t = translations[lang];

  if (!isOpen) return null;

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert(t.pdfOnly);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(t.fileTooLarge);
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      onUpload(base64, 'pdf', file.name);
      setIsProcessing(false);
      onClose();
    };
    reader.onerror = () => {
      alert(t.fileReadError);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = () => {
    if (!longText.trim()) return;
    const base64 = btoa(unescape(encodeURIComponent(longText)));
    onUpload(base64, 'text', 'Pasted Content');
    onClose();
    setLongText('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        <header className="px-6 md:px-10 py-6 md:py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{t.docUploadTitle}</h3>
            <p className="text-slate-500 text-sm font-medium">{t.docUploadDesc}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="p-3 hover:bg-white rounded-full transition-colors text-slate-400 z-50 relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-6 md:p-10">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.docTabPdf}
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.docTabText}
            </button>
          </div>

          {activeTab === 'file' ? (
            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-6 md:p-12 hover:border-blue-400 transition-colors group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-slate-800 font-bold mb-2">{t.docDropHere}</p>
              <p className="text-slate-400 text-xs font-medium mb-6">{t.maxFileSize}</p>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                disabled={isProcessing} 
              />
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs animate-pulse">
                   <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                   {t.docReading}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <textarea 
                value={longText}
                onChange={(e) => setLongText(e.target.value)}
                placeholder={t.pasteRequirements}
                className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-medium placeholder:text-slate-400"
              />
              <button 
                onClick={handleTextSubmit}
                disabled={!longText.trim()}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 disabled:bg-slate-300 transition-all shadow-xl shadow-slate-900/10"
              >
                {t.docAnalyzeText}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
