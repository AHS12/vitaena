'use client';

import { initializeDatabase, ResumeService } from '@/lib/database';
import { useResumeStore } from '@/stores/resume-store';
import React, { useEffect } from 'react';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { templates } = useResumeStore();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('Initializing database...');
                await initializeDatabase();

                // Load templates if not already loaded
                if (templates.length === 0) {
                    console.log('Loading templates...');
                    const loadedTemplates = await ResumeService.getTemplates();
                    console.log('Loaded templates:', loadedTemplates);
                    useResumeStore.setState({ templates: loadedTemplates });
                }
            } catch (error) {
                console.error('Failed to initialize app:', error);
            }
        };

        initializeApp();
    }, [templates.length]);

    return (
        <>
            {children}
        </>
    );
}
