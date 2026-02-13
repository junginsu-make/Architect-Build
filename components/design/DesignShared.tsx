
import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { translations } from '../../translations';

/* ── Section Card ── */
export const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-4 md:p-6 ${className}`}>{children}</div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; badge?: string; badgeColor?: string }> = ({ children, badge, badgeColor = 'bg-blue-50 text-blue-600' }) => (
  <div className="flex items-center gap-2 mb-4">
    <h4 className="text-sm font-bold text-slate-900">{children}</h4>
    {badge && <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeColor}`}>{badge}</span>}
  </div>
);

/* ── Mermaid diagram ── */
export const Mermaid: React.FC<{
  chart: string; title?: string; onExpand?: () => void; onDownload?: () => void; lang?: Language; maxWidth?: string;
}> = ({ chart, title, onExpand, onDownload, lang = Language.KO, maxWidth = '600px' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (ref.current && chart) {
      setIsRendering(true);
      setError(false);
      ref.current.removeAttribute('data-processed');
      const normalized = chart.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
      ref.current.textContent = normalized;
      const renderDiagram = async () => {
        for (let i = 0; i < 5 && !(window as any).mermaid; i++) {
          await new Promise(r => setTimeout(r, 500));
        }
        if (!(window as any).mermaid) { setError(true); setIsRendering(false); return; }

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (!ref.current) break;
            ref.current.removeAttribute('data-processed');
            ref.current.textContent = normalized;
            await new Promise(r => setTimeout(r, 300 + attempt * 500));
            await (window as any).mermaid.run({ nodes: [ref.current] });
            const svg = ref.current?.querySelector('svg');
            if (svg) {
              svg.removeAttribute('height');
              svg.removeAttribute('width');
              svg.style.maxWidth = maxWidth;
              svg.style.height = 'auto';
              svg.style.margin = '0 auto';
            }
            setIsRendering(false);
            return;
          } catch (err) {
            console.warn(`[Mermaid] Render attempt ${attempt + 1} failed:`, err);
            if (attempt === 2) { setError(true); setIsRendering(false); }
          }
        }
      };
      renderDiagram();
    }
  }, [chart]);

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
          <div className="flex gap-1">
            {onDownload && (
              <button onClick={onDownload} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title={t.download}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </button>
            )}
            {onExpand && (
              <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title={t.expand}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
      <div className="relative min-h-[150px] md:min-h-[200px] flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-auto cursor-pointer" onClick={onExpand}>
        {isRendering && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-[10px] font-medium text-slate-400">{t.rendering}</p>
          </div>
        )}
        {error ? (
          <div className="w-full p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span className="text-xs font-semibold">{t.diagramRenderFailed}</span>
            </div>
            <pre className="p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap">{chart.replace(/\\n/g, '\n')}</pre>
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(chart.replace(/\\n/g, '\n')); }} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              {t.copyMermaidCode}
            </button>
          </div>
        ) : (
          <div className={`mermaid w-full flex justify-center p-4 transition-opacity duration-500 ${isRendering ? 'opacity-0' : 'opacity-100'}`} ref={ref}>{chart}</div>
        )}
      </div>
    </div>
  );
};

/* ── Diagram modal ── */
export const DiagramModal: React.FC<{ chart: string; title: string; onClose: () => void; lang?: Language }> = ({ chart, title, onClose, lang = Language.KO }) => {
  const ref = useRef<HTMLDivElement>(null);
  const t = translations[lang];
  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      const normalized = chart.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
      ref.current.textContent = normalized;
      const render = async () => {
        try {
          if ((window as any).mermaid) {
            await new Promise(r => setTimeout(r, 200));
            await (window as any).mermaid.run({ nodes: [ref.current] });
            const svg = ref.current?.querySelector('svg');
            if (svg) {
              svg.removeAttribute('height');
              svg.style.maxWidth = '100%';
              svg.style.height = 'auto';
            }
          }
        } catch { if (ref.current) ref.current.textContent = normalized; }
      };
      render();
    }
  }, [chart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] md:w-[90vw] max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <div className="flex gap-2">
            <button onClick={() => { const b = new Blob([chart], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${title.replace(/\s+/g, '-')}.mmd`; a.click(); URL.revokeObjectURL(u); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">{t.mmdDownload}</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-auto p-6">
          <div className="mermaid w-full flex justify-center" ref={ref}>{chart}</div>
        </div>
      </div>
    </div>
  );
};
