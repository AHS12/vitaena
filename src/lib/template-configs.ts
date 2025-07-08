import { TemplateCategory } from "@/types/resume";

export type SectionId = 
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "strengths"
  | "languages"
  | "certifications"
  | "projects"
  | "interests"
  | "activities";

export const TEMPLATE_SECTION_CONFIG: Record<TemplateCategory, SectionId[]> = {
  [TemplateCategory.RESUME]: [
    "personal",
    "summary",
    "experience",
    "education",
    "skills",
    "languages",
    "projects",
    "certifications",
    "strengths",
    "interests",
    "activities",
  ],
  [TemplateCategory.CV]: [
    "personal",
    "summary",
    "education",
    "experience",
    "projects",
    "certifications",
    "publications", // Example for CV
    "awards", // Example for CV
    "skills",
    "languages",
    "interests",
    "activities",
  ],
  [TemplateCategory.BIODATA]: [
    "personal",
    "education",
    "family-details", // Example for Biodata
    "physical-attributes", // Example for Biodata
    "hobbies", // Example for Biodata
    "interests",
  ],
};

// Mapping of section IDs to display names
export const SECTION_NAMES: Record<SectionId, string> = {
  personal: "Personal Info",
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  strengths: "Strengths",
  languages: "Languages",
  certifications: "Certifications",
  projects: "Projects",
  interests: "Interests",
  activities: "Activities",
  // Add new section names here as they are introduced
  "publications": "Publications",
  "awards": "Awards",
  "family-details": "Family Details",
  "physical-attributes": "Physical Attributes",
  "hobbies": "Hobbies",
};
