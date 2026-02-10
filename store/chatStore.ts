import { create } from 'zustand';
import type { ReactNode } from 'react';
import { Message, Sender } from '../types/common';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  chatPhase: number;
  userResponses: string[];
  additionalContext: string[];

  addMessage: (text: ReactNode, sender: Sender) => void;
  setLoading: (isLoading: boolean) => void;
  setPhase: (phase: number) => void;
  advancePhase: () => void;
  addUserResponse: (response: string) => void;
  addAdditionalContext: (context: string) => void;
  reset: () => void;
}

let _nextId = 0;

const initialChatState = {
  messages: [] as Message[],
  isLoading: false,
  chatPhase: 0,
  userResponses: [] as string[],
  additionalContext: [] as string[],
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialChatState,

  addMessage: (text, sender) =>
    set((s) => ({
      messages: [...s.messages, { id: String(++_nextId), text, sender }],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setPhase: (phase) => set({ chatPhase: phase }),

  advancePhase: () => set((s) => ({ chatPhase: s.chatPhase + 1 })),

  addUserResponse: (response) =>
    set((s) => ({ userResponses: [...s.userResponses, response] })),

  addAdditionalContext: (context) =>
    set((s) => ({ additionalContext: [...s.additionalContext, context] })),

  reset: () => set(initialChatState),
}));
