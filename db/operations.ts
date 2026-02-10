import { db, type StoredMessage, type StoredDeliverable } from './database';
import type { Project } from '../types/project';

// Project operations
export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function saveProject(project: Project): Promise<string> {
  await db.projects.put(project);
  return project.id;
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', [db.projects, db.messages, db.deliverables], async () => {
    await db.projects.delete(id);
    await db.messages.where('projectId').equals(id).delete();
    await db.deliverables.where('projectId').equals(id).delete();
  });
}

// Message operations
export async function getProjectMessages(projectId: string): Promise<StoredMessage[]> {
  return db.messages.where('projectId').equals(projectId).sortBy('createdAt');
}

export async function saveMessage(msg: Omit<StoredMessage, 'id'>): Promise<number> {
  return db.messages.add(msg as StoredMessage);
}

// Deliverable operations
export async function getProjectDeliverables(projectId: string): Promise<StoredDeliverable[]> {
  return db.deliverables.where('projectId').equals(projectId).sortBy('createdAt');
}

export async function saveDeliverable(deliverable: Omit<StoredDeliverable, 'id'>): Promise<number> {
  return db.deliverables.add(deliverable as StoredDeliverable);
}
