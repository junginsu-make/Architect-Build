
import React, { useState } from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { PageFlow } from '../../services/frontendDesignService';
import { Mermaid, DiagramModal, SectionCard, SectionTitle } from './DesignShared';

const PageFlowSection: React.FC<{ pageFlow: PageFlow; lang: Language }> = ({ pageFlow, lang }) => {
  const t = designTranslations[lang];
  const [expandedDiagram, setExpandedDiagram] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Mermaid page flow diagram */}
      <SectionCard>
        <SectionTitle>{t.pageFlowTitle}</SectionTitle>
        <Mermaid
          chart={pageFlow.mermaidDiagram}
          title={t.pageFlowLabel}
          onExpand={() => setExpandedDiagram(pageFlow.mermaidDiagram)}
          lang={lang}
        />
      </SectionCard>

      {/* Page table */}
      <SectionCard>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2.5 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.pageNameLabel}</th>
                <th className="text-left py-2.5 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.routeLabel}</th>
                <th className="text-left py-2.5 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.descriptionLabel}</th>
                <th className="text-left py-2.5 px-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{t.componentsLabel}</th>
              </tr>
            </thead>
            <tbody>
              {pageFlow.pages.map((page, i) => (
                <tr key={i} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/50' : ''} hover:bg-teal-50/30 transition-colors`}>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{page.name}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">{page.route}</td>
                  <td className="py-2.5 px-4 text-slate-600">{page.description}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {page.components.map((comp, ci) => (
                        <span key={ci} className="px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded text-[10px] font-medium border border-teal-100">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Expanded diagram modal */}
      {expandedDiagram && (
        <DiagramModal
          chart={expandedDiagram}
          title={t.pageFlowTitle}
          onClose={() => setExpandedDiagram(null)}
          lang={lang}
        />
      )}
    </div>
  );
};

export default PageFlowSection;
