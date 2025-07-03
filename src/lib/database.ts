import { ResumeData, ResumeTemplate } from "@/types/resume";
import Dexie, { Table } from "dexie";

export interface StoredResume
  extends Omit<ResumeData, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

export class ResumeDatabase extends Dexie {
  resumes!: Table<StoredResume>;
  templates!: Table<ResumeTemplate>;

  constructor() {
    super("ResumeDatabase");

    this.version(1).stores({
      resumes: "id, templateId, personalInfo.name, createdAt, updatedAt",
      templates: "id, name, category, isDefault",
    });
  }
}

export const db = new ResumeDatabase();

// Database operations
export class ResumeService {
  static async saveResume(resume: ResumeData): Promise<void> {
    const storedResume: StoredResume = {
      ...resume,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.resumes.put(storedResume);
  }

  static async getResume(id: string): Promise<ResumeData | null> {
    const storedResume = await db.resumes.get(id);
    if (!storedResume) return null;

    return {
      ...storedResume,
      createdAt: new Date(storedResume.createdAt),
      updatedAt: new Date(storedResume.updatedAt),
    };
  }

  static async getAllResumes(): Promise<ResumeData[]> {
    const storedResumes = await db.resumes
      .orderBy("updatedAt")
      .reverse()
      .toArray();

    return storedResumes.map((stored) => ({
      ...stored,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    }));
  }

  static async deleteResume(id: string): Promise<void> {
    await db.resumes.delete(id);
  }

  static async duplicateResume(id: string): Promise<string> {
    const original = await this.getResume(id);
    if (!original) throw new Error("Resume not found");

    const newId = `resume_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date();

    const duplicate: ResumeData = {
      ...original,
      id: newId,
      personalInfo: {
        ...original.personalInfo,
        name: `${original.personalInfo.name} (Copy)`,
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.saveResume(duplicate);
    return newId;
  }

  static async saveTemplate(template: ResumeTemplate): Promise<void> {
    await db.templates.put(template);
  }

  static async getTemplates(): Promise<ResumeTemplate[]> {
    return await db.templates.orderBy("name").toArray();
  }

  static async initializeTemplates(): Promise<void> {
    const existingTemplates = await db.templates.count();
    if (existingTemplates > 0) return;

    const defaultTemplates: ResumeTemplate[] = [
      {
        id: "azizul-classic",
        name: "Azizul Classic",
        description:
          "A professional two-column layout with blue accents, perfect for software engineers",
        previewImage: "/templates/azizul-classic-preview.jpg",
        component: "AzizulClassicTemplate",
        category: "modern",
        isDefault: true,
      },
      {
        id: "minimal-modern",
        name: "Minimal Modern",
        description: "Clean and minimalist single-column design",
        previewImage: "/templates/minimal-modern-preview.jpg",
        component: "MinimalModernTemplate",
        category: "minimalist",
        isDefault: false,
      },
    ];

    await db.templates.bulkAdd(defaultTemplates);
  }

  static async searchResumes(query: string): Promise<ResumeData[]> {
    const allResumes = await this.getAllResumes();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return allResumes;

    return allResumes.filter(
      (resume) =>
        resume.personalInfo.name.toLowerCase().includes(searchTerm) ||
        resume.personalInfo.title.toLowerCase().includes(searchTerm) ||
        resume.summary.toLowerCase().includes(searchTerm) ||
        resume.workExperience.some(
          (exp) =>
            exp.company.toLowerCase().includes(searchTerm) ||
            exp.position.toLowerCase().includes(searchTerm)
        )
    );
  }

  static async exportResumeData(id: string): Promise<string> {
    const resume = await this.getResume(id);
    if (!resume) throw new Error("Resume not found");

    return JSON.stringify(resume, null, 2);
  }

  static async importResumeData(jsonData: string): Promise<string> {
    try {
      const resumeData = JSON.parse(jsonData) as ResumeData;

      // Generate new ID and timestamps
      const newId = `resume_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const now = new Date();

      const importedResume: ResumeData = {
        ...resumeData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      await this.saveResume(importedResume);
      return newId;
    } catch {
      throw new Error("Invalid resume data format");
    }
  }
}

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await db.open();
    await ResumeService.initializeTemplates();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};
