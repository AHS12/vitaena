import { ThemeToggle } from '@/components/ui/theme-toggle';
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => router.push('/')}
                        startIcon={<Home />}
                    >
                        Home
                    </Button>

                    <IconButton
                        onClick={toggleSidebar}
                        color="inherit"
                    >
                        <Menu />
                    </IconButton>

                    <Divider orientation="vertical" flexItem />

                    <Typography variant="h6" component="h1">
                        {currentResume?.personalInfo.name || 'Untitled Resume'}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ThemeToggle />

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleSave}
                        disabled={isLoading}
                        startIcon={<Save />}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </Button>

                    <Button
                        variant={previewMode ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setPreviewMode(!previewMode)}
                        startIcon={previewMode ? <VisibilityOff /> : <Visibility />}
                    >
                        {previewMode ? 'Exit Preview' : 'Preview'}
                    </Button>

                    <Button
                        variant="contained"
                        size="small"
                        onClick={onExport}
                        startIcon={<Download />}
                    >
                        Export PDF
                    </Button>
                </Box>
            </MuiToolbar>
        </AppBar>
    );
};
