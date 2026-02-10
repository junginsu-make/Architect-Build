import { create } from 'zustand';
import type { SolutionBlueprint } from '../services/geminiService';

interface DeliverableState {
  blueprint: SolutionBlueprint | null;
  isExporting: boolean;

  setBlueprint: (blueprint: SolutionBlueprint) => void;
  clearBlueprint: () => void;
  setExporting: (isExporting: boolean) => void;
}

export const useDeliverableStore = create<DeliverableState>((set) => ({
  blueprint: null,
  isExporting: false,

  setBlueprint: (blueprint) => set({ blueprint }),
  clearBlueprint: () => set({ blueprint: null }),
  setExporting: (isExporting) => set({ isExporting }),
}));
