
import React from 'react';
import { Language } from '../../types';
import { designTranslations } from './designTranslations';
import type { DesignTokens } from '../../services/frontendDesignService';
import { SectionCard, SectionTitle } from './DesignShared';

const DesignTokensSection: React.FC<{ tokens: DesignTokens; lang: Language }> = ({ tokens, lang }) => {
  const t = designTranslations[lang];

  return (
    <div className="space-y-4">
      {/* Colors */}
      <SectionCard>
        <SectionTitle>{t.colorsLabel}</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tokens.colors.map((color, i) => (
            <div key={i} className="group">
              <div
                className="w-full h-16 rounded-lg border border-slate-200 mb-2 shadow-sm transition-transform group-hover:scale-105"
                style={{ backgroundColor: color.value }}
              />
              <p className="text-xs font-semibold text-slate-800">{color.name}</p>
              <p className="text-[10px] font-mono text-slate-400">{color.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{color.usage}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Typography */}
      <SectionCard>
        <SectionTitle>{t.typographyLabel}</SectionTitle>
        <div className="space-y-4">
          {tokens.typography.map((typo, i) => (
            <div key={i} className="flex items-start gap-4 py-2 border-b border-slate-50 last:border-0">
              <div className="flex-shrink-0 w-32">
                <p className="text-xs font-semibold text-slate-800">{typo.name}</p>
                <p className="text-[10px] font-mono text-slate-400">{typo.size} / {typo.weight}</p>
              </div>
              <div className="flex-grow">
                <p
                  className="text-slate-700 leading-snug"
                  style={{ fontSize: typo.size, fontWeight: Number(typo.weight) }}
                >
                  {typo.name}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">{typo.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Spacing */}
      <SectionCard>
        <SectionTitle>{t.spacingLabel}</SectionTitle>
        <div className="space-y-3">
          {tokens.spacing.map((sp, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-20">
                <p className="text-xs font-semibold text-slate-800">{sp.name}</p>
                <p className="text-[10px] font-mono text-slate-400">{sp.value}</p>
              </div>
              <div
                className="h-4 rounded-sm bg-teal-200"
                style={{ width: sp.value }}
              />
              <p className="text-[10px] text-slate-500 flex-grow">{sp.usage}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default DesignTokensSection;
