import { create } from 'zustand';
import { Language } from '../types/common';
import type { IntakeMode } from '../types/project';

interface UIState {
  lang: Language;
  showGuide: boolean;
  activePanel: 'chat' | 'result';
  intakeMode: IntakeMode;
  showLanding: boolean;

  setLang: (lang: Language) => void;
  toggleLang: () => void;
  toggleGuide: () => void;
  setActivePanel: (panel: 'chat' | 'result') => void;
  setIntakeMode: (mode: IntakeMode) => void;
  setShowLanding: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  lang: Language.KO,
  showGuide: false,
  activePanel: 'chat',
  intakeMode: 'chat',
  showLanding: true,

  setLang: (lang) => set({ lang }),
  toggleLang: () =>
    set((s) => ({ lang: s.lang === Language.KO ? Language.EN : Language.KO })),
  toggleGuide: () => set((s) => ({ showGuide: !s.showGuide })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setIntakeMode: (mode) => set({ intakeMode: mode }),
  setShowLanding: (show) => set({ showLanding: show }),
}));
