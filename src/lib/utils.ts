import { DateRange, ResumeData } from "@/types/resume";

export const createDefaultResumeData = (templateId: string): ResumeData => {
  const now = new Date();
  const id = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    templateId,
    personalInfo: {
      name: "",
      title: "",
      phone: "",
      email: "",
      location: "",
      linkedIn: "",
      website: "",
      photo: "",
      showPhone: true,
      showEmail: true,
      showLocation: true,
      showLinkedIn: true,
      showWebsite: false,
      showPhoto: true,
    },
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    activities: [],
    customSections: [],
    showSummary: true,
    showWorkExperience: true,
    showEducation: true,
    showSkills: true,
    showLanguages: true,
    showProjects: true,
    showActivities: true,
    strengths: [],
    showStrengths: false,
    interests: [],
    showInterests: false,
    certifications: [],
    showCertifications: false,
    createdAt: now,
    updatedAt: now,
  };
};

export const formatDateRange = (dateRange: DateRange): string => {
  const formatDate = (month?: number, year?: number) => {
    if (!year) return "";
    if (!month) return year.toString();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return `${monthNames[month - 1]} ${year}`;
  };

  if (dateRange.customText) {
    return dateRange.customText;
  }

  const startDate = formatDate(dateRange.startMonth, dateRange.startYear);
  const endDate = dateRange.isOngoing
    ? "Present"
    : formatDate(dateRange.endMonth, dateRange.endYear);

  if (!startDate && !endDate) return "";
  if (!startDate) return endDate;
  if (!endDate) return startDate;

  return `${startDate} - ${endDate}`;
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const downloadFile = (
  content: string,
  filename: string,
  contentType: string = "application/json"
) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const uploadFile = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    };

    input.click();
  });
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
