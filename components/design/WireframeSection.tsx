
import React, { useState } from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { HTMLWireframe } from '../../services/frontendDesignService';

const WireframeSection: React.FC<{ wireframes: HTMLWireframe[]; lang: Language }> = ({ wireframes, lang }) => {
  const t = designTranslations[lang];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  if (!wireframes || wireframes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
        <p className="text-xs font-semibold text-slate-500">{t.wireframesLabel}</p>
        <p className="text-xs text-slate-400 mt-1">{t.noWireframesDesc}</p>
      </div>
    );
  }

  const selected = wireframes[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(selected.htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Page selector + view mode toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <select
          value={selectedIdx}
          onChange={e => { setSelectedIdx(Number(e.target.value)); setCopied(false); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          {wireframes.map((wf, i) => (
            <option key={i} value={i}>{wf.pageName}</option>
          ))}
        </select>

        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'preview' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.previewLabel}
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'code' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.codeLabel}
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500">{selected.description}</p>

      {/* Content area */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className="relative">
            <iframe
              srcDoc={selected.htmlCode}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-[500px] border-0 bg-white"
              title={selected.pageName}
              style={{ minHeight: '300px' }}
            />
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              {copied ? t.copiedLabel : t.copyHtmlCode}
            </button>
            <pre className="p-4 bg-slate-900 text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap">
              {selected.htmlCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default WireframeSection;
