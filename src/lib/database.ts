import { ResumeData, ResumeTemplate, TemplateCategory } from "@/types/resume";
import Dexie, { Table } from "dexie";
import { generateId } from "./utils";

export interface StoredResume
  extends Omit<ResumeData, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id?: number;
  key: string;
  value: string | number | boolean | object;
  timestamp: string;
}

export class ResumeDatabase extends Dexie {
  resumes!: Table<StoredResume>;
  templates!: Table<ResumeTemplate>;
  settings!: Table<UserSettings>;

  constructor() {
    super("ResumeDatabase");

    this.version(1).stores({
      resumes: "id, templateId, personalInfo.name, createdAt, updatedAt",
      templates: "id, name, category, isDefault",
    });

    // Add settings table in version 2
    this.version(2).stores({
      resumes: "id, templateId, personalInfo.name, createdAt, updatedAt",
      templates: "id, name, category, isDefault",
      settings: "++id, key",
    });

    // Important: This callback is triggered for any user with a database
    // version below the version being upgraded to (2 in this case)
    this.on("versionchange", function (event) {
      console.log(
        `Database version changed: ${event.oldVersion} -> ${event.newVersion}`
      );
    });
  }
}

export const db = new ResumeDatabase();

// Settings keys
export const SETTINGS_KEYS = {
  PWA_INSTALL_DISMISSED: "pwa_install_dismissed",
};

// Settings Service for app preferences
export class SettingsService {
  static async setSetting(
    key: string,
    value: string | number | boolean | object
  ): Promise<void> {
    const setting: UserSettings = {
      key,
      value,
      timestamp: new Date().toISOString(),
    };

    await db.settings.put(setting);
  }

  static async getSetting(key: string): Promise<UserSettings | undefined> {
    return await db.settings.where("key").equals(key).first();
  }

  static async getPwaInstallDismissed(): Promise<boolean> {
    const setting = await this.getSetting(SETTINGS_KEYS.PWA_INSTALL_DISMISSED);

    if (!setting) return false;

    // Check if the dismissal has expired (24 hours)
    const dismissedTime = new Date(setting.timestamp);
    const currentTime = new Date();
    const hoursInMs = 24 * 60 * 60 * 1000; //24 hours

    return currentTime.getTime() - dismissedTime.getTime() < hoursInMs;
  }

