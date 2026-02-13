
import React, { useState } from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { UIMockup } from '../../services/frontendDesignService';

const UIMockupSection: React.FC<{ mockups: UIMockup[]; lang: Language }> = ({ mockups, lang }) => {
  const t = designTranslations[lang];
  const [expandedMockup, setExpandedMockup] = useState<UIMockup | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
  };

  if (!mockups || mockups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-3 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
        <p className="text-xs font-semibold text-slate-500">{t.uiMockupsLabel}</p>
        <p className="text-xs text-slate-400 mt-1">{t.noMockupsDesc}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockups.map((m, i) => (
          <div
            key={i}
            className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-teal-200 transition-all duration-200"
            onClick={() => setExpandedMockup(m)}
          >
            <div className="relative aspect-[4/3] bg-slate-50">
              {failedImages.has(i) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-slate-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="text-xs font-medium">{t.mockupRenderFailed ?? 'Render failed'}</p>
                </div>
              ) : (
                <img
                  src={m.imageBase64.startsWith('PHN2') ? `data:image/svg+xml;base64,${m.imageBase64}` : `data:image/png;base64,${m.imageBase64}`}
                  alt={m.pageName}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(i)}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs text-white/90 font-medium">{t.expandMockup}</span>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-slate-800">{m.pageName}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Full-size modal */}
      {expandedMockup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setExpandedMockup(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[98vw] md:w-[85vw] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{expandedMockup.pageName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{expandedMockup.description}</p>
              </div>
              <button onClick={() => setExpandedMockup(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-grow overflow-auto p-6 flex items-center justify-center bg-slate-50">
              <img
                src={expandedMockup.imageBase64.startsWith('PHN2') ? `data:image/svg+xml;base64,${expandedMockup.imageBase64}` : `data:image/png;base64,${expandedMockup.imageBase64}`}
                alt={expandedMockup.pageName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UIMockupSection;
