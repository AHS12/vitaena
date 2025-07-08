import { SectionId } from "@/lib/template-configs";
// Core types for the resume data structure
export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  linkedIn?: string;
  website?: string;
  photo?: string;
  showPhone: boolean;
  showEmail: boolean;
  showLocation: boolean;
  showLinkedIn: boolean;
  showWebsite: boolean;
  showPhoto: boolean;
}

export interface DateRange {
  startMonth?: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  isOngoing: boolean;
  customText?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  dateRange: DateRange;
  description: string;
  bullets: string[];
  showBullets: boolean;
  showDescription: boolean;
  showLocation: boolean;
  showDateRange: boolean;
  show: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  location: string;
  dateRange: DateRange;
  gpa?: string;
  showGpa: boolean;
  showLocation: boolean;
  showDateRange: boolean;
  show: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-5 scale
  show: boolean;
}

export interface Language {
  name: string;
  level: number; // 1-5 scale
  levelText: string; // e.g., "Native", "Proficient"
  show: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  link?: string;
  dateRange?: DateRange;
  technologies: string[];
  showLink: boolean;
  showDateRange: boolean;
  showDescription: boolean;
  show: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  location?: string;
  dateRange?: DateRange;
  link?: string;
  showLocation: boolean;
  showDateRange: boolean;
  showDescription: boolean;
  showLink: boolean;
  show: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  items: Array<{
    id: string;
    title?: string;
    description?: string;
    details?: string;
    dateRange?: DateRange;
    showDateRange?: boolean;
  }>;
  showTitle: boolean;
}

export interface StrengthItem {
  id: string;
  title: string;
  description: string;
  show: boolean;
}

export interface InterestItem {
  id: string;
  title: string;
  description: string;
  show: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: {
    month: number;
    year: number;
  };
  expirationDate?: {
    month: number;
    year: number;
  };
  credentialId?: string;
  credentialUrl?: string;
  showIssueDate: boolean;
  showExpirationDate: boolean;
  showCredentialId: boolean;
  showCredentialUrl: boolean;
  show: boolean;
}

export interface ResumeData {
  id: string;
  templateId: string;
  category: TemplateCategory;
  personalInfo: PersonalInfo;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  projects: Project[];
  activities: Activity[];
  customSections: CustomSection[];
  showSummary: boolean;
  showWorkExperience: boolean;
  showEducation: boolean;
  showSkills: boolean;
  showLanguages: boolean;
  showProjects: boolean;
  showActivities: boolean;
  strengths: StrengthItem[];
  showStrengths: boolean;
  interests: InterestItem[];
  showInterests: boolean;
  certifications: Certification[];
  showCertifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  component: string; // Component name for dynamic import
  category: TemplateCategory;
  isDefault: boolean;
}

// Store types
export interface ResumeStore {
  currentResume: ResumeData | null;
  resumes: ResumeData[];
  templates: ResumeTemplate[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTemplates: () => Promise<void>;
  createResume: (templateId: string) => Promise<string>;
  loadResume: (id: string) => Promise<void>;
  saveResume: (resume: ResumeData) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  updateResumeField: <K extends keyof ResumeData>(
    field: K,
    value: ResumeData[K]
  ) => void;
  exportToPDF: (resumeId: string) => Promise<void>;
  duplicateResume: (id: string) => Promise<string>;
}

// UI State types

export interface UIStore {
  sidebarOpen: boolean;
  activeSection: string;
  previewMode: boolean;
  isExporting: boolean;
  visibleSections: SectionId[];

  // Actions
  toggleSidebar: () => void;
  setActiveSection: (section: string) => void;
  setPreviewMode: (enabled: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setVisibleSections: (category: TemplateCategory) => void;
  initializeSidebarState: (isDesktop: boolean) => void;
}

// Color schemes for templates
export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textLight: string;
  background: string;
  border: string;
}

export interface TemplateConfig {
  colors: ColorScheme;
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    section: string;
    item: string;
  };
  layout: "single-column" | "two-column" | "mixed";
}

// Template categories
export enum TemplateCategory {
  RESUME = 'resume',
  CV = 'cv',
  BIODATA = 'biodata'
}
