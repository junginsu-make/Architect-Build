
import React, { useState } from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { FrontendDesignPlan } from '../../services/frontendDesignService';
import PageFlowSection from './PageFlowSection';
import UIMockupSection from './UIMockupSection';
import WireframeSection from './WireframeSection';
import ComponentArchSection from './ComponentArchSection';
import DesignTokensSection from './DesignTokensSection';
import FrontendTechSection from './FrontendTechSection';

type DesignSubTab = 'pageFlow' | 'mockups' | 'wireframes' | 'components' | 'tokens' | 'tech';

const FrontendDesignTab: React.FC<{ plan: FrontendDesignPlan | undefined; lang: Language }> = ({ plan, lang }) => {
  const [subTab, setSubTab] = useState<DesignSubTab>('pageFlow');
  const t = designTranslations[lang];

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-4 text-slate-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
        </svg>
        <p className="text-sm font-semibold text-slate-500 mt-1">{t.noDesignPlan}</p>
        <p className="text-xs text-slate-400 mt-1">{t.noDesignPlanDesc}</p>
      </div>
    );
  }

  const subTabs: { key: DesignSubTab; label: string }[] = [
    { key: 'pageFlow', label: t.pageFlowLabel },
    { key: 'mockups', label: t.uiMockupsLabel },
    { key: 'wireframes', label: t.wireframesLabel },
    { key: 'components', label: t.componentArchLabel },
    { key: 'tokens', label: t.designTokensLabel },
    { key: 'tech', label: t.frontendTechLabel },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {subTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              subTab === tab.key
                ? 'bg-teal-50 text-teal-600 border-teal-200'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === 'pageFlow' && <PageFlowSection pageFlow={plan.pageFlow} lang={lang} />}
      {subTab === 'mockups' && <UIMockupSection mockups={plan.uiMockups} lang={lang} />}
      {subTab === 'wireframes' && <WireframeSection wireframes={plan.htmlWireframes} lang={lang} />}
      {subTab === 'components' && <ComponentArchSection arch={plan.componentArchitecture} lang={lang} />}
      {subTab === 'tokens' && <DesignTokensSection tokens={plan.designTokens} lang={lang} />}
      {subTab === 'tech' && <FrontendTechSection techStack={plan.frontendTechStack} lang={lang} />}
    </div>
  );
};

export default FrontendDesignTab;
