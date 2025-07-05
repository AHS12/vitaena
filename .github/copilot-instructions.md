# Copilot Instructions for Vitaena

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

Vitaena is a privacy-first local resume builder web application built with Next.js, TypeScript, and Tailwind CSS. The application allows users to create, edit, and export professional resumes using multiple templates. All data stays in the user's browser - no cloud, no tracking.

## Tech Stack

- **Frontend:** Next.js 15 with App Router, TypeScript, React 19
- **Styling:** Tailwind CSS v4
- **UI Components:** Material UI (MUI) for form components, inputs, and interactions
- **State Management:** Zustand for global state
- **Storage:** IndexedDB with Dexie.js for offline data persistence
- **PDF Generation:** Puppeteer for high-quality PDF exports
- **Icons:** Lucide React for consistent iconography
- **Package Manager:** pnpm

## Key Features

1. **Template System:** Multiple resume templates with pixel-perfect designs
2. **Real-time Preview:** Live preview as users edit their resume
3. **Offline Storage:** All data stored locally using IndexedDB
4. **PDF Export:** High-quality PDF generation from HTML
5. **Responsive Design:** Works on desktop and mobile devices

## Code Guidelines

- Use TypeScript with strict typing
- Follow React 19 best practices with App Router
- Use Tailwind CSS for all styling (avoid custom CSS files)
- **Use Material UI (MUI) for all form components, inputs, buttons, and interactive elements**
- Implement proper error handling for storage operations
- Use Zustand for state management with proper TypeScript types
- Create reusable components for resume sections
- Ensure accessibility compliance (ARIA labels, semantic HTML)
- Use pnpm for package management instead of npm or yarn

## File Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
- `/src/templates` - Resume template components
- `/src/lib` - Utility functions, database schema, and configurations
- `/src/stores` - Zustand store definitions
- `/src/types` - TypeScript type definitions

## Resume Data Structure

The resume data should follow a structured format to support multiple templates and easy editing. Include sections for:

- Personal information (name, contact, photo)
- Summary/Objective
- Work experience with date ranges
- Education
- Skills with proficiency levels
- Languages with proficiency
- Projects/Activities
- Custom sections for flexibility
