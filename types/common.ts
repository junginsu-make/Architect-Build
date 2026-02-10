import type { ReactNode } from 'react';

export enum Sender {
  USER = 'user',
  BOT = 'bot',
}

export enum Language {
  KO = 'ko',
  EN = 'en',
}

export interface Message {
  id: string;
  text: ReactNode;
  sender: Sender;
}

export interface DocumentContext {
  fileName?: string;
  content: string;
  type: 'pdf' | 'text';
}
