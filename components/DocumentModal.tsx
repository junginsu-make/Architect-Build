
import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { SUPPORTED_DOC_MIME_TYPES, type FileEntry } from '../services/geminiService';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadMultiple: (files: FileEntry[]) => void;
  onUploadText: (data: string, name: string) => void;
  lang: Language;
}

const ACCEPT_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per file
const MAX_FILES = 10;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  return '📎';
}

const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, onUploadMultiple, onUploadText, lang }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [longText, setLongText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<{ file: File; base64: string; mimeType: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  if (!isOpen) return null;

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error(t.fileReadError));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const newFiles: typeof pendingFiles = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      // Check total file count
      if (pendingFiles.length + newFiles.length >= MAX_FILES) {
        errors.push(`${t.maxFilesExceeded} (${MAX_FILES})`);
        break;
      }

      // Validate MIME type
      if (!SUPPORTED_DOC_MIME_TYPES.includes(file.type)) {
        errors.push(`${file.name}: ${t.unsupportedFileType}`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ${t.fileTooLarge}`);
        continue;
      }

      // Check duplicate name
      if (pendingFiles.some(pf => pf.file.name === file.name)) {
        continue; // silently skip duplicates
      }

      try {
        const base64 = await readFileAsBase64(file);
        newFiles.push({ file, base64, mimeType: file.type });
      } catch {
        errors.push(`${file.name}: ${t.fileReadError}`);
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    setPendingFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(false);

    // Reset file input so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFiles = () => {
    if (pendingFiles.length === 0) return;
    const entries: FileEntry[] = pendingFiles.map(pf => ({
      base64: pf.base64,
      mimeType: pf.mimeType,
      fileName: pf.file.name,
    }));
    onUploadMultiple(entries);
    setPendingFiles([]);
    onClose();
  };

  const handleTextSubmit = () => {
    if (!longText.trim()) return;
    onUploadText(longText, 'Pasted Content');
    onClose();
    setLongText('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative max-h-[90vh] flex flex-col">
        <header className="px-6 md:px-10 py-6 md:py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{t.docUploadTitle}</h3>
            <p className="text-slate-500 text-sm font-medium">{t.docUploadDesc}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPendingFiles([]);
              onClose();
            }}
            className="p-3 hover:bg-white rounded-full transition-colors text-slate-400 z-50 relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-6 md:p-10 overflow-y-auto flex-1">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.docTabFile}
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.docTabText}
            </button>
          </div>

          {activeTab === 'file' ? (
            <div className="space-y-4">
              {/* Drop zone */}
              <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-6 md:p-10 hover:border-blue-400 transition-colors group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-slate-800 font-bold mb-1 text-sm">{t.docDropHere}</p>
                <p className="text-slate-400 text-[11px] font-medium mb-1">{t.supportedFormats}</p>
                <p className="text-slate-400 text-[11px] font-medium">{t.maxFileSize}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_EXTENSIONS}
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs animate-pulse mt-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    {t.docReading}
                  </div>
                )}
              </div>

              {/* Selected files list */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {t.selectedFiles} ({pendingFiles.length}/{MAX_FILES})
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {pendingFiles.map((pf, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 group/item">
                        <span className="text-base">{getFileIcon(pf.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{pf.file.name}</p>
                          <p className="text-[10px] text-slate-400">{formatFileSize(pf.file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/item:opacity-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmitFiles}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10"
                  >
                    {t.analyzeFiles} ({pendingFiles.length})
                  </button>
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
