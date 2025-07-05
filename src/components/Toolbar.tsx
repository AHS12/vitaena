import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useResponsive } from '@/hooks';
import { useResumeStore } from '@/stores/resume-store';
import { useUIStore } from '@/stores/ui-store';
import {
    Download,
    Home,
    Menu,
    Save,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import {
    AppBar,
    Box,
    Button,
    Divider,
    IconButton,
    Toolbar as MuiToolbar,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';

interface ToolbarProps {
    onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onExport }) => {
    const router = useRouter();
    const {
        previewMode,
        toggleSidebar,
        setPreviewMode
    } = useUIStore();
    const { currentResume, saveResume, isLoading } = useResumeStore();
    const { isDesktop, deviceType } = useResponsive();

    // Check if we should show realtime preview
    const shouldShowRealtimePreview = deviceType === 'desktop' ||
        (deviceType === 'tablet' && window.innerWidth > window.innerHeight); // Tablet landscape

    const handleSave = async () => {
        if (currentResume) {
            try {
                await saveResume(currentResume);
            } catch (error) {
                console.error('Failed to save resume:', error);
            }
        }
    };

    return (
        <AppBar position="static" color="default" elevation={1}>
            <MuiToolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 }, // Smaller gap on mobile
                    flex: 1 // Allow this to grow and push right content
                }}>
                    {/* Mobile/Tablet: Hamburger menu */}
                    {!isDesktop && (
                        <IconButton
                            onClick={toggleSidebar}
                            color="inherit"
                            size="small" // Smaller size for mobile
                        >
                            <Menu fontSize="small" />
                        </IconButton>
                    )}

                    {/* Desktop: Home button */}
                    {isDesktop && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => router.push('/')}
                            startIcon={<Home />}
                        >
                            Home
                        </Button>
                    )}

                    {/* Desktop: Menu button */}
                    {isDesktop && (
                        <IconButton
                            onClick={toggleSidebar}
                            color="inherit"
                        >
                            <Menu />
                        </IconButton>
                    )}

                    <Divider orientation="vertical" flexItem />

                    <Typography variant="h6" component="h1" sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }, // Even smaller on mobile
                        fontWeight: { xs: 500, sm: 600 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '150px', sm: '250px', md: 'none' }, // Limit width on mobile
                    }}>
                        {currentResume?.personalInfo.name || 'Untitled Resume'}
                    </Typography>
                </Box>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1, md: 1 } // Smaller gap on mobile only
                }}>
                    <ThemeToggle />

                    {/* Desktop: Full save button */}
                    {isDesktop && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSave}
                            disabled={isLoading}
                            startIcon={<Save />}
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    )}

                    {/* Tablet: Full save button */}
                    {deviceType === 'tablet' && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSave}
                            disabled={isLoading}
                            startIcon={<Save />}
                        >
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    )}

                    {/* Mobile only: Save icon only */}
                    {deviceType === 'mobile' && (
                        <IconButton
                            onClick={handleSave}
                            disabled={isLoading}
                            color="inherit"
                            size="small"
                            title={isLoading ? 'Saving...' : 'Save'}
                        >
                            <Save fontSize="small" />
                        </IconButton>
                    )}

                    {/* Desktop: Full preview button */}
                    {isDesktop && (
                        <Button
                            variant={previewMode ? "contained" : "outlined"}
                            size="small"
                            onClick={() => setPreviewMode(!previewMode)}
                            startIcon={previewMode ? <VisibilityOff /> : <Visibility />}
                        >
                            {shouldShowRealtimePreview ?
                                (previewMode ? 'Exit Preview' : 'Preview') :
                                'Preview'
                            }
                        </Button>
                    )}

                    {/* Tablet: Full preview button */}
                    {deviceType === 'tablet' && (
                        <Button
                            variant={previewMode ? "contained" : "outlined"}
                            size="small"
                            onClick={() => setPreviewMode(!previewMode)}
                            startIcon={previewMode ? <VisibilityOff /> : <Visibility />}
                        >
                            Preview
                        </Button>
                    )}

                    {/* Mobile only: Preview icon button */}
                    {deviceType === 'mobile' && (
                        <IconButton
                            onClick={() => setPreviewMode(!previewMode)}
                            color={previewMode ? "primary" : "inherit"}
                            size="small"
                            title={previewMode ? 'Exit Preview' : 'Preview'}
                        >
                            {previewMode ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                    )}

                    {/* Desktop: Full export button */}
                    {isDesktop && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={onExport}
                            startIcon={<Download />}
                        >
                            Export
                        </Button>
                    )}

                    {/* Tablet: Full export button */}
                    {deviceType === 'tablet' && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={onExport}
                            startIcon={<Download />}
                        >
                            Export
                        </Button>
                    )}

                    {/* Mobile only: Export icon button */}
                    {deviceType === 'mobile' && (
                        <IconButton
                            onClick={onExport}
                            color="primary"
                            size="small"
                            title="Export PDF"
                        >
                            <Download fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </MuiToolbar>
        </AppBar>
    );
};
