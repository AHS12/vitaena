'use client';

import { useThemeMode } from '@/components/theme-provider';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

export function ThemeToggle() {
    const { isDarkMode, toggleTheme } = useThemeMode();

    return (
        <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            <IconButton
                onClick={toggleTheme}
                color="inherit"
                sx={{
                    ml: 1,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'scale(1.1)',
                    },
                }}
            >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
        </Tooltip>
    );
}
