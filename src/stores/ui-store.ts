import { UIStore } from "@/types/resume";
import { create } from "zustand";

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeSection: "personal",
  previewMode: false,
  isExporting: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setActiveSection: (section: string) => set({ activeSection: section }),

  setPreviewMode: (enabled: boolean) => set({ previewMode: enabled }),

  setExporting: (exporting: boolean) => set({ isExporting: exporting }),
}));
