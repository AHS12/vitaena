'use client';

import { ExportModal } from '@/components/ExportModal';
import { ResponsiveSidebar } from '@/components/ResponsiveSidebar';
import { ResumeEditor } from '@/components/ResumeEditor';
import { Toolbar } from '@/components/Toolbar';
import { useResponsive } from '@/hooks';
import { useResumeStore } from '@/stores/resume-store';
import { useUIStore } from '@/stores/ui-store';
import { ModernClassicTemplate, ModernClassicBlackTemplate, ModernClassicFlippedTemplate, ModernCVTemplate } from '@/templates';
import {
    Box,
    Button,
    Paper,
    Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const resumeId = params.id as string;

    const { currentResume, loadResume, error, loadTemplates } = useResumeStore();
    const { previewMode, setVisibleSections } = useUIStore();
    const { deviceType } = useResponsive();
    const [showExportModal, setShowExportModal] = useState(false);
    const [previewScale, setPreviewScale] = useState(0.6);

    // Check if we should show realtime preview
    const shouldShowRealtimePreview = deviceType === 'desktop' ||
        (deviceType === 'tablet' && typeof window !== 'undefined' && window.innerWidth > window.innerHeight); // Tablet landscape    // Calculate responsive scale based on screen size
    useEffect(() => {
        const updateScale = () => {
            const screenWidth = window.innerWidth;
            let scale = 0.55; // Default scale (reduced from 0.6)

            if (screenWidth >= 1920) {
                scale = 0.75; // Large screens (reduced from 0.85)
            } else if (screenWidth >= 1536) {
                scale = 0.68; // Medium-large screens (reduced from 0.75)
            } else if (screenWidth >= 1280) {
                scale = 0.6; // Medium screens (reduced from 0.65)
            } else if (screenWidth >= 1024) {
                scale = 0.55; // Small-medium screens (reduced from 0.6)
            } else {
                scale = 0.45; // Small screens (reduced from 0.5)
            }

            setPreviewScale(scale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    useEffect(() => {
        if (resumeId && (!currentResume || currentResume.id !== resumeId)) {
            loadResume(resumeId).catch((error) => {
                console.error('Failed to load resume:', error);
                router.push('/');
            });
        }
        loadTemplates();
    }, [resumeId, currentResume, loadResume, router, loadTemplates]);

    useEffect(() => {
        if (currentResume) {
            setVisibleSections(currentResume.category);
        }
    }, [currentResume, setVisibleSections]);

    if (error || !currentResume) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                    background: theme => theme.palette.mode === 'light'
                        ? 'radial-gradient(circle at 20% 20%, rgba(97, 192, 190, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(74, 144, 164, 0.05) 0%, transparent 50%)'
                        : 'radial-gradient(circle at 20% 20%, rgba(97, 192, 190, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(74, 144, 164, 0.02) 0%, transparent 50%)',
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
                        sx={{
                            background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4A90A4 0%, #61C0BE 100%)',
                            }
                        }}
                    >
                        Go Back Home
                    </Button>
                </Paper>
            </Box>
        );
    }

    const renderTemplate = () => {
        switch (currentResume.templateId) {
            case 'modern-classic-black':
                return <ModernClassicBlackTemplate
                    data={currentResume}
                    scale={previewScale}
                    isPreview={true}
                />;
            case 'modern-classic-flipped':
                return <ModernClassicFlippedTemplate
                    data={currentResume}
                    scale={previewScale}
                    isPreview={true}
                />;
            case 'modern-cv':
                return <ModernCVTemplate
                    data={currentResume}
                    scale={previewScale}
                    isPreview={true}
                />;
            case 'modern-classic':
            default:
                return <ModernClassicTemplate
                    data={currentResume}
                    scale={previewScale}
                    isPreview={true}
                />;
        }
    };

    const renderExportTemplate = () => {
        switch (currentResume.templateId) {
            case 'modern-classic-black':
                return <ModernClassicBlackTemplate
                    data={currentResume}
                    scale={1}
                    isPreview={false}
                />;
            case 'modern-classic-flipped':
                return <ModernClassicFlippedTemplate
                    data={currentResume}
                    scale={1}
                    isPreview={false}
                />;
            case 'modern-cv':
                return <ModernCVTemplate
                    data={currentResume}
                    scale={1}
                    isPreview={false}
                />;
            case 'modern-classic':
            default:
                return <ModernClassicTemplate
                    data={currentResume}
                    scale={1}
                    isPreview={false}
                />;
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: 'background.default',
            background: theme => theme.palette.mode === 'light'
                ? 'radial-gradient(circle at 20% 20%, rgba(97, 192, 190, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(74, 144, 164, 0.05) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 20%, rgba(97, 192, 190, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(74, 144, 164, 0.02) 0%, transparent 50%)'
        }}>
            <Toolbar onExport={() => setShowExportModal(true)} />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 64px)' }}>
                {/* Responsive Sidebar */}
                <ResponsiveSidebar isPreviewMode={previewMode} />

                {/* Main Content */}
                <Box sx={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden',
                    height: '100%',
                    flexDirection: { xs: 'column', md: 'row' }, // Stack on mobile, side-by-side on tablet+
                }}>
                    {/* Editor Panel */}
                    {(!previewMode || shouldShowRealtimePreview) && (
                        <Box
                            sx={{
                                width: {
                                    xs: '100%',
                                    md: shouldShowRealtimePreview ? (previewMode ? '0%' : '50%') : '100%'
                                },
                                height: {
                                    xs: shouldShowRealtimePreview ? '50%' : '100%',
                                    md: '100%'
                                },
                                backgroundColor: 'background.paper',
                                borderRight: { xs: 'none', md: shouldShowRealtimePreview ? '1px solid' : 'none' },
                                borderBottom: { xs: shouldShowRealtimePreview ? '1px solid' : 'none', md: 'none' },
                                borderColor: 'divider',
                                overflow: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <ResumeEditor />
                        </Box>
                    )}

                    {/* Preview Panel */}
                    {(previewMode || shouldShowRealtimePreview) && (
                        <Box
                            sx={{
                                width: {
                                    xs: '100%',
                                    md: shouldShowRealtimePreview ? (previewMode ? '100%' : '50%') : '100%'
                                },
                                height: {
                                    xs: shouldShowRealtimePreview ? '50%' : '100%',
                                    md: '100%'
                                },
                                backgroundColor: 'background.default',
                                background: theme => theme.palette.mode === 'light'
                                    ? 'radial-gradient(circle at 30% 40%, rgba(97, 192, 190, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(74, 144, 164, 0.1) 0%, transparent 50%)'
                                    : 'radial-gradient(circle at 30% 40%, rgba(97, 192, 190, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(74, 144, 164, 0.05) 0%, transparent 50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    flex: 1,
                                    overflow: 'auto',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start',
                                    py: { xs: 2, sm: 3, md: 4 },
                                    px: { xs: 1, sm: 2, md: 3 },
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        backgroundColor: '#f1f1f1',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#c1c1c1',
                                        borderRadius: '4px',
                                        '&:hover': {
                                            backgroundColor: '#a8a8a8',
                                        },
                                    },
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'flex-start',
                                    width: '100%',
                                    maxWidth: '100%',
                                    minHeight: 'fit-content'
                                }}>
                                    {renderTemplate()}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Export Modal */}
            {showExportModal && (
                <ExportModal
                    resume={currentResume}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            {/* Hidden full-scale template for export */}
            <Box sx={{
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: -1
            }}>
                <div data-export-template>
                    {renderExportTemplate()}
                </div>
            </Box>
        </Box>
    );
}
