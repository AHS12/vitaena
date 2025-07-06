'use client';

import { Close, WifiOff } from '@mui/icons-material';
import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setShowOfflineMessage(false);
            setIsDismissed(false); // Reset dismissal when back online
        };

        const handleOffline = () => {
            if (!isDismissed) {
                setShowOfflineMessage(true);
            }
        };

        // Set initial state
        if (!navigator.onLine && !isDismissed) {
            setShowOfflineMessage(true);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isDismissed]);

    const handleDismiss = () => {
        setShowOfflineMessage(false);
        setIsDismissed(true);
    };

    return (
        <Snackbar
            open={showOfflineMessage}
            onClose={handleDismiss}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ mb: 2 }}
        >
            <Alert
                severity="warning"
                sx={{
                    width: '100%',
                    alignItems: 'center',
                    '& .MuiAlert-message': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                    },
                }}
                icon={<WifiOff />}
                action={
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={handleDismiss}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                }
            >
                <Box>
                    <Typography variant="body2" fontWeight={600}>
                        You&apos;re offline
                    </Typography>
                    <Typography variant="caption">
                        Don&apos;t worry - Vitaena works offline! Your data is safe.
                    </Typography>
                </Box>
            </Alert>
        </Snackbar>
    );
}
