import { create } from 'zustand';
import { Language } from '../types/common';
import type { IntakeMode } from '../types/project';

interface UIState {
  lang: Language;
  showGuide: boolean;
  activePanel: 'chat' | 'result';
  intakeMode: IntakeMode;

  setLang: (lang: Language) => void;
  toggleLang: () => void;
  toggleGuide: () => void;
  setActivePanel: (panel: 'chat' | 'result') => void;
  setIntakeMode: (mode: IntakeMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
  lang: Language.KO,
  showGuide: false,
  activePanel: 'chat',
  intakeMode: 'chat',

  setLang: (lang) => set({ lang }),
  toggleLang: () =>
    set((s) => ({ lang: s.lang === Language.KO ? Language.EN : Language.KO })),
  toggleGuide: () => set((s) => ({ showGuide: !s.showGuide })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setIntakeMode: (mode) => set({ intakeMode: mode }),
}));
