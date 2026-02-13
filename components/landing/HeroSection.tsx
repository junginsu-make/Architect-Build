import React from 'react';
import { motion } from 'motion/react';
import { translations } from '../../translations';
import { Language } from '../../types';
import { useUIStore } from '../../store/uiStore';

const COLORS = {
  accent: '#6366f1',
  accentHover: '#818cf8',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

interface HeroSectionProps {
  lang: Language;
}

const HeroSection: React.FC<HeroSectionProps> = ({ lang }) => {
  const t = translations[lang];
  const { toggleLang, setShowLanding } = useUIStore();

  // Generate particle positions deterministically
  const particles = Array.from({ length: 30 }, (_, i) => ({
    left: `${(i * 37 + 13) % 100}%`,
    delay: `${(i * 0.7) % 8}s`,
    duration: `${6 + (i % 5) * 2}s`,
    size: i % 3 === 0 ? 3 : 2,
    color: i % 4 === 0 ? 'rgba(129, 140, 248, 0.8)' : i % 3 === 0 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(99, 102, 241, 0.5)',
  }));

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#0D0D0D]">
      {/* ── Layer 0: Video background ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'brightness(0.6) saturate(1.2)' }}
      >
        <source src="/hero-robot.mp4" type="video/mp4" />
      </video>

      {/* ── Layer 1: Animated gradient overlay ── */}
      <div className="absolute inset-0 animate-gradient" style={{
        background: 'linear-gradient(135deg, rgba(13,13,13,0.7) 0%, rgba(26,14,51,0.5) 15%, rgba(15,10,46,0.5) 30%, rgba(13,13,13,0.6) 50%, rgba(10,22,40,0.5) 65%, rgba(18,8,42,0.5) 80%, rgba(13,13,13,0.7) 100%)',
        backgroundSize: '400% 400%',
      }} />

      {/* ── Layer 2: Grid pattern ── */}
      <div className="absolute inset-0 hero-grid" />

      {/* ── Layer 3: Large blur orbs (depth) ── */}
      <motion.div
        animate={{ x: [0, 60, -40, 0], y: [0, -70, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[5%] left-[10%] w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 60%)', filter: 'blur(120px)' }}
      />
      <motion.div
        animate={{ x: [0, -50, 40, 0], y: [0, 50, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 60%)', filter: 'blur(120px)' }}
      />
      <motion.div
        animate={{ x: [0, -20, 25, 0], y: [0, 25, -15, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[25%] right-[25%] w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 50%)', filter: 'blur(60px)' }}
      />

      {/* ── Layer 4: Light beams ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="hero-beam absolute top-0 left-0 w-[150%] h-[2px] opacity-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)', top: '30%' }}
        />
        <div
          className="hero-beam-slow absolute top-0 left-0 w-[150%] h-[1px] opacity-15"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)', top: '60%' }}
        />
      </div>

      {/* ── Layer 5: Floating particles ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="hero-particle"
            style={{
              left: p.left,
              bottom: '-5px',
              width: p.size,
              height: p.size,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* ── Layer 6: Pulsing rings (geometric accent) ── */}
      <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full border border-indigo-500/10 hero-ring pointer-events-none" />
      <div className="absolute bottom-[15%] right-[20%] w-[200px] h-[200px] rounded-full border border-purple-500/10 hero-ring pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* ── Layer 7: Dark overlay for text readability ── */}
      <div className="absolute inset-0" style={{ backgroundColor: COLORS.overlay }} />

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black shadow-inner shadow-white/20 text-xs">AI</div>
            <span className="font-semibold">Architect</span>
          </div>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-white/70 transition-colors hover:text-white">
            {t.landingCtaSecondary}
          </a>
          <a href="#capabilities" className="text-sm text-white/70 transition-colors hover:text-white">
            {lang === 'ko' ? '기능' : 'Features'}
          </a>
          <button
            onClick={toggleLang}
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            {lang === 'ko' ? 'English' : '한국어'}
          </button>
        </div>
      </motion.nav>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: COLORS.accent }}
          >
            {lang === 'ko' ? '엔터프라이즈 AI 설계 자동화' : 'Enterprise AI Design Automation'}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h1 className="mb-4 max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            <span className="block">{t.landingTagline1}</span>
            <span
              className="block"
              style={{
                color: COLORS.accent,
                textShadow: `0 0 60px ${COLORS.accent}50, 0 0 120px ${COLORS.accent}20`,
              }}
            >
              {t.landingTagline2}
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 max-w-xl text-lg text-white/70"
        >
          {t.landingSubtitle}
        </motion.p>

        {/* Dual Output showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8 w-full max-w-2xl"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-white/10 bg-black/40 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-white/80">{t.landingProposalLabel}</span>
            </div>
            <span className="text-white/30 font-mono">+</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-sm font-medium text-white/80">{t.landingDevDocsLabel}</span>
            </div>
            <span className="text-white/30 font-mono">=</span>
            <span className="text-sm font-semibold text-indigo-400">{t.landingMinutesNotWeeks}</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => setShowLanding(false)}
            className="flex items-center gap-3 rounded-lg px-6 py-3 font-medium text-white transition-all hover:brightness-110"
            style={{ backgroundColor: COLORS.accent }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{t.landingCta}</span>
          </button>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>{t.landingCtaSecondary}</span>
          </a>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-sm text-white/50">{t.landingScrollDiscover}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <svg className="h-6 w-6 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
