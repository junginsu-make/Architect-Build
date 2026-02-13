import React from 'react';
import { motion } from 'motion/react';
import { translations } from '../../translations';
import { Language } from '../../types';

const COLORS = {
  accent: '#6366f1',
  multiModel: '#A855F7',
  docAnalysis: '#3B82F6',
  frontendDesign: '#22C55E',
  voice: '#F59E0B',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
} as const;

interface Feature2SectionProps {
  lang: Language;
}

const Feature2Section: React.FC<Feature2SectionProps> = ({ lang }) => {
  const t = translations[lang];

  const sections = [
    {
      id: 'multi-model',
      title: t.landingCapMultiModel,
      description: t.landingCapMultiModelDesc,
      emphasis: lang === 'ko' ? '단일 장애점 없이, 항상 문서가 생성됩니다.' : 'No single point of failure — documents are always generated.',
      visual: 'models',
    },
    {
      id: 'doc-analysis',
      title: t.landingCapDocAnalysis,
      description: t.landingCapDocAnalysisDesc,
      code: lang === 'ko' ? 'PDF → AI Vision → 구조화 JSON → 설계 반영' : 'PDF → AI Vision → Structured JSON → Design Input',
      visual: 'docs',
      flipped: true,
    },
    {
      id: 'frontend-design',
      title: t.landingCapFrontendDesign,
      description: t.landingCapFrontendDesignDesc,
      emphasis: lang === 'ko' ? '디자인 토큰부터 목업까지, 완전한 프론트엔드 설계 패키지.' : 'From design tokens to mockups — a complete frontend design package.',
      visual: 'design',
    },
    {
      id: 'voice',
      title: t.landingCapVoice,
      description: t.landingCapVoiceDesc,
      emphasis: lang === 'ko' ? '회의를 다시 듣지 않아도 됩니다.' : 'You never have to re-listen to the meeting.',
      visual: 'voice',
      flipped: true,
    },
  ];

  // Multi-model fallback chain visual — matches reference "types" card style
  const modelChain = [
    { emoji: '🟣', label: 'Claude', count: 'Primary', color: COLORS.multiModel },
    { emoji: '🔵', label: 'Gemini', count: 'Fallback', color: COLORS.docAnalysis },
    { emoji: '🟢', label: 'GPT', count: 'Tertiary', color: COLORS.frontendDesign },
  ];

  return (
    <section id="capabilities" className="relative w-full bg-[#0D0D0D] py-24">
      <div className="mx-auto max-w-7xl space-y-32 px-6">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className={`grid items-center gap-12 lg:grid-cols-2 ${section.flipped ? 'lg:[direction:rtl]' : ''}`}
          >
            {/* Text Column — identical structure */}
            <div className="lg:[direction:ltr]">
              <h2 className="mb-6 whitespace-pre-line text-3xl font-bold text-white md:text-4xl">
                {section.title}
              </h2>
              <p className="mb-4 text-lg text-white/60">{section.description}</p>
              {section.emphasis && (
                <p className="text-lg font-medium text-white/80">{section.emphasis}</p>
              )}
              {section.code && (
                <code className="mt-4 inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-green-400">
                  {section.code}
                </code>
              )}
            </div>

            {/* Visual Column — identical structure */}
            <div className="lg:[direction:ltr]">
              {section.visual === 'models' && (
                <div className="space-y-3">
                  {modelChain.map((model) => (
                    <div
                      key={model.label}
                      className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-all hover:bg-white/10"
                    >
                      <span className="text-2xl">{model.emoji}</span>
                      <span className="flex-1 font-medium text-white">{model.label}</span>
                      <span
                        className="rounded-full px-3 py-1 text-sm text-white"
                        style={{ backgroundColor: `${model.color}30` }}
                      >
                        {model.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {section.visual === 'docs' && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <span className="mb-2 block text-xs uppercase text-white/50">
                      {lang === 'ko' ? '입력' : 'Input'}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {['PDF', 'JPG', 'PNG', 'PPT'].map((ext) => (
                        <span key={ext} className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm text-white/70">{ext}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-center text-2xl text-white/30">↓</div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <span className="mb-2 block text-xs uppercase text-white/50">
                      {lang === 'ko' ? 'AI 비전 분석' : 'AI Vision Analysis'}
                    </span>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">{lang === 'ko' ? '1단계: 데이터 추출' : 'Stage 1: Data extraction'}</span>
                        <span className="text-white/40">{lang === 'ko' ? '대용량 파일' : 'Large files'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">{lang === 'ko' ? '2단계: 구조화 분석' : 'Stage 2: Structured analysis'}</span>
                        <span className="text-white/40">JSON</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {section.visual === 'design' && (
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-4">
                    <span className="mb-3 block text-xs uppercase text-white/50">
                      {lang === 'ko' ? '디자인 시스템' : 'Design System'}
                    </span>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">🎨 {lang === 'ko' ? '디자인 토큰' : 'Design Tokens'}</span>
                        <span className="text-white/40">{lang === 'ko' ? '색상·타이포' : 'Colors·Typo'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70">🧩 {lang === 'ko' ? '컴포넌트 트리' : 'Component Tree'}</span>
                        <span className="text-white/40">Mermaid</span>
                      </div>
                      <div className="flex items-center justify-between text-white/50">
                        <span>📐 {lang === 'ko' ? '와이어프레임' : 'Wireframes'}</span>
                        <span className="text-white/40">HTML</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl text-white/30">→</div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <span className="mb-3 block text-xs uppercase text-white/50">
                      {lang === 'ko' ? '최종 산출물' : 'Output'}
                    </span>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">🖼️ {lang === 'ko' ? 'UI 목업' : 'UI Mockups'}</span>
                      <span className="text-white/40">SVG</span>
                    </div>
                  </div>
                </div>
              )}

              {section.visual === 'voice' && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="space-y-4">
                    <div>
                      <span className="mb-2 block text-xs uppercase text-white/50">
                        {lang === 'ko' ? '음성 입력' : 'Voice Input'}
                      </span>
                      <div className="space-y-1 text-sm text-white/60">
                        <div>🎙️ {lang === 'ko' ? '회의 녹음 (WebM/MP3)' : 'Meeting Recording (WebM/MP3)'}</div>
                        <div>🔊 {lang === 'ko' ? '실시간 마이크 입력' : 'Live Microphone Input'}</div>
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-indigo-500/30 bg-indigo-500/10 p-3">
                      <span className="mb-1 block text-xs uppercase text-indigo-400">
                        {lang === 'ko' ? 'AI 분석' : 'AI Analysis'}
                      </span>
                      <div className="text-sm font-medium text-white">
                        ⚡ {lang === 'ko' ? 'Gemini Native Audio Processing' : 'Gemini Native Audio Processing'}
                      </div>
                    </div>
                    <div>
                      <span className="mb-2 block text-xs uppercase text-white/50">
                        {lang === 'ko' ? '구조화 출력' : 'Structured Output'}
                      </span>
                      <div className="space-y-1 text-sm text-white/60">
                        <div>📋 {lang === 'ko' ? '요구사항 · 의사결정 · 액션아이템' : 'Requirements · Decisions · Action Items'}</div>
                        <div>🔑 {lang === 'ko' ? '설계 키워드 자동 추출' : 'Design Keywords Auto-extracted'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Feature2Section;
