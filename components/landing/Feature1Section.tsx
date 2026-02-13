import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { translations } from '../../translations';
import { Language } from '../../types';

const COLORS = {
  accent: '#6366f1',
  crtGreen: '#00FF00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
} as const;

interface Feature1SectionProps {
  lang: Language;
}

// Terminal typing animation content — Architect generating a blueprint
const TERMINAL_LINES = [
  { text: '$ architect analyze --input meeting.mp4', color: '#22c55e', delay: 0 },
  { text: '  ▸ Extracting business context...', color: '#6366f1', delay: 400 },
  { text: '  ▸ Phase 1: Business Background ✓', color: '#818cf8', delay: 800 },
  { text: '  ▸ Phase 2: System Model ✓', color: '#818cf8', delay: 1200 },
  { text: '  ▸ Phase 3: Workflow ✓', color: '#818cf8', delay: 1600 },
  { text: '  ▸ Phase 4: Tech Environment ✓', color: '#818cf8', delay: 2000 },
  { text: '  ▸ Phase 5: Success Metrics ✓', color: '#818cf8', delay: 2400 },
  { text: '', color: '#ffffff', delay: 2800 },
  { text: '  ⚡ Generating dual output...', color: '#f59e0b', delay: 3000 },
  { text: '    → Client Proposal    [Claude] ✓', color: '#a855f7', delay: 3400 },
  { text: '    → PRD + LLD          [Claude] ✓', color: '#a855f7', delay: 3800 },
  { text: '    → API Design + DB    [Gemini] ✓', color: '#3b82f6', delay: 4200 },
  { text: '    → Frontend Design    [Gemini] ✓', color: '#3b82f6', delay: 4600 },
  { text: '', color: '#ffffff', delay: 5000 },
  { text: '  ✓ Blueprint complete — 2m 34s', color: '#22c55e', delay: 5200 },
];

const Feature1Section: React.FC<Feature1SectionProps> = ({ lang }) => {
  const t = translations[lang];
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    // Loop: reset after all lines shown
    const resetTimer = setTimeout(() => setVisibleLines(0), 7000);
    const restartTimer = setTimeout(() => {
      setVisibleLines(0);
      // Restart the cycle
      TERMINAL_LINES.forEach((line, i) => {
        setTimeout(() => setVisibleLines(i + 1), line.delay);
      });
    }, 7500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(resetTimer);
      clearTimeout(restartTimer);
    };
  }, []);

  // Restart loop continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(0);
      TERMINAL_LINES.forEach((line, i) => {
        setTimeout(() => setVisibleLines(i + 1), line.delay);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: '📋', text: t.landingFeature1Client },
    { icon: '⚙️', text: t.landingFeature1Dev },
    { icon: '⚡', text: t.landingFeature1Parallel },
  ];

  return (
    <section id="crt-timeline" className="relative w-full bg-[#0D0D0D] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text Content — identical structure to reference */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: COLORS.accent }}
            >
              {t.landingFeature1Badge}
            </span>
            <h2 className="mb-6 whitespace-pre-line text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {t.landingFeature1Title}
            </h2>
            <p className="mb-8 text-lg text-white/60">
              {t.landingFeature1Desc}
            </p>
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.text} className="flex items-center gap-3">
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-white/80">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CRT Computer — identical structure to reference */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              {/* Monitor */}
              <div className="relative rounded-2xl bg-gradient-to-b from-[#E8E4DC] to-[#D4CFC4] p-4 shadow-2xl">
                {/* Screen Bezel */}
                <div className="rounded-xl bg-[#2A2A2A] p-3">
                  {/* Screen — animated terminal instead of video */}
                  <div className="relative aspect-[4/3] w-[300px] overflow-hidden rounded-lg bg-[#0a1a0a] md:w-[400px]">
                    {/* Terminal content */}
                    <div className="h-full w-full p-3 font-mono text-[10px] md:text-xs leading-relaxed overflow-hidden"
                      style={{ filter: 'sepia(0.1) saturate(1.2)' }}
                    >
                      {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
                        <div key={i} style={{ color: line.color }} className="whitespace-nowrap">
                          {line.text || '\u00A0'}
                        </div>
                      ))}
                      {/* Blinking cursor */}
                      <span className="inline-block w-2 h-3.5 bg-green-500 animate-pulse" />
                    </div>
                    {/* CRT Scanlines Effect — identical */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)',
                      }}
                    />
                    {/* CRT Glow — identical */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        boxShadow: 'inset 0 0 60px rgba(0,255,0,0.1)',
                      }}
                    />
                  </div>
                </div>
                {/* Badge — our brand */}
                <div className="mt-2 flex items-center justify-between px-2">
                  <span className="font-mono text-xs text-[#666]">architect—builder</span>
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                </div>
                {/* Vents — identical */}
                <div className="mt-2 flex justify-center gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-1 w-8 rounded-full bg-[#C4BFB4]" />
                  ))}
                </div>
              </div>

              {/* Base/Keyboard — identical */}
              <div className="mx-auto mt-1 w-[90%] rounded-b-xl bg-gradient-to-b from-[#D4CFC4] to-[#C4BFB4] p-4">
                <div className="flex items-center gap-2">
                  {/* Floppy Drive */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-1 w-16 rounded bg-[#1a1a1a]" />
                    <div className="h-1 w-1 rounded-full bg-[#666]" />
                  </div>
                  {/* Keyboard */}
                  <div className="flex-1 space-y-1">
                    {[...Array(4)].map((_, row) => (
                      <div key={row} className="flex justify-center gap-0.5">
                        {[...Array(row === 3 ? 8 : 12)].map((_, key) => (
                          <div
                            key={key}
                            className={`h-2 rounded-sm bg-[#E8E4DC] ${
                              row === 3 && key === 4 ? 'w-8' : 'w-3'
                            }`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Feature1Section;
