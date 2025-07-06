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
                sx={{
                    ml: 1,
                    transition: 'all 0.3s ease',
                    border: '2px solid',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(97, 192, 190, 0.3)',
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(97, 192, 190, 0.1)',
                    color: isDarkMode ? 'white' : '#61C0BE',
                    '&:hover': {
                        transform: 'scale(1.1)',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#61C0BE',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(97, 192, 190, 0.2)',
                        boxShadow: isDarkMode
                            ? '0 4px 12px rgba(255, 255, 255, 0.2)'
                            : '0 4px 12px rgba(97, 192, 190, 0.3)',
                    },
                }}
            >
                {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
        </Tooltip>
    );
}
