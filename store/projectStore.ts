import { create } from 'zustand';
import type { Project } from '../types/project';
import { db } from '../db/database';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;

  loadProjects: () => Promise<void>;
  createProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;
  getCurrentProject: () => Project | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,

  loadProjects: async () => {
    const projects = await db.projects.orderBy('updatedAt').reverse().toArray();
    set({ projects });
  },

  createProject: async (project) => {
    await db.projects.add(project);
    set((s) => ({ projects: [project, ...s.projects], currentProjectId: project.id }));
  },

  updateProject: async (id, updates) => {
    await db.projects.update(id, { ...updates, updatedAt: Date.now() });
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p)),
    }));
  },

  deleteProject: async (id) => {
    await db.projects.delete(id);
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
    }));
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  getCurrentProject: () => {
    const { projects, currentProjectId } = get();
    return projects.find((p) => p.id === currentProjectId);
  },
}));
