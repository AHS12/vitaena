import { ResumeService } from "@/lib/database";
import { createDefaultResumeData } from "@/lib/utils";
import { ResumeData, ResumeStore } from "@/types/resume";
import { create } from "zustand";

export const useResumeStore = create<ResumeStore>((set, get) => ({
  currentResume: null,
  resumes: [],
  templates: [],
  isLoading: false,
  error: null,

  createResume: async (templateId: string) => {
    set({ isLoading: true, error: null });

    try {
      const templates = get().templates;
      const template = templates.find((t) => t.id === templateId);

      if (!template) {
        throw new Error("Template not found");
      }

      const newResume = createDefaultResumeData(templateId);
      await ResumeService.saveResume(newResume);

      const resumes = await ResumeService.getAllResumes();
      set({
        currentResume: newResume,
        resumes,
        isLoading: false,
      });

      return newResume.id;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create resume",
        isLoading: false,
      });
      throw error;
    }
  },

  loadResume: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const resume = await ResumeService.getResume(id);

      if (!resume) {
        throw new Error("Resume not found");
      }

      set({
        currentResume: resume,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load resume",
        isLoading: false,
      });
      throw error;
    }
  },

  saveResume: async (resume: ResumeData) => {
    set({ isLoading: true, error: null });

    try {
      await ResumeService.saveResume(resume);

      const resumes = await ResumeService.getAllResumes();
      set({
        currentResume: resume,
        resumes,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to save resume",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteResume: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await ResumeService.deleteResume(id);

      const resumes = await ResumeService.getAllResumes();
      const currentResume = get().currentResume;

      set({
        resumes,
        currentResume: currentResume?.id === id ? null : currentResume,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete resume",
        isLoading: false,
      });
      throw error;
    }
  },

  updateResumeField: <K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K]
  ) => {
    const currentResume = get().currentResume;
    if (!currentResume) return;

    const updatedResume: ResumeData = {
      ...currentResume,
      [field]: value,
      updatedAt: new Date(),
    };

    set({ currentResume: updatedResume });

    // Auto-save after a short delay
    setTimeout(() => {
      ResumeService.saveResume(updatedResume).catch((error) => {
        set({
          error: error instanceof Error ? error.message : "Failed to auto-save",
        });
      });
    }, 1000);
  },

  exportToPDF: async (resumeId: string) => {
    set({ isLoading: true, error: null });

    try {
      // This will be implemented with Puppeteer API
      const resume = await ResumeService.getResume(resumeId);
      if (!resume) throw new Error("Resume not found");

      // TODO: Implement PDF export logic
      console.log("Exporting to PDF:", resume.personalInfo.name);

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to export PDF",
        isLoading: false,
      });
      throw error;
    }
  },

  duplicateResume: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const newId = await ResumeService.duplicateResume(id);
      const resumes = await ResumeService.getAllResumes();

      set({
        resumes,
        isLoading: false,
      });

      return newId;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to duplicate resume",
        isLoading: false,
      });
      throw error;
    }
  },
}));
