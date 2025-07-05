import { UIStore } from "@/types/resume";
import { create } from "zustand";

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: false, // Start closed by default
  activeSection: "personal",
  previewMode: false,
  isExporting: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setActiveSection: (section: string) => set({ activeSection: section }),

  setPreviewMode: (enabled: boolean) => set({ previewMode: enabled }),

  setExporting: (exporting: boolean) => set({ isExporting: exporting }),

  // Helper to initialize sidebar state based on screen size
  initializeSidebarState: (isDesktop: boolean) => {
    const currentState = get();
    // Only open sidebar by default on desktop
    if (isDesktop && !currentState.sidebarOpen) {
      set({ sidebarOpen: true });
    }
  },
}));