  static async setPwaInstallDismissed(): Promise<void> {
    await this.setSetting(SETTINGS_KEYS.PWA_INSTALL_DISMISSED, true);
  }
}

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

    const resume: ResumeData = {
      ...storedResume,
      createdAt: new Date(storedResume.createdAt),
      updatedAt: new Date(storedResume.updatedAt),
    };

    // Data migration: Ensure strengths, interests, and certifications are arrays
    let needsUpdate = false;

    if (!Array.isArray(resume.strengths)) {
      resume.strengths = [];
      needsUpdate = true;
    }

    if (!Array.isArray(resume.interests)) {
      resume.interests = [];
      needsUpdate = true;
    }

    if (!Array.isArray(resume.certifications)) {
      resume.certifications = [];
      needsUpdate = true;
    }

    if (resume.showStrengths === undefined) {
      resume.showStrengths = false;
      needsUpdate = true;
    }

    if (resume.showInterests === undefined) {
      resume.showInterests = false;
      needsUpdate = true;
    }

    if (resume.showCertifications === undefined) {
      resume.showCertifications = false;
      needsUpdate = true;
    }

    if (resume.showWorkExperience === undefined) {
      resume.showWorkExperience = true;
      needsUpdate = true;
    }

    if (resume.showEducation === undefined) {
      resume.showEducation = true;
      needsUpdate = true;
    }

    if (resume.showSkills === undefined) {
      resume.showSkills = true;
      needsUpdate = true;
    }

    if (resume.showLanguages === undefined) {
      resume.showLanguages = true;
      needsUpdate = true;
    }

    if (resume.showProjects === undefined) {
      resume.showProjects = true;
      needsUpdate = true;
    }

    // Migrate individual items to have show property and unique IDs
    if (resume.skills.length > 0) {
      resume.skills.forEach((skill) => {
        if (skill.show === undefined) {
          skill.show = true;
          needsUpdate = true;
        }
        // Ensure all skills have a unique ID
        if (!skill.id) {
          skill.id = generateId();
          needsUpdate = true;
        }
      });
    }

    if (resume.languages.length > 0) {
      resume.languages.forEach((language) => {
        if (language.show === undefined) {
          language.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.strengths.length > 0) {
      resume.strengths.forEach((strength) => {
        if (strength.show === undefined) {
          strength.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.interests.length > 0) {
      resume.interests.forEach((interest) => {
        if (interest.show === undefined) {
          interest.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.certifications.length > 0) {
      resume.certifications.forEach((cert) => {
        if (cert.show === undefined) {
          cert.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.workExperience.length > 0) {
      resume.workExperience.forEach((exp) => {
        if (exp.show === undefined) {
          exp.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.education.length > 0) {
      resume.education.forEach((edu) => {
        if (edu.show === undefined) {
          edu.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.projects.length > 0) {
      resume.projects.forEach((project) => {
        if (project.show === undefined) {
          project.show = true;
          needsUpdate = true;
        }
      });
    }

    if (resume.activities.length > 0) {
      resume.activities.forEach((activity) => {
        if (activity.show === undefined) {
          activity.show = true;
          needsUpdate = true;
        }
      });
    }

    // If we had to migrate data, save the updated resume
    if (needsUpdate) {
      await this.saveResume(resume);
    }

    return resume;
  }

  static async getAllResumes(): Promise<ResumeData[]> {
    const storedResumes = await db.resumes
      .orderBy("updatedAt")
      .reverse()
      .toArray();

    const resumes = storedResumes.map((stored) => ({
      ...stored,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    }));

    // Data migration: Ensure strengths, interests, and certifications are arrays
    let needsUpdate = false;
    const migratedResumes = resumes.map((resume) => {
      const migrated = { ...resume };

      if (!Array.isArray(migrated.strengths)) {
        migrated.strengths = [];
        needsUpdate = true;
      }

      if (!Array.isArray(migrated.interests)) {
        migrated.interests = [];
        needsUpdate = true;
      }

      if (!Array.isArray(migrated.certifications)) {
        migrated.certifications = [];
        needsUpdate = true;
      }

      if (migrated.showStrengths === undefined) {
        migrated.showStrengths = false;
        needsUpdate = true;
      }

      if (migrated.showInterests === undefined) {
        migrated.showInterests = false;
        needsUpdate = true;
      }

      if (migrated.showCertifications === undefined) {
        migrated.showCertifications = false;
        needsUpdate = true;
      }

      if (migrated.showWorkExperience === undefined) {
        migrated.showWorkExperience = true;
        needsUpdate = true;
      }

      if (migrated.showEducation === undefined) {
        migrated.showEducation = true;
        needsUpdate = true;
      }

      if (migrated.showSkills === undefined) {
        migrated.showSkills = true;
        needsUpdate = true;
      }

      if (migrated.showLanguages === undefined) {
        migrated.showLanguages = true;
        needsUpdate = true;
      }

      if (migrated.showProjects === undefined) {
        migrated.showProjects = true;
        needsUpdate = true;
      }

      // Migrate individual items to have show property and unique IDs
      if (migrated.skills.length > 0) {
        migrated.skills.forEach((skill) => {
          if (skill.show === undefined) {
            skill.show = true;
            needsUpdate = true;
          }
          // Ensure all skills have a unique ID
          if (!skill.id) {
            skill.id = generateId();
            needsUpdate = true;
          }
        });
      }

      if (migrated.languages.length > 0) {
        migrated.languages.forEach((language) => {
          if (language.show === undefined) {
            language.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.strengths.length > 0) {
        migrated.strengths.forEach((strength) => {
          if (strength.show === undefined) {
            strength.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.interests.length > 0) {
        migrated.interests.forEach((interest) => {
          if (interest.show === undefined) {
            interest.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.certifications.length > 0) {
        migrated.certifications.forEach((cert) => {
          if (cert.show === undefined) {
            cert.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.workExperience.length > 0) {
        migrated.workExperience.forEach((exp) => {
          if (exp.show === undefined) {
            exp.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.education.length > 0) {
        migrated.education.forEach((edu) => {
          if (edu.show === undefined) {
            edu.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.projects.length > 0) {
        migrated.projects.forEach((project) => {
          if (project.show === undefined) {
            project.show = true;
            needsUpdate = true;
          }
        });
      }

      if (migrated.activities.length > 0) {
        migrated.activities.forEach((activity) => {
          if (activity.show === undefined) {
            activity.show = true;
            needsUpdate = true;
          }
        });
      }

      return migrated;
    });

    // If we had to migrate data, save the updated resumes
    if (needsUpdate) {
      await Promise.all(
        migratedResumes.map((resume) => this.saveResume(resume))
      );
    }

    return migratedResumes;
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
        id: "modern-classic",
        name: "Modern Classic",
        description:
          "A professional two-column layout with blue accents, perfect for software engineers",
        previewImage: "/templates/minimal-modern-preview.jpg",
        component: "ModernClassicTemplate",
        category: TemplateCategory.RESUME,
        isDefault: true,
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
    // Force upgrade to version 2 if needed
    if (db.verno < 2) {
      console.log("Database needs upgrading to version 2...");

      // Close the database first if it's open
      if (db.isOpen()) {
        console.log("Closing database before upgrade...");
        db.close();
      }

      // Force recreation of the database with the new schema
      try {
        await Dexie.delete("ResumeDatabase");
        console.log("Old database deleted");
      } catch (e) {
        console.warn("Could not delete old database:", e);
      }
    }

    console.log("Opening database...");
    await db.open();
    console.log(`Database opened successfully. Version: ${db.verno}`);

    // If this is version 2+, make sure we have the settings table
    if (db.verno >= 2) {
      console.log(
        "Database is at version 2 or higher, settings table should be available"
      );

      // Verify settings table exists by testing a read operation
      try {
        await db.settings.toArray();
        console.log("Settings table is accessible");

        // Initialize settings if needed
        const pwaSettings = await db.settings
          .where("key")
          .equals(SETTINGS_KEYS.PWA_INSTALL_DISMISSED)
          .first();
        console.log("PWA settings:", pwaSettings);
      } catch (e) {
        console.error("Error accessing settings table:", e);
      }
    } else {
      console.warn(
        "Database is at version lower than 2, settings functionality may not be available"
      );
    }

    // Initialize default templates
    await ResumeService.initializeTemplates();
    console.log("Templates initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};
