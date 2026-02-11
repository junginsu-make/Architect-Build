import { create } from 'zustand';
import type { SolutionBlueprint } from '../services/geminiService';
import { Language } from '../types/common';

interface DeliverableState {
  blueprint: SolutionBlueprint | null;
  blueprintLang: Language | null;
  translatedBlueprints: Partial<Record<Language, SolutionBlueprint>>;
  isTranslating: boolean;
  isExporting: boolean;

  setBlueprint: (blueprint: SolutionBlueprint, lang?: Language) => void;
  clearBlueprint: () => void;
  setExporting: (isExporting: boolean) => void;
  setTranslating: (isTranslating: boolean) => void;
  setTranslatedBlueprint: (lang: Language, blueprint: SolutionBlueprint) => void;
}

export const useDeliverableStore = create<DeliverableState>((set) => ({
  blueprint: null,
  blueprintLang: null,
  translatedBlueprints: {},
  isTranslating: false,
  isExporting: false,

  setBlueprint: (blueprint, lang) => set({
    blueprint,
    blueprintLang: lang ?? null,
    translatedBlueprints: lang ? { [lang]: blueprint } : {},
  }),
  clearBlueprint: () => set({
    blueprint: null,
    blueprintLang: null,
    translatedBlueprints: {},
    isTranslating: false,
  }),
  setExporting: (isExporting) => set({ isExporting }),
  setTranslating: (isTranslating) => set({ isTranslating }),
  setTranslatedBlueprint: (lang, blueprint) => set((state) => ({
    translatedBlueprints: { ...state.translatedBlueprints, [lang]: blueprint },
  })),
}));
