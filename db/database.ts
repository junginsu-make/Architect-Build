import Dexie, { type EntityTable } from 'dexie';
import type { Project } from '../types/project';

export interface StoredMessage {
  id?: number;
  projectId: string;
  text: string;
  sender: string;
  createdAt: number;
}

export interface StoredDeliverable {
  id?: number;
  projectId: string;
  type: string;
  data: string;
  createdAt: number;
}

class ArchitectDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  messages!: EntityTable<StoredMessage, 'id'>;
  deliverables!: EntityTable<StoredDeliverable, 'id'>;

  constructor() {
    super('ArchitectDB');
    this.version(1).stores({
      projects: 'id, status, updatedAt',
      messages: '++id, projectId, createdAt',
      deliverables: '++id, projectId, type, createdAt',
    });
  }
}

export const db = new ArchitectDB();
