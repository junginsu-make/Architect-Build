
import React, { useState, useEffect, useRef } from 'react';
import { SolutionBlueprint } from '../services/geminiService';
import { Language } from '../types';
import DownloadManager from './output/DownloadManager';

interface ResultPanelProps {
  isLoading: boolean;
  blueprint: SolutionBlueprint | null;
  lang: Language;
}

type ViewMode = 'developer' | 'client';
type DevTab = 'roadmap' | 'architecture' | 'implementation' | 'documents';

/* ── Markdown → JSX ── */
const MarkdownText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="list-disc list-inside space-y-1 text-slate-600 text-sm leading-relaxed ml-1">
          {listItems.map((item, i) => <li key={i}>{formatInline(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    // Handle bold + inline code
    const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
      if (match[1]) parts.push(<strong key={key++} className="font-semibold text-slate-800">{match[1]}</strong>);
      if (match[2]) parts.push(<code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">{match[2]}</code>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(<span key={key++}>{line.slice(lastIndex)}</span>);
    return parts.length > 0 ? parts : line;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { flushList(); continue; }
    if (line.startsWith('#### ')) { flushList(); elements.push(<h6 key={i} className="text-xs font-bold text-slate-700 mt-3 mb-1">{formatInline(line.slice(5))}</h6>); }
    else if (line.startsWith('### ')) { flushList(); elements.push(<h5 key={i} className="text-sm font-bold text-slate-800 mt-4 mb-1">{formatInline(line.slice(4))}</h5>); }
    else if (line.startsWith('## ')) { flushList(); elements.push(<h4 key={i} className="text-base font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100">{formatInline(line.slice(3))}</h4>); }
    else if (line.startsWith('# ')) { flushList(); elements.push(<h3 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-2">{formatInline(line.slice(2))}</h3>); }
    else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) { listItems.push(line.replace(/^[-*]\s|^\d+\.\s/, '')); }
    else { flushList(); elements.push(<p key={i} className="text-slate-600 text-sm leading-relaxed">{formatInline(line)}</p>); }
  }
  flushList();
  return <div className={`space-y-1.5 ${className}`}>{elements}</div>;
};

/* ── Mermaid diagram ── */
const Mermaid: React.FC<{
  chart: string; title?: string; onExpand?: () => void; onDownload?: () => void;
}> = ({ chart, title, onExpand, onDownload }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    if (ref.current && chart) {
      setIsRendering(true);
      ref.current.removeAttribute('data-processed');
      ref.current.textContent = chart;
      const renderDiagram = async () => {
        try {
          if ((window as any).mermaid) {
            await new Promise(r => setTimeout(r, 200));
            await (window as any).mermaid.run({ nodes: [ref.current] });
          }
          setIsRendering(false);
        } catch { if (ref.current) ref.current.textContent = chart; setIsRendering(false); }
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
              <button onClick={onDownload} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="다운로드">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              </button>
            )}
            {onExpand && (
              <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="확대">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
      <div className="relative min-h-[200px] flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer" onClick={onExpand}>
        {isRendering && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-[10px] font-medium text-slate-400">렌더링 중...</p>
          </div>
        )}
        <div className={`mermaid w-full flex justify-center p-4 transition-opacity duration-500 ${isRendering ? 'opacity-0' : 'opacity-100'}`} ref={ref}>{chart}</div>
      </div>
    </div>
  );
};

/* ── Diagram modal ── */
const DiagramModal: React.FC<{ chart: string; title: string; onClose: () => void }> = ({ chart, title, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      ref.current.textContent = chart;
      const render = async () => {
        try { if ((window as any).mermaid) { await new Promise(r => setTimeout(r, 100)); await (window as any).mermaid.run({ nodes: [ref.current] }); } }
        catch { if (ref.current) ref.current.textContent = chart; }
      };
      render();
    }
  }, [chart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <div className="flex gap-2">
            <button onClick={() => { const b = new Blob([chart], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${title.replace(/\s+/g, '-')}.mmd`; a.click(); URL.revokeObjectURL(u); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">.mmd 다운로드</button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-auto flex items-center justify-center p-6">
          <div className="mermaid w-full flex justify-center" ref={ref}>{chart}</div>
        </div>
      </div>
    </div>
  );
};

function downloadMmd(chart: string, filename: string) {
  const b = new Blob([chart], { type: 'text/plain' }); const u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = filename; a.click(); URL.revokeObjectURL(u);
}

/* ── Section Card ── */
const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; badge?: string; badgeColor?: string }> = ({ children, badge, badgeColor = 'bg-blue-50 text-blue-600' }) => (
  <div className="flex items-center gap-2 mb-4">
    <h4 className="text-sm font-bold text-slate-900">{children}</h4>
    {badge && <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeColor}`}>{badge}</span>}
  </div>
);

/* ══════════════════════════════════════════════════════════
   Main Panel
   ══════════════════════════════════════════════════════════ */
const ResultPanel: React.FC<ResultPanelProps> = ({ isLoading, blueprint, lang }) => {
  const [activeTab, setActiveTab] = useState<DevTab>('roadmap');
  const [viewMode, setViewMode] = useState<ViewMode>('developer');
  const [expandedDiagram, setExpandedDiagram] = useState<{ chart: string; title: string } | null>(null);
  const [docSubTab, setDocSubTab] = useState<'prd' | 'lld'>('prd');

  const hasImpl = !!blueprint?.implementationPlan;
  const hasClient = !!blueprint?.clientProposal;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-50 to-white">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-[3px] border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">솔루션 설계 중</h3>
        <div className="space-y-1 text-center">
          <p className="text-sm text-slate-500">AI가 요구사항을 분석하고 있습니다</p>
          <p className="text-xs text-slate-400">Gemini + Claude 병렬 생성 진행 중...</p>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-20 h-20 mb-6 bg-white rounded-2xl flex items-center justify-center border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">설계 콘솔</h3>
        <p className="text-sm text-slate-400 text-center leading-relaxed max-w-xs">비즈니스 분석이 완료되면<br/>설계 결과가 여기에 표시됩니다.</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     CLIENT VIEW — 비전문가용 제안서
     ══════════════════════════════════════════ */
  if (viewMode === 'client') {
    const cp = blueprint.clientProposal;
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-20">
          <div className="flex items-center gap-3">
            {blueprint.projectLogoBase64 && (
              <img src={`data:image/png;base64,${blueprint.projectLogoBase64}`} alt="" className="w-8 h-8 rounded-lg border border-slate-200" />
            )}
            <h2 className="font-bold text-base text-slate-900">프로젝트 제안서</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('client')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-slate-900">클라이언트용</button>
              <button onClick={() => setViewMode('developer')} className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:text-slate-700">개발자용</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">

            {/* Title */}
            <div className="text-center pb-8 border-b border-slate-100">
              {blueprint.projectLogoBase64 && (
                <img src={`data:image/png;base64,${blueprint.projectLogoBase64}`} alt="" className="w-14 h-14 rounded-xl border border-slate-200 mx-auto mb-4" />
              )}
              <h1 className="text-2xl font-bold text-slate-900">솔루션 제안서</h1>
              <p className="text-sm text-slate-400 mt-1">AI 기반 맞춤 설계</p>
            </div>

            {cp ? (
              <>
                {/* 1. 현재 상황 분석 */}
                <SectionCard>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">현재 겪고 계신 문제</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cp.problemStatement}</p>
                    </div>
                  </div>
                </SectionCard>

                {/* 2. 해결 방안 */}
                <SectionCard className="bg-blue-50/50 border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">우리의 해결 방안</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cp.solutionOverview}</p>
                    </div>
                  </div>
                </SectionCard>

                {/* 3. 핵심 기능 */}
                <SectionCard>
                  <SectionTitle>제공되는 핵심 기능</SectionTitle>
                  <div className="grid grid-cols-1 gap-2">
                    {cp.keyFeatures.map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        </div>
                        <span className="text-sm text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 4. 추진 일정 */}
                <SectionCard>
                  <SectionTitle>추진 일정</SectionTitle>
                  <div className="relative">
                    {cp.milestones.map((ms, i) => (
                      <div key={i} className="flex gap-4 pb-6 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>{i + 1}</div>
                          {i < cp.milestones.length - 1 && <div className="w-px h-full bg-slate-200 mt-1"></div>}
                        </div>
                        <div className="flex-grow pt-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900">{ms.phase}</span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{ms.duration}</span>
                          </div>
                          <p className="text-xs text-slate-500">{ms.outcome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 5. 기대 효과 */}
                <SectionCard className="bg-green-50/50 border-green-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">도입 후 기대 효과</h3>
                      <MarkdownText text={cp.expectedOutcomes} />
                    </div>
                  </div>
                </SectionCard>

                {/* 6. 투자 효과 */}
                <SectionCard>
                  <SectionTitle>투자 대비 효과</SectionTitle>
                  <MarkdownText text={cp.investmentSummary} />
                </SectionCard>

                {/* 7. 데이터 보호 */}
                <SectionCard>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">데이터 보호 및 보안</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cp.dataProtection}</p>
                    </div>
                  </div>
                </SectionCard>
              </>
            ) : (
              /* Fallback: existing format */
              <>
                <SectionCard>
                  <SectionTitle>프로젝트 요약</SectionTitle>
                  <MarkdownText text={blueprint.analysisSummary} />
                </SectionCard>
                <SectionCard>
                  <SectionTitle>추진 일정</SectionTitle>
                  <div className="space-y-2">
                    {blueprint.roadmap.map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        <p className="text-sm text-slate-600 pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard className="bg-blue-50/50 border-blue-100">
                  <SectionTitle>기대 효과 (ROI)</SectionTitle>
                  <MarkdownText text={blueprint.estimatedROI} />
                </SectionCard>
                <SectionCard>
                  <SectionTitle>보안 및 안정성</SectionTitle>
                  <MarkdownText text={blueprint.securityStrategy} />
                </SectionCard>
              </>
            )}

            {/* Sources */}
            {blueprint.sources && blueprint.sources.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-3">참고 자료</p>
                <div className="grid grid-cols-1 gap-1">
                  {blueprint.sources.map((src, i) => (
                    <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate block">{src.title}</a>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-300">Architect Enterprise Builder</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-end">
          <DownloadManager blueprint={blueprint} lang={lang} />
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DEVELOPER VIEW — 기술 설계서
     ══════════════════════════════════════════ */
  const tabs: { key: DevTab; label: string; show: boolean }[] = [
    { key: 'roadmap', label: '로드맵', show: true },
    { key: 'architecture', label: '아키텍처', show: true },
    { key: 'implementation', label: '구현', show: hasImpl },
    { key: 'documents', label: '문서', show: hasImpl },
  ];
  const visibleTabs = tabs.filter(t => t.show);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {expandedDiagram && <DiagramModal chart={expandedDiagram.chart} title={expandedDiagram.title} onClose={() => setExpandedDiagram(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-20">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-base text-slate-900">기술 설계서</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('client')} className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:text-slate-700">클라이언트용</button>
            <button onClick={() => setViewMode('developer')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-slate-900">개발자용</button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-8 bg-white border-b border-slate-200">
        <div className="flex gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {tab.key === 'implementation' && <span className="ml-1 px-1 py-0.5 bg-purple-100 text-purple-600 text-[9px] rounded font-bold">Claude</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-8 space-y-6">

          {/* ── 로드맵 ── */}
          {activeTab === 'roadmap' && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">실행 로드맵</h3>
                {blueprint.projectLogoBase64 && (
                  <img src={`data:image/png;base64,${blueprint.projectLogoBase64}`} alt="" className="w-10 h-10 rounded-xl border border-slate-200" />
                )}
              </div>

              {/* Sprint Plan (if available) */}
              {hasImpl && blueprint.implementationPlan!.sprintPlan.length > 0 ? (
                <div className="space-y-3">
                  {blueprint.implementationPlan!.sprintPlan.map((sp) => (
                    <SectionCard key={sp.sprint}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center">
                          <span className="text-[9px] font-medium leading-none">Sprint</span>
                          <span className="text-lg font-bold leading-none">{sp.sprint}</span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-sm text-slate-900">{sp.title}</h4>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">{sp.duration}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">목표</p>
                              <ul className="space-y-0.5">
                                {sp.goals.map((g, i) => (
                                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <span className="text-blue-400 mt-0.5">-</span>{g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">산출물</p>
                              <ul className="space-y-0.5">
                                {sp.deliverables.map((d, i) => (
                                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <span className="text-green-400 mt-0.5">-</span>{d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          {sp.dependencies.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {sp.dependencies.map((dep, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded border border-yellow-100">{dep}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  ))}
                </div>
              ) : (
                /* Fallback: string roadmap */
                <div className="space-y-2">
                  {blueprint.roadmap.map((step, idx) => (
                    <SectionCard key={idx}>
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{String(idx + 1).padStart(2, '0')}</div>
                        <p className="text-sm text-slate-700 pt-1.5 leading-relaxed">{step}</p>
                      </div>
                    </SectionCard>
                  ))}
                </div>
              )}

              {/* Analysis summary */}
              <SectionCard>
                <SectionTitle>분석 요약</SectionTitle>
                <MarkdownText text={blueprint.analysisSummary} />
              </SectionCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionCard className="bg-blue-50/50 border-blue-100">
                  <SectionTitle>예상 ROI</SectionTitle>
                  <MarkdownText text={blueprint.estimatedROI} />
                </SectionCard>
                <SectionCard>
                  <SectionTitle>보안 전략</SectionTitle>
                  <MarkdownText text={blueprint.securityStrategy} />
                </SectionCard>
              </div>

              {blueprint.sources && blueprint.sources.length > 0 && (
                <SectionCard>
                  <SectionTitle>참고 자료</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {blueprint.sources.map((src, i) => (
                      <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate block p-1">{src.title}</a>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* ── 아키텍처 ── */}
          {activeTab === 'architecture' && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">아키텍처 설계</h3>
                <span className="text-xs text-slate-400">클릭하여 확대</span>
              </div>

              <Mermaid chart={blueprint.architectureDiagram} title="시스템 아키텍처"
                onExpand={() => setExpandedDiagram({ chart: blueprint.architectureDiagram, title: '시스템 아키텍처' })}
                onDownload={() => downloadMmd(blueprint.architectureDiagram, 'architecture.mmd')} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Mermaid chart={blueprint.techStackGraph} title="기술 스택"
                  onExpand={() => setExpandedDiagram({ chart: blueprint.techStackGraph, title: '기술 스택' })}
                  onDownload={() => downloadMmd(blueprint.techStackGraph, 'tech-stack.mmd')} />
                <Mermaid chart={blueprint.sequenceDiagram} title="시퀀스 플로우"
                  onExpand={() => setExpandedDiagram({ chart: blueprint.sequenceDiagram, title: '시퀀스 플로우' })}
                  onDownload={() => downloadMmd(blueprint.sequenceDiagram, 'sequence.mmd')} />
              </div>
            </>
          )}

          {/* ── 구현 (Claude) ── */}
          {activeTab === 'implementation' && hasImpl && (() => {
            const impl = blueprint.implementationPlan!;
            return (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">구현 계획</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded">Claude Sonnet 4.5</span>
                </div>

                {/* 프로젝트 구조 */}
                <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
                  <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-3">프로젝트 구조</p>
                  <pre className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">{impl.projectStructure}</pre>
                </div>

                {/* 기술 스택 */}
                <SectionCard>
                  <SectionTitle badge="TECH STACK">기술 스택</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {impl.techStack.map((tech, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-semibold rounded uppercase">{tech.category}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{tech.name} <span className="text-slate-400 font-normal text-xs">v{tech.version}</span></p>
                          <p className="text-xs text-slate-500 mt-0.5">{tech.purpose}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* API */}
                <SectionCard>
                  <SectionTitle badge="REST API">API 엔드포인트</SectionTitle>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">메서드</th>
                        <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">경로</th>
                        <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">설명</th>
                        <th className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">인증</th>
                      </tr></thead>
                      <tbody>
                        {impl.apiDesign.map((api, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                api.method === 'GET' ? 'bg-green-100 text-green-700' :
                                api.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                                api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>{api.method}</span>
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-slate-700">{api.path}</td>
                            <td className="py-2 px-3 text-xs text-slate-600">{api.description}</td>
                            <td className="py-2 px-3 text-xs">{api.auth ? <span className="text-green-600 font-semibold">필요</span> : <span className="text-slate-400">공개</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                {/* DB */}
                <SectionCard>
                  <SectionTitle badge="DATABASE">데이터베이스 스키마</SectionTitle>
                  <div className="space-y-4">
                    {impl.databaseDesign.map((table, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2">
                          <span className="text-orange-400 font-mono text-xs font-bold">{table.name}</span>
                          <span className="text-slate-500 text-xs">— {table.description}</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead><tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left py-1.5 px-4 font-semibold text-slate-500">컬럼</th>
                            <th className="text-left py-1.5 px-4 font-semibold text-slate-500">타입</th>
                            <th className="text-left py-1.5 px-4 font-semibold text-slate-500">제약</th>
                          </tr></thead>
                          <tbody>
                            {table.columns.map((col, j) => (
                              <tr key={j} className="border-b border-slate-50">
                                <td className="py-1.5 px-4 font-mono text-slate-700">{col.name}</td>
                                <td className="py-1.5 px-4 font-mono text-blue-600">{col.type}</td>
                                <td className="py-1.5 px-4 text-slate-500">{col.constraint}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Code modules */}
                <SectionCard>
                  <SectionTitle badge="CODE">핵심 모듈</SectionTitle>
                  <div className="space-y-3">
                    {impl.keyModules.map((mod, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-semibold text-xs">{mod.name}</span>
                            <span className="text-slate-500 text-xs">{mod.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-mono rounded">{mod.language}</span>
                            <span className="text-slate-500 text-[10px] font-mono">{mod.file}</span>
                          </div>
                        </div>
                        <pre className="p-4 bg-slate-950 text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{mod.code}</pre>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Deploy + Test */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SectionCard>
                    <SectionTitle>배포 계획</SectionTitle>
                    <MarkdownText text={impl.deploymentPlan} />
                  </SectionCard>
                  <SectionCard>
                    <SectionTitle>테스트 전략</SectionTitle>
                    <MarkdownText text={impl.testingStrategy} />
                  </SectionCard>
                </div>
              </>
            );
          })()}

          {/* ── 문서 (PRD/LLD) ── */}
          {activeTab === 'documents' && hasImpl && (() => {
            const impl = blueprint.implementationPlan!;
            return (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">개발 문서</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded">Claude Sonnet 4.5</span>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-2">
                  <button onClick={() => setDocSubTab('prd')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    docSubTab === 'prd' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>PRD (제품 요구사항)</button>
                  <button onClick={() => setDocSubTab('lld')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    docSubTab === 'lld' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>LLD (상세 설계)</button>
                </div>

                <SectionCard>
                  <MarkdownText text={docSubTab === 'prd' ? impl.prd : impl.lld} />
                </SectionCard>
              </>
            );
          })()}

        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-white border-t border-slate-200 flex justify-end">
        <DownloadManager blueprint={blueprint} lang={lang} />
      </div>
    </div>
  );
};

export default ResultPanel;
