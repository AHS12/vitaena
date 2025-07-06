'use client';

import { Close, Download } from '@mui/icons-material';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
        };

        // Check if app is already installed
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
    };

    if (isInstalled || !showInstallPrompt) {
        return null;
    }

    return (
        <Snackbar
            open={showInstallPrompt}
            onClose={handleDismiss}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ mb: 2 }}
        >
            <Alert
                severity="info"
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
                <span>Install Vitaena for quick access!</span>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleInstallClick}
                    sx={{
                        background: 'linear-gradient(135deg, #61C0BE 0%, #4A9A98 100%)',
                        color: 'white',
                        fontWeight: 600,
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4A9A98 0%, #61C0BE 100%)',
                        },
                    }}
                >
                    Install
                </Button>
            </Alert>
        </Snackbar>
    );
}
