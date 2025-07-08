import { useOfflineNavigation } from '@/components/OfflineNavigation';
import { TemplateSwitcher } from '@/components/TemplateSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useResponsive } from '@/hooks';
import { useResumeStore } from '@/stores/resume-store';
import { useUIStore } from '@/stores/ui-store';
import {
    Download,
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
    Snackbar,
    Alert
} from '@mui/material';
import React, { useState } from 'react';

interface ToolbarProps {
    onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onExport }) => {
    const { navigate } = useOfflineNavigation();
    const [
        snackbarOpen,
        setSnackbarOpen
    ] = useState(false);
    const [
        snackbarMessage,
        setSnackbarMessage
    ] = useState('');
    const [
        snackbarSeverity,
        setSnackbarSeverity
    ] = useState<'success' | 'error'>('success');

    const {
        previewMode,
        toggleSidebar,
        setPreviewMode
    } = useUIStore();
    const { currentResume, saveResume, isLoading } = useResumeStore();
    const { isDesktop, isTablet, deviceType } = useResponsive();

    // Check if we should show realtime preview
    const shouldShowRealtimePreview = deviceType === 'desktop' ||
        (deviceType === 'tablet' && window.innerWidth > window.innerHeight); // Tablet landscape

    const handleSave = async () => {
        if (currentResume) {
            try {
                await saveResume(currentResume);
                setSnackbarMessage('Resume saved successfully!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
            } catch (error) {
                console.error('Failed to save resume:', error);
                setSnackbarMessage('Failed to save resume.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        }
    };

    const handleCloseSnackbar = (
        event?: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    return (
        <AppBar position="static"
            sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderBottomColor: 'divider',
                boxShadow: 'none'
            }}
        >
            <MuiToolbar sx={{ justifyContent: 'space-between' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 }, // Smaller gap on mobile
                    flex: 1 // Allow this to grow and push right content
                }}>
                    {/* Vitaena Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            component="img"
                            src="/logo.svg"
                            alt="Vitaena Logo"
                            sx={{
                                width: { xs: 28, sm: 32, md: 36 },
                                height: { xs: 28, sm: 32, md: 36 },
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                            onClick={() => navigate('/')}
                        />
                    </Box>

                    {/* Menu button */}
                    <IconButton
                        onClick={toggleSidebar}
                        size={isDesktop ? 'medium' : 'small'}
                        sx={{
                            color: 'text.primary',
                            '&:hover': {
                                backgroundColor: 'rgba(97, 192, 190, 0.1)',
                                color: '#61C0BE'
                            }
                        }}
                    >
                        <Menu fontSize={isDesktop ? 'medium' : 'small'} />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    <Typography variant="h6" component="h1" sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }, // Even smaller on mobile
                        fontWeight: { xs: 500, sm: 600 },
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '120px', sm: '180px', md: 'none' }, // Limit width on mobile
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

                    {(isDesktop || isTablet) && <TemplateSwitcher size="small" />}

                    {/* Desktop: Full save button */}
                    {isDesktop && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleSave}
                            disabled={isLoading}
                            startIcon={<Save />}
                            sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                }
                            }}
                        >
                            Save
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
                            sx={{
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                }
                            }}
                        >
                            Save
                        </Button>
                    )}

                    {/* Mobile only: Save icon only */}
                    {deviceType === 'mobile' && (
                        <IconButton
                            onClick={handleSave}
                            disabled={isLoading}
                            color="primary"
                            size="small"
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
                            sx={{
                                borderColor: 'primary.main',
                                color: previewMode ? 'white' : 'primary.main',
                                backgroundColor: previewMode ? 'primary.main' : 'transparent',
                                '&:hover': {
                                    backgroundColor: previewMode ? 'primary.dark' : 'primary.main',
                                    color: 'white'
                                }
                            }}
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
                            sx={{
                                borderColor: 'primary.main',
                                color: previewMode ? 'white' : 'primary.main',
                                backgroundColor: previewMode ? 'primary.main' : 'transparent',
                                '&:hover': {
                                    backgroundColor: previewMode ? 'primary.dark' : 'primary.main',
                                    color: 'white'
                                }
                            }}
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
                            sx={{
                                background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #4A90A4 0%, #61C0BE 100%)',
                                }
                            }}
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
                            sx={{
                                background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #4A90A4 0%, #61C0BE 100%)',
                                }
                            }}
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
                            sx={{
                                background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)',
                                color: 'white',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #4A90A4 0%, #61C0BE 100%)',
                                }
                            }}
                        >
                            <Download fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </MuiToolbar>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </AppBar>
    );
};
