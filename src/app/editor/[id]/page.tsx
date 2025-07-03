'use client';

import { ExportModal } from '@/components/ExportModal';
import { ResumeEditor } from '@/components/ResumeEditor';
import { Sidebar } from '@/components/Sidebar';
import { Toolbar } from '@/components/Toolbar';
import { useResumeStore } from '@/stores/resume-store';
import { useUIStore } from '@/stores/ui-store';
import { AzizulClassicTemplate } from '@/templates/AzizulClassicTemplate';
import {
    Box,
    Button,
    CircularProgress,
    Drawer,
    Paper,
    Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const resumeId = params.id as string;

    const { currentResume, loadResume, isLoading, error } = useResumeStore();
    const { sidebarOpen, previewMode } = useUIStore();
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        if (resumeId && (!currentResume || currentResume.id !== resumeId)) {
            loadResume(resumeId).catch((error) => {
                console.error('Failed to load resume:', error);
                router.push('/');
            });
        }
    }, [resumeId, currentResume, loadResume, router]);

    if (isLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error || !currentResume) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
                    <Typography variant="h4" gutterBottom>
                        Resume Not Found
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        {error || 'The resume you are looking for could not be loaded.'}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => router.push('/')}
                    >
                        Go Back Home
                    </Button>
                </Paper>
            </Box>
        );
    }

    const renderTemplate = () => {
        switch (currentResume.templateId) {
            case 'azizul-classic':
            default:
                return <AzizulClassicTemplate data={currentResume} />;
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Toolbar onExport={() => setShowExportModal(true)} />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Drawer
                    variant="persistent"
                    open={sidebarOpen && !previewMode}
                    sx={{
                        width: sidebarOpen && !previewMode ? 320 : 0,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 320,
                            boxSizing: 'border-box',
                            position: 'relative',
                        },
                    }}
                >
                    <Sidebar />
                </Drawer>

                {/* Main Content */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Editor Panel */}
                    {!previewMode && (
                        <Box
                            sx={{
                                width: '50%',
                                backgroundColor: 'background.paper',
                                borderRight: '1px solid',
                                borderColor: 'divider',
                                overflow: 'auto',
                            }}
                        >
                            <ResumeEditor />
                        </Box>
                    )}

                    {/* Preview Panel */}
                    <Box
                        sx={{
                            width: previewMode ? '100%' : '50%',
                            backgroundColor: 'grey.50',
                            overflow: 'auto',
                            display: 'flex',
                            justifyContent: 'center',
                            py: 3,
                        }}
                    >
                        <Box sx={{ maxWidth: '100%' }}>
                            {renderTemplate()}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Export Modal */}
            {showExportModal && (
                <ExportModal
                    resume={currentResume}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </Box>
    );
}
