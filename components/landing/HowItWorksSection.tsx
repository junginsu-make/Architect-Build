import React from 'react';
import { motion } from 'motion/react';
import { translations } from '../../translations';
import { Language } from '../../types';
import { useUIStore } from '../../store/uiStore';

const COLORS = {
  accent: '#6366f1',
  accentSecondary: '#818cf8',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  border: 'rgba(255, 255, 255, 0.1)',
  bgCard: 'rgba(255, 255, 255, 0.05)',
} as const;

interface HowItWorksSectionProps {
  lang: Language;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ lang }) => {
  const t = translations[lang];
  const { setShowLanding } = useUIStore();

  const phases = [
    { label: t.landingPhase1, isCurrent: false },
    { label: t.landingPhase2, isCurrent: false },
    { label: t.landingPhase3, isCurrent: true },
    { label: t.landingPhase4, isCurrent: false },
    { label: t.landingPhase5, isCurrent: false },
  ];

  return (
    <section id="how-it-works" className="relative min-h-screen w-full bg-[#0D0D0D] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="mb-6 whitespace-pre-line text-3xl font-bold text-white md:text-5xl">
            {t.landingHowTitle}
          </h2>
          <p className="mx-auto mb-16 max-w-3xl text-lg text-white/60">
            {t.landingHowDesc}
          </p>
        </motion.div>

        {/* 5-Phase Timeline — same structure as reference awareness timeline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-0"
        >
          {phases.map((phase, index) => (
            <div key={phase.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2 px-6 py-4">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white"
                  style={{
                    backgroundColor: phase.isCurrent ? COLORS.accent : 'rgba(255,255,255,0.1)',
                    boxShadow: phase.isCurrent ? `0 0 20px ${COLORS.accent}40` : 'none',
                  }}
                >
                  {index + 1}
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider text-center"
                  style={{ color: phase.isCurrent ? COLORS.accentSecondary : 'rgba(255,255,255,0.5)' }}
                >
                  {phase.label}
                </span>
              </div>
              {index < phases.length - 1 && (
                <div className="hidden h-px w-12 bg-white/20 md:block" />
              )}
            </div>
          ))}
          {/* Generation node connector */}
          <div className="hidden h-px w-12 bg-gradient-to-r from-white/20 to-indigo-500/50 md:block" />
          {/* AI Generation node */}
          <div className="flex flex-col items-center gap-2 px-6 py-4">
            <span
              className="flex items-center justify-center w-12 h-12 rounded-xl text-white font-bold shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: COLORS.accentSecondary }}>
              {t.landingPhaseGeneration}
            </span>
            <div className="flex gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">Claude</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">Gemini</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-300">GPT</span>
            </div>
          </div>
        </motion.div>

        {/* CTA Buttons — identical structure to reference */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => setShowLanding(false)}
            className="group flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-all hover:brightness-110"
            style={{ backgroundColor: COLORS.accent }}
          >
            <span>{t.landingCta}</span>
            <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <a
            href="#capabilities"
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{lang === 'ko' ? '기능 살펴보기' : 'Explore Features'}</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
