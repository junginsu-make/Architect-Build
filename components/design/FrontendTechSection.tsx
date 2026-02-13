
import React from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { FrontendTechRecommendation } from '../../services/frontendDesignService';
import { SectionCard, SectionTitle } from './DesignShared';

const CATEGORY_COLORS: Record<string, string> = {
  Framework: 'bg-blue-50 text-blue-600 border-blue-100',
  Language: 'bg-purple-50 text-purple-600 border-purple-100',
  Styling: 'bg-pink-50 text-pink-600 border-pink-100',
  State: 'bg-amber-50 text-amber-600 border-amber-100',
  Routing: 'bg-green-50 text-green-600 border-green-100',
  Build: 'bg-orange-50 text-orange-600 border-orange-100',
  Form: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  HTTP: 'bg-rose-50 text-rose-600 border-rose-100',
  Testing: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Auth: 'bg-teal-50 text-teal-600 border-teal-100',
};

const DEFAULT_CATEGORY_COLOR = 'bg-slate-50 text-slate-600 border-slate-100';

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
}

const FrontendTechSection: React.FC<{ techStack: FrontendTechRecommendation[]; lang: Language }> = ({ techStack, lang }) => {
  const t = designTranslations[lang];

  return (
    <SectionCard>
      <SectionTitle>{t.frontendTechTitle}</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {techStack.map((tech, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-200 hover:border-teal-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(tech.category)}`}>
                {tech.category}
              </span>
              {tech.version && (
                <span className="text-[10px] font-mono text-slate-400">v{tech.version}</span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-800">{tech.name}</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tech.purpose}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default FrontendTechSection;
