
import React, { useState } from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { ComponentArchitecture } from '../../services/frontendDesignService';
import { Mermaid, DiagramModal, SectionCard, SectionTitle } from './DesignShared';

const ComponentArchSection: React.FC<{ arch: ComponentArchitecture; lang: Language }> = ({ arch, lang }) => {
  const t = designTranslations[lang];
  const [expandedDiagram, setExpandedDiagram] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Mermaid component tree diagram */}
      <SectionCard>
        <SectionTitle>{t.componentTreeTitle}</SectionTitle>
        <Mermaid
          chart={arch.mermaidDiagram}
          title={t.componentArchLabel}
          onExpand={() => setExpandedDiagram(arch.mermaidDiagram)}
          lang={lang}
          maxWidth="100%"
        />
      </SectionCard>

      {/* Component detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {arch.components.map((comp, i) => (
          <SectionCard key={i}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h5 className="text-sm font-bold text-slate-800">{comp.name}</h5>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{comp.file}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{comp.description}</p>
            {comp.props.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.propsLabel}</p>
                <div className="flex flex-wrap gap-1">
                  {comp.props.map((prop, pi) => (
                    <span key={pi} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-mono border border-blue-100">
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {comp.children.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.childrenLabel}</p>
                <div className="flex flex-wrap gap-1">
                  {comp.children.map((child, ci) => (
                    <span key={ci} className="px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded text-[10px] font-medium border border-teal-100">
                      {child}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        ))}
      </div>

      {/* Expanded diagram modal */}
      {expandedDiagram && (
        <DiagramModal
          chart={expandedDiagram}
          title={t.componentTreeTitle}
          onClose={() => setExpandedDiagram(null)}
          lang={lang}
        />
      )}
    </div>
  );
};

export default ComponentArchSection;
