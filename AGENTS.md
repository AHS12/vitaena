# Vitaena (Offline Resume Maker) - Agent Guide

This document provides context, philosophy, and guidelines for AI agents working on the Vitaena project.

## 1. Project Overview & Philosophy

**Vitaena** is a privacy-first, offline-capable resume builder running entirely in the browser.

- **Core Philosophy:**
  - **Privacy First:** No user data is ever sent to a server for storage. All data resides in the user's browser (IndexedDB).
  - **Offline First:** The app must be fully functional without an internet connection (PWA).
  - **No AI Text Generation:** The user writes their own content. We do not generate resume text for them.
  - **Professional Output:** High-quality PDF export without watermarks.

## 2. Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS v4 (Utility-first) + Material UI (MUI) for complex interactive components.
- **State Management:** Zustand
- **Database (Client):** Dexie.js (IndexedDB wrapper)
- **PDF Generation:** Puppeteer (via Next.js API routes)
- **Icons:** Lucide React
- **Package Manager:** pnpm

## 3. Directory Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components.
  - `src/components/editors`: Form editors for specific resume sections.
  - `src/components/ui`: Generic UI components.
- `src/lib`: Utilities, database configuration, and helper functions.
  - `database.ts`: Dexie.js configuration and service layer.
  - `utils.ts`: General helper functions.
- `src/stores`: Global state management (Zustand).
  - `resume-store.ts`: Main store for resume data and operations.
- `src/types`: TypeScript definitions.
  - `resume.ts`: Core data models (`ResumeData`, `WorkExperience`, etc.).
- `src/templates`: Resume template definitions and React components.

## 4. Coding Guidelines

### General
- **Strict TypeScript:** Always define interfaces for props and data structures. Avoid `any`.
- **Functional Components:** Use React functional components with hooks.
- **Client Components:** Since this is a highly interactive local-first app, many components will need `"use client"`.

### State Management
- Use **Zustand** for global application state (current resume, list of resumes).
- Use **Local State** (React `useState`) for transient UI states (modals, form inputs before saving).
- **Persistence:** Ensure state changes that need to persist are synced to `Dexie.js` via `ResumeService`.

### Styling
- Use **Tailwind CSS** for layout, spacing, and typography.
- Use **MUI (Material UI)** for form inputs, buttons, sliders, and complex UI elements to maintain consistency.
- Ensure all designs are **Responsive** (Mobile, Tablet, Desktop).

### Data Handling
- **Resume Data:** Follow the `ResumeData` interface in `src/types/resume.ts`.
- **Dates:** Use structured date objects (`DateRange`) rather than raw strings where possible.
- **Visibility:** Respect `showX` boolean flags to toggle section/item visibility in the output.

### PDF Export
- PDF generation happens via Puppeteer.
- Ensure any new visual elements render correctly in a headless browser environment.

## 5. Development Workflow

- **Package Manager:** Always use `pnpm`.
- **Commands:**
  - `pnpm dev`: Start development server.
  - `pnpm build`: Build for production.
  - `pnpm lint`: Run linting.

## 6. Critical Constraints

- **DO NOT** introduce external dependencies that require server-side storage or tracking.
- **DO NOT** add features that break offline functionality.
- **DO NOT** suggest AI-writing features (e.g., "Generate summary for me").

## 7. Common Tasks & Patterns

- **Adding a new Resume Section:**
  1. Update `ResumeData` interface in `src/types/resume.ts`.
  2. Update `createDefaultResumeData` in `src/lib/utils.ts`.
  3. Create a new editor component in `src/components/editors`.
  4. Update templates in `src/templates` to render the new section.

- **Modifying the Database:**
  - Update `ResumeDatabase` class in `src/lib/database.ts`.
  - Handle versioning carefully (Dexie `version(n).stores(...)`).
