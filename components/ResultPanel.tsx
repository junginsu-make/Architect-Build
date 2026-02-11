
import React, { useState, useEffect, useRef } from 'react';
import { SolutionBlueprint } from '../services/geminiService';
import { Language } from '../types';
import { translations } from '../translations';
import DownloadManager from './output/DownloadManager';

interface ResultPanelProps {
  isLoading: boolean;
  isTranslating?: boolean;
  blueprint: SolutionBlueprint | null;
  lang: Language;
}

type ViewMode = 'developer' | 'client';
type DevTab = 'roadmap' | 'architecture' | 'implementation' | 'documents';

/* ── Markdown → JSX (enhanced) ── */
const MarkdownText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; ordered: boolean; num?: number }[] = [];
  let listKey = 0;
  let codeBlock: string[] | null = null;
  let codeBlockLang = '';
  let codeBlockStart = 0;
  let tableRows: string[] = [];
  let tableKey = 0;

  const flushTable = () => {
    if (tableRows.length > 0) {
      const parseRow = (row: string) =>
        row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const headers = parseRow(tableRows[0]);
      const bodyRows = tableRows.filter((_, idx) => idx >= 2).map(parseRow);
      elements.push(
        <div key={`table-${tableKey++}`} className="my-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs min-w-[300px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {headers.map((h, hi) => (
                  <th key={hi} className="text-left py-2.5 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className={`border-b border-slate-50 ${ri % 2 === 1 ? 'bg-slate-50/50' : ''} hover:bg-blue-50/30 transition-colors`}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-4 text-slate-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const isOrdered = listItems[0].ordered;
      const ListTag = isOrdered ? 'ol' : 'ul';
      elements.push(
        <ListTag key={`list-${listKey++}`} className={`space-y-2 text-slate-600 text-sm leading-relaxed ml-1 ${isOrdered ? 'list-none' : 'list-none'}`}>
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-3 py-0.5">
              {item.ordered
                ? <span className="flex-shrink-0 w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{item.num}</span>
                : <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-[9px]"></span>
              }
              <span className="flex-grow">{formatInline(item.text)}</span>
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
    }
  };

  const formatInline = (line: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
      if (match[1]) parts.push(<strong key={key++} className="font-semibold text-slate-800">{match[1]}</strong>);
      if (match[2]) parts.push(<code key={key++} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono border border-slate-200">{match[2]}</code>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(<span key={key++}>{line.slice(lastIndex)}</span>);
    return parts.length > 0 ? parts : line;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Fenced code block
    if (trimmed.startsWith('```')) {
      if (codeBlock === null) {
        flushList(); flushTable();
        codeBlock = [];
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockStart = i;
      } else {
        elements.push(
          <div key={`code-${codeBlockStart}`} className="rounded-xl overflow-hidden border border-slate-200 my-2">
            {codeBlockLang && (
              <div className="px-4 py-1.5 bg-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{codeBlockLang}</span>
              </div>
            )}
            <pre className="p-4 bg-slate-900 text-sm text-slate-300 font-mono leading-relaxed overflow-x-auto">{codeBlock.join('\n')}</pre>
          </div>
        );
        codeBlock = null;
        codeBlockLang = '';
      }
      continue;
    }
    if (codeBlock !== null) { codeBlock.push(rawLine); continue; }

    if (!trimmed) { flushList(); flushTable(); continue; }
    if (trimmed === '---' || trimmed === '***') { flushList(); flushTable(); elements.push(<hr key={i} className="border-slate-200 my-6" />); continue; }

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      tableRows.push(trimmed);
      continue;
    } else if (tableRows.length > 0) {
      flushTable();
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      flushList(); flushTable();
      elements.push(
        <div key={i} className="mt-6 mb-2">
          <h6 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{formatInline(trimmed.slice(5))}</h6>
        </div>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(); flushTable();
      elements.push(
        <div key={i} className="mt-8 mb-3">
          <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            {formatInline(trimmed.slice(4))}
          </h5>
        </div>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(); flushTable();
      elements.push(
        <div key={i} className="mt-10 mb-4 pb-2 border-b-2 border-slate-200">
          <h4 className="text-base font-bold text-slate-900">{formatInline(trimmed.slice(3))}</h4>
        </div>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList(); flushTable();
      elements.push(
        <div key={i} className="mt-10 mb-4">
          <h3 className="text-lg font-bold text-slate-900 pb-3 border-b-2 border-blue-500">{formatInline(trimmed.slice(2))}</h3>
        </div>
      );
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      flushList(); flushTable();
      elements.push(
        <blockquote key={i} className="border-l-4 border-blue-200 bg-blue-50/50 pl-4 py-3 pr-4 rounded-r-lg text-sm text-slate-600 italic leading-relaxed my-2">
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
    }
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push({ text: trimmed.replace(/^[-*]\s/, ''), ordered: false });
    } else if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s/);
      listItems.push({ text: trimmed.replace(/^\d+\.\s/, ''), ordered: true, num: numMatch ? parseInt(numMatch[1]) : 1 });
    }
    // Normal paragraph
    else {
      flushList(); flushTable();
      elements.push(<p key={i} className="text-slate-600 text-sm leading-[1.8]">{formatInline(trimmed)}</p>);
    }
  }
  flushList();
  flushTable();
  return <div className={`space-y-3 ${className}`}>{elements}</div>;
};

/* ── Mermaid diagram ── */
const Mermaid: React.FC<{
  chart: string; title?: string; onExpand?: () => void; onDownload?: () => void; lang?: Language;
}> = ({ chart, title, onExpand, onDownload, lang = Language.KO }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (ref.current && chart) {
      setIsRendering(true);
      setError(false);
      ref.current.removeAttribute('data-processed');
      // Normalize: convert literal \n to actual newlines for Mermaid parsing
      const normalized = chart.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
      ref.current.textContent = normalized;
      const renderDiagram = async () => {
        try {
          if ((window as any).mermaid) {
            await new Promise(r => setTimeout(r, 200));
            await (window as any).mermaid.run({ nodes: [ref.current] });
          }
          setIsRendering(false);
        } catch {
          setError(true);
          setIsRendering(false);
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
      <div className="relative min-h-[150px] md:min-h-[200px] flex items-center justify-center bg-white rounded-xl border border-slate-200 overflow-x-auto overflow-y-hidden cursor-pointer" onClick={onExpand}>
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
const DiagramModal: React.FC<{ chart: string; title: string; onClose: () => void; lang?: Language }> = ({ chart, title, onClose, lang = Language.KO }) => {
  const ref = useRef<HTMLDivElement>(null);
  const t = translations[lang];
  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      const normalized = chart.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
      ref.current.textContent = normalized;
      const render = async () => {
        try { if ((window as any).mermaid) { await new Promise(r => setTimeout(r, 100)); await (window as any).mermaid.run({ nodes: [ref.current] }); } }
        catch { if (ref.current) ref.current.textContent = normalized; }
      };
      render();
    }
  }, [chart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[98vw] md:w-[90vw] h-[90vh] md:h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <div className="flex gap-2">
            <button onClick={() => { const b = new Blob([chart], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${title.replace(/\s+/g, '-')}.mmd`; a.click(); URL.revokeObjectURL(u); }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">{t.mmdDownload}</button>
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
  <div className={`bg-white rounded-xl border border-slate-200 p-4 md:p-6 ${className}`}>{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; badge?: string; badgeColor?: string }> = ({ children, badge, badgeColor = 'bg-blue-50 text-blue-600' }) => (
  <div className="flex items-center gap-2 mb-4">
    <h4 className="text-sm font-bold text-slate-900">{children}</h4>
    {badge && <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeColor}`}>{badge}</span>}
  </div>
);

/* ── Calendar Timeline ── */
const SPRINT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
];

function parseDateRange(duration: string): { start: Date; end: Date } | null {
  const datePattern = /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/g;
  const matches = [...duration.matchAll(datePattern)];
  if (matches.length >= 2) {
    const start = new Date(+matches[0][1], +matches[0][2] - 1, +matches[0][3]);
    const end = new Date(+matches[1][1], +matches[1][2] - 1, +matches[1][3]);
    return { start, end };
  }
  return null;
}

function parseDurationToDays(duration: string): number {
  // "2주" / "2 weeks" → 14
  const weekMatch = duration.match(/(\d+)\s*(?:주|weeks?)/i);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;
  // "1개월" / "1 month" → 30
  const monthMatch = duration.match(/(\d+)\s*(?:개월|months?)/i);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;
  // "1-2주" → average
  const rangeWeek = duration.match(/(\d+)\s*[-~]\s*(\d+)\s*(?:주|weeks?)/i);
  if (rangeWeek) return Math.round((parseInt(rangeWeek[1]) + parseInt(rangeWeek[2])) / 2 * 7);
  // "1-2개월" → average
  const rangeMonth = duration.match(/(\d+)\s*[-~]\s*(\d+)\s*(?:개월|months?)/i);
  if (rangeMonth) return Math.round((parseInt(rangeMonth[1]) + parseInt(rangeMonth[2])) / 2 * 30);
  // "90일" / "90 days" → 90
  const dayMatch = duration.match(/(\d+)\s*(?:일|days?)/i);
  if (dayMatch) return parseInt(dayMatch[1]);
  return 14; // default 2 weeks
}

interface SprintDateRange {
  sprint: number;
  title: string;
  start: Date;
  end: Date;
  colorIdx: number;
}

const CalendarTimeline: React.FC<{
  sprintPlan?: { sprint: number; title: string; duration: string }[];
  milestones?: { phase: string; duration: string; outcome: string }[];
  lang: Language;
}> = ({ sprintPlan, milestones, lang }) => {
  const t = translations[lang];
  const dayHeaders: string[] = t.calendarDays;
  const monthNames = lang === Language.KO
    ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Try sprint plan dates first (Claude data)
  const sprintRanges: SprintDateRange[] = [];
  if (sprintPlan && sprintPlan.length > 0) {
    sprintPlan.forEach((sp, idx) => {
      const range = parseDateRange(sp.duration);
      if (range) {
        sprintRanges.push({ sprint: sp.sprint, title: sp.title, start: range.start, end: range.end, colorIdx: idx % SPRINT_COLORS.length });
      }
    });
  }

  // Fallback: generate synthetic dates from milestones (Gemini data)
  if (sprintRanges.length === 0 && milestones && milestones.length > 0) {
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    milestones.forEach((ms, idx) => {
      const days = parseDurationToDays(ms.duration);
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + days - 1);
      sprintRanges.push({ sprint: idx + 1, title: ms.phase, start, end, colorIdx: idx % SPRINT_COLORS.length });
      cursor = new Date(end);
      cursor.setDate(cursor.getDate() + 1);
    });
  }

  if (sprintRanges.length === 0) return null;

  const allDates = sprintRanges.flatMap(r => [r.start, r.end]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  const months: { year: number; month: number }[] = [];
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const lastMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (cur <= lastMonth) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const getSprintForDate = (date: Date): SprintDateRange | null => {
    const ts = date.getTime();
    for (const sr of sprintRanges) {
      if (ts >= sr.start.getTime() && ts <= sr.end.getTime()) return sr;
    }
    return null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.calendarTimeline}</p>
      </div>

      {/* Sprint Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {sprintRanges.map((sr) => {
          const c = SPRINT_COLORS[sr.colorIdx];
          return (
            <div key={sr.sprint} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
              <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
              {sr.title}
            </div>
          );
        })}
      </div>

      {/* Calendar Months Grid */}
      <div className={`grid gap-4 ${months.length === 1 ? 'grid-cols-1' : months.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {months.map(({ year, month }) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const startDow = new Date(year, month, 1).getDay();
          const cells: React.ReactNode[] = [];

          for (let i = 0; i < startDow; i++) {
            cells.push(<div key={`e-${i}`} className="h-7"></div>);
          }

          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const sprint = getSprintForDate(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = date.getTime() === today.getTime();
            const c = sprint ? SPRINT_COLORS[sprint.colorIdx] : null;

            cells.push(
              <div
                key={d}
                className={`h-7 flex items-center justify-center rounded-md text-[10px] font-medium transition-colors ${
                  isToday
                    ? 'ring-2 ring-blue-500 ring-offset-1 font-black'
                    : ''
                } ${
                  c
                    ? `${c.bg} ${c.text} font-bold`
                    : isWeekend
                      ? 'text-slate-300'
                      : 'text-slate-400'
                }`}
                title={sprint ? sprint.title : ''}
              >
                {d}
              </div>
            );
          }

          return (
            <div key={`${year}-${month}`} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-2 text-center">
                {year}. {monthNames[month]}
              </p>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayHeaders.map((dh, i) => (
                  <div key={dh} className={`text-center text-[9px] font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {dh}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Main Panel
   ══════════════════════════════════════════════════════════ */
const ResultPanel: React.FC<ResultPanelProps> = ({ isLoading, isTranslating, blueprint, lang }) => {
  const [activeTab, setActiveTab] = useState<DevTab>('roadmap');
  const [viewMode, setViewMode] = useState<ViewMode>('developer');
  const [expandedDiagram, setExpandedDiagram] = useState<{ chart: string; title: string } | null>(null);
  const [docSubTab, setDocSubTab] = useState<'prd' | 'lld'>('prd');
  const [expandedApis, setExpandedApis] = useState<Set<number>>(new Set());

  const t = translations[lang];

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
        <h3 className="text-lg font-bold text-slate-900 mb-2">{t.designInProgress}</h3>
        <div className="space-y-1 text-center">
          <p className="text-sm text-slate-500">{t.designAnalyzing}</p>
          <p className="text-xs text-slate-400">{t.designParallel}</p>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (!blueprint) {
    const descLines = t.designConsoleDesc.split('\n');
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 md:p-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-20 h-20 mb-6 bg-white rounded-2xl flex items-center justify-center border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">{t.designConsole}</h3>
        <p className="text-sm text-slate-400 text-center leading-relaxed max-w-xs">{descLines.map((line, i) => <React.Fragment key={i}>{line}{i < descLines.length - 1 && <br/>}</React.Fragment>)}</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     CLIENT VIEW
     ══════════════════════════════════════════ */
  if (viewMode === 'client') {
    const cp = blueprint.clientProposal;
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white relative">
        {isTranslating && (
          <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">{t.translatingContent}</p>
            <p className="text-xs text-slate-400 mt-1">{t.translatingDesc}</p>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-base text-slate-900">{t.projectProposal}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('client')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-slate-900">{t.clientView}</button>
              <button onClick={() => setViewMode('developer')} className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:text-slate-700">{t.devView}</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 space-y-8">

            {/* Title */}
            <div className="text-center pb-8 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-slate-900">{t.solutionProposal}</h1>
              <p className="text-sm text-slate-400 mt-1">{t.aiCustomDesign}</p>
            </div>

            {cp ? (
              <>
                {/* 1. Problem */}
                <SectionCard>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{t.problemSection}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cp.problemStatement}</p>
                    </div>
                  </div>
                </SectionCard>

                {/* 2. Solution */}
                <SectionCard className="bg-blue-50/50 border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{t.solutionSection}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cp.solutionOverview}</p>
                    </div>
                  </div>
                </SectionCard>

                {/* 3. Key Features */}
                <SectionCard>
                  <SectionTitle>{t.keyFeatures}</SectionTitle>
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

                {/* 4. Timeline */}
                <SectionCard>
                  <SectionTitle>{t.timeline}</SectionTitle>
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

                {/* 4-1. Calendar Timeline in Client View */}
                <CalendarTimeline
                  sprintPlan={blueprint.implementationPlan?.sprintPlan}
                  milestones={cp.milestones}
                  lang={lang}
                />

                {/* 5. Expected Outcomes */}
                <SectionCard className="bg-green-50/50 border-green-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{t.expectedOutcomes}</h3>
                      <MarkdownText text={cp.expectedOutcomes} />
                    </div>
                  </div>
                </SectionCard>

                {/* 6. Investment ROI */}
                <SectionCard>
                  <SectionTitle>{t.investmentROI}</SectionTitle>
                  <MarkdownText text={cp.investmentSummary} />
                </SectionCard>

                {/* 7. Data Security */}
                <SectionCard>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{t.dataSecurity}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cp.dataProtection}</p>
                    </div>
                  </div>
                </SectionCard>
              </>
            ) : (
              /* Fallback: existing format */
              <>
                <SectionCard>
                  <SectionTitle>{t.projectSummary}</SectionTitle>
                  <MarkdownText text={blueprint.analysisSummary} />
                </SectionCard>
                <SectionCard>
                  <SectionTitle>{t.timeline}</SectionTitle>
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
                  <SectionTitle>{t.estimatedROI}</SectionTitle>
                  <MarkdownText text={blueprint.estimatedROI} />
                </SectionCard>
                <SectionCard>
                  <SectionTitle>{t.securityStrategy}</SectionTitle>
                  <MarkdownText text={blueprint.securityStrategy} />
                </SectionCard>
              </>
            )}

            {/* Sources */}
            {blueprint.sources && blueprint.sources.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-3">{t.references}</p>
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
        <div className="px-4 md:px-8 py-4 bg-white border-t border-slate-200 flex justify-end">
          <DownloadManager blueprint={blueprint} lang={lang} />
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DEVELOPER VIEW
     ══════════════════════════════════════════ */
  const tabs: { key: DevTab; label: string; show: boolean }[] = [
    { key: 'roadmap', label: t.roadmapTab, show: true },
    { key: 'architecture', label: t.architectureTab, show: true },
    { key: 'implementation', label: t.implementationTab, show: true },
    { key: 'documents', label: t.documentsTab, show: true },
  ];
  const visibleTabs = tabs.filter(tb => tb.show);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white relative">
      {isTranslating && (
        <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">{t.translatingContent}</p>
          <p className="text-xs text-slate-400 mt-1">{t.translatingDesc}</p>
        </div>
      )}
      {expandedDiagram && <DiagramModal chart={expandedDiagram.chart} title={expandedDiagram.title} onClose={() => setExpandedDiagram(null)} lang={lang} />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 z-20">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-base text-slate-900">{t.techDesign}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode('client')} className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:text-slate-700">{t.clientView}</button>
            <button onClick={() => setViewMode('developer')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-slate-900">{t.devView}</button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-4 md:px-8 bg-white border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
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
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

          {/* ── Roadmap ── */}
          {activeTab === 'roadmap' && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{t.executionRoadmap}</h3>
              </div>

              {/* Calendar Timeline — works with both Claude sprints and Gemini milestones */}
              <CalendarTimeline
                sprintPlan={hasImpl ? blueprint.implementationPlan!.sprintPlan : undefined}
                milestones={blueprint.clientProposal?.milestones}
                lang={lang}
              />

              {/* Sprint Plan (if available) */}
              {hasImpl && blueprint.implementationPlan!.sprintPlan.length > 0 ? (
                <div className="relative">
                  {/* Progress bar */}
                  <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.overallProgress}</p>
                      <p className="text-xs text-slate-500">{blueprint.implementationPlan!.sprintPlan.length}{t.sprints}</p>
                    </div>
                    <div className="flex gap-1">
                      {blueprint.implementationPlan!.sprintPlan.map((sp, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={`w-full h-2 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                          <span className="text-[9px] font-mono text-slate-400">S{sp.sprint}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline line */}
                  <div className="absolute left-[23px] top-[120px] bottom-6 w-0.5 bg-gradient-to-b from-blue-400 via-blue-300 to-slate-200 rounded-full"></div>

                  <div className="space-y-4">
                    {blueprint.implementationPlan!.sprintPlan.map((sp, idx) => (
                      <div key={sp.sprint} className="relative flex gap-5">
                        {/* Timeline node */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg ${
                            idx === 0
                              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-blue-200'
                              : 'bg-white border-2 border-slate-200 text-slate-600'
                          }`}>
                            <span className="text-[8px] font-bold leading-none uppercase tracking-wider opacity-70">S</span>
                            <span className="text-base font-bold leading-none">{sp.sprint}</span>
                          </div>
                        </div>

                        {/* Card */}
                        <div className="flex-grow bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 mb-1">{sp.title}</h4>
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-slate-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                                <span className="text-[11px] text-slate-400 font-mono">{sp.duration}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              idx === 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                            }`}>{t.sprintBadge} {sp.sprint}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
                              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                </svg>
                                {t.sprintGoals}
                              </p>
                              <ul className="space-y-1.5">
                                {sp.goals.map((g, i) => (
                                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-[7px] flex-shrink-0"></span>
                                    {g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-green-50/50 rounded-lg p-3 border border-green-100/50">
                              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                                {t.sprintDeliverables}
                              </p>
                              <ul className="space-y-1.5">
                                {sp.deliverables.map((d, i) => (
                                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {sp.dependencies.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                </svg>
                                {t.prerequisites}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {sp.dependencies.map((dep, i) => (
                                  <span key={i} className="text-[10px] px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 font-medium">{dep}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fallback: string roadmap — visual timeline */
                <div className="relative">
                  <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-blue-300 to-slate-200 rounded-full"></div>
                  <div className="space-y-3">
                    {blueprint.roadmap.map((step, idx) => {
                      const colors = [
                        'from-blue-600 to-blue-500 shadow-blue-200',
                        'from-indigo-600 to-indigo-500 shadow-indigo-200',
                        'from-violet-600 to-violet-500 shadow-violet-200',
                        'from-purple-600 to-purple-500 shadow-purple-200',
                        'from-cyan-600 to-cyan-500 shadow-cyan-200',
                        'from-teal-600 to-teal-500 shadow-teal-200',
                      ];
                      return (
                        <div key={idx} className="relative flex gap-4 items-start">
                          <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${colors[idx % colors.length]} text-white flex items-center justify-center text-xs font-bold shadow-lg`}>
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <SectionCard className="flex-grow hover:shadow-md transition-shadow">
                            <p className="text-sm text-slate-700 leading-[1.8]">{step}</p>
                          </SectionCard>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Analysis summary */}
              <SectionCard>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">{t.analysisSummary}</h4>
                    <MarkdownText text={blueprint.analysisSummary} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{t.estimatedROI}</h4>
                </div>
                <MarkdownText text={blueprint.estimatedROI} />
              </SectionCard>
              <SectionCard className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{t.securityStrategy}</h4>
                </div>
                <MarkdownText text={blueprint.securityStrategy} />
              </SectionCard>

              {blueprint.sources && blueprint.sources.length > 0 && (
                <SectionCard>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{t.references}</h4>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{blueprint.sources.length}{t.count}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {blueprint.sources.map((src, i) => (
                      <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 mt-0.5 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        <span className="text-xs text-blue-500 group-hover:text-blue-700 truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* ── Architecture ── */}
          {activeTab === 'architecture' && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-violet-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{t.architectureDesign}</h3>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  {t.clickToExpand}
                </span>
              </div>

              {/* Main architecture diagram — full width */}
              <SectionCard className="p-0 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.systemArch}</span>
                </div>
                <div className="p-2">
                  <Mermaid chart={blueprint.architectureDiagram}
                    onExpand={() => setExpandedDiagram({ chart: blueprint.architectureDiagram, title: t.systemArch })}
                    onDownload={() => downloadMmd(blueprint.architectureDiagram, 'architecture.mmd')}
                    lang={lang} />
                </div>
              </SectionCard>

              <SectionCard className="p-0 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.techStack}</span>
                </div>
                <div className="p-2">
                  <Mermaid chart={blueprint.techStackGraph}
                    onExpand={() => setExpandedDiagram({ chart: blueprint.techStackGraph, title: t.techStack })}
                    onDownload={() => downloadMmd(blueprint.techStackGraph, 'tech-stack.mmd')}
                    lang={lang} />
                </div>
              </SectionCard>
              <SectionCard className="p-0 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.sequenceFlow}</span>
                </div>
                <div className="p-2">
                  <Mermaid chart={blueprint.sequenceDiagram}
                    onExpand={() => setExpandedDiagram({ chart: blueprint.sequenceDiagram, title: t.sequenceFlow })}
                    onDownload={() => downloadMmd(blueprint.sequenceDiagram, 'sequence.mmd')}
                    lang={lang} />
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Implementation (Claude) ── */}
          {activeTab === 'implementation' && (hasImpl ? (() => {
            const impl = blueprint.implementationPlan!;
            return (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{t.implPlan}</h3>
                </div>

                {/* Project Structure */}
                <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto">
                  <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-3">{t.projectStructure}</p>
                  <pre className="text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">{impl.projectStructure}</pre>
                </div>

                {/* Tech Stack */}
                <SectionCard>
                  <SectionTitle badge={t.badgeTechStack}>{t.techStack}</SectionTitle>
                  {(() => {
                    const categoryColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
                      frontend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
                      backend: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' },
                      database: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-500' },
                      infra: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-500' },
                      auth: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
                      monitoring: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'text-cyan-500' },
                      testing: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-500' },
                    };
                    const defaultColor = { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'text-slate-500' };
                    const grouped = impl.techStack.reduce((acc, tech) => {
                      const cat = tech.category.toLowerCase();
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(tech);
                      return acc;
                    }, {} as Record<string, typeof impl.techStack>);

                    return (
                      <div className="space-y-5">
                        {Object.entries(grouped).map(([category, techs]) => {
                          const colors = categoryColors[category] || defaultColor;
                          return (
                            <div key={category}>
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-2 h-2 rounded-full ${colors.icon.replace('text-', 'bg-')}`}></div>
                                <p className={`text-[11px] font-bold uppercase tracking-widest ${colors.text}`}>{category}</p>
                                <div className="flex-grow h-px bg-slate-100"></div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {techs.map((tech, i) => (
                                  <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-sm transition-shadow`}>
                                    <div className="min-w-0 flex-grow">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-sm text-slate-900">{tech.name}</p>
                                        <span className="text-[10px] text-slate-400 bg-white/80 px-1.5 py-0.5 rounded font-mono border border-slate-200">v{tech.version}</span>
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed">{tech.purpose}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </SectionCard>

                {/* API */}
                <SectionCard>
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle badge="REST API">{t.apiEndpoints}</SectionTitle>
                    <div className="flex gap-2 text-[9px] font-semibold">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">GET</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">POST</span>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">PUT</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">DELETE</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {impl.apiDesign.map((api, i) => (
                      <div key={i} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className={`flex-shrink-0 w-16 text-center px-2 py-1 rounded-md text-[10px] font-bold ${
                            api.method === 'GET' ? 'bg-green-100 text-green-700' :
                            api.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                            api.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                            api.method === 'PATCH' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>{api.method}</span>
                          <div className="flex-grow min-w-0">
                            <code className="text-xs font-mono text-slate-800 font-semibold break-all">{api.path}</code>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{api.description}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {api.auth ? (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                {t.authRequired}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{t.publicApi}</span>
                            )}
                          </div>
                          {(api.requestBody || api.responseBody || (api.errorCodes && api.errorCodes.length > 0)) && (
                            <button
                              onClick={() => {
                                const next = new Set(expandedApis);
                                if (next.has(i)) next.delete(i);
                                else next.add(i);
                                setExpandedApis(next);
                              }}
                              className="flex-shrink-0 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform ${expandedApis.has(i) ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {expandedApis.has(i) && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                            {api.requestBody && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.requestBodyLabel}</p>
                                <pre className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">{api.requestBody}</pre>
                              </div>
                            )}
                            {api.responseBody && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.responseLabel}</p>
                                <pre className="p-3 bg-green-50 rounded-lg text-xs font-mono text-green-700 overflow-x-auto whitespace-pre-wrap">{api.responseBody}</pre>
                              </div>
                            )}
                            {api.errorCodes && api.errorCodes.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.errorCodesLabel}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {api.errorCodes.map((code, j) => (
                                    <span key={j} className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-100 font-mono">{code}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* DB */}
                <SectionCard>
                  <SectionTitle badge={t.badgeDatabase}>{t.dbSchema}</SectionTitle>
                  <div className="space-y-5">
                    {impl.databaseDesign.map((table, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-900 px-5 py-3 flex items-center gap-3">
                          <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-orange-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                            </svg>
                          </div>
                          <span className="text-orange-400 font-mono text-xs font-bold">{table.name}</span>
                          <span className="text-slate-500 text-xs">— {table.description}</span>
                          <span className="ml-auto text-[9px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded font-mono">{table.columns.length} {t.colsLabel}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs min-w-[500px]">
                            <thead><tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left py-2.5 px-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.columnLabel}</th>
                              <th className="text-left py-2.5 px-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.typeLabel}</th>
                              <th className="text-left py-2.5 px-5 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.constraintLabel}</th>
                            </tr></thead>
                            <tbody>
                              {table.columns.map((col, j) => (
                                <tr key={j} className={`border-b border-slate-50 ${j % 2 === 1 ? 'bg-slate-50/50' : ''} hover:bg-blue-50/30 transition-colors`}>
                                  <td className="py-2.5 px-5 font-mono text-slate-800 font-semibold">{col.name}</td>
                                  <td className="py-2.5 px-5"><span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-[11px]">{col.type}</span></td>
                                  <td className="py-2.5 px-5 text-slate-500">{col.constraint}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Code modules */}
                <SectionCard>
                  <SectionTitle badge={t.badgeCode}>{t.keyModules}</SectionTitle>
                  <div className="space-y-4">
                    {impl.keyModules.map((mod, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-purple-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-purple-300 font-semibold text-xs block">{mod.name}</span>
                              <span className="text-slate-500 text-[10px]">{mod.description}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-mono rounded-md">{mod.language}</span>
                            <span className="text-slate-500 text-[10px] font-mono hidden md:inline">{mod.file}</span>
                          </div>
                        </div>
                        <div className="bg-slate-950 border-t border-slate-800">
                          <div className="px-5 py-1.5 border-b border-slate-800/50">
                            <span className="text-[10px] text-slate-600 font-mono">{mod.file}</span>
                          </div>
                          <pre className="p-5 text-[13px] text-slate-300 font-mono leading-[1.8] overflow-x-auto whitespace-pre-wrap">{mod.code}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Deploy + Test */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SectionCard className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 border-indigo-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{t.deployPlan}</h4>
                    </div>
                    <MarkdownText text={impl.deploymentPlan} />
                  </SectionCard>
                  <SectionCard className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 border-emerald-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{t.testStrategy}</h4>
                    </div>
                    <MarkdownText text={impl.testingStrategy} />
                  </SectionCard>
                </div>
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-6 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-700 mb-2">{t.implNotGenerated}</h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
                {t.implNotGeneratedDesc}
              </p>
              <div className="space-y-2 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm">
                <p className="font-semibold text-slate-600">{t.notGeneratedReason}</p>
                <ul className="space-y-1 text-left">
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">-</span>{t.notGeneratedApiKey}</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">-</span>{t.notGeneratedError}</li>
                </ul>
                <p className="pt-2 text-slate-400">{t.notGeneratedRetry}</p>
              </div>
            </div>
          ))}

          {/* ── Documents (PRD/LLD) ── */}
          {activeTab === 'documents' && (hasImpl ? (() => {
            const impl = blueprint.implementationPlan!;
            return (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{t.devDocuments}</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded">Claude Sonnet 4.5</span>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-2">
                  <button onClick={() => setDocSubTab('prd')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    docSubTab === 'prd' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>{t.prdLabel}</button>
                  <button onClick={() => setDocSubTab('lld')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    docSubTab === 'lld' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>{t.lldLabel}</button>
                </div>

                <SectionCard>
                  <MarkdownText text={docSubTab === 'prd' ? impl.prd : impl.lld} />
                </SectionCard>
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 mb-6 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-700 mb-2">{t.docsNotGenerated}</h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
                {t.docsNotGeneratedDesc}
              </p>
              <div className="space-y-2 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm">
                <p className="font-semibold text-slate-600">{t.notGeneratedReason}</p>
                <ul className="space-y-1 text-left">
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">-</span>{t.notGeneratedApiKey}</li>
                  <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">-</span>{t.notGeneratedError}</li>
                </ul>
                <p className="pt-2 text-slate-400">{t.notGeneratedRetry}</p>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Footer */}
      <div className="px-4 md:px-8 py-4 bg-white border-t border-slate-200 flex justify-end">
        <DownloadManager blueprint={blueprint} lang={lang} />
      </div>
    </div>
  );
};

export default ResultPanel;
