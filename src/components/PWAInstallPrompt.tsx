'use client';

import { useResponsive } from '@/hooks';
import { db, SETTINGS_KEYS, SettingsService } from '@/lib/database';
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
    const [isDismissed, setIsDismissed] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const { isMobile } = useResponsive();

    // Helper function to reset the PWA install prompt settings
    // This is useful for debugging and development
    const resetPwaSettings = async () => {
        try {
            console.log("Resetting PWA install prompt settings...");
            await db.settings.where('key').equals(SETTINGS_KEYS.PWA_INSTALL_DISMISSED).delete();
            console.log("PWA settings reset successfully");
            setIsDismissed(false);

            // Force re-check for install prompt
            if (deferredPrompt) {
                setShowInstallPrompt(true);
            }
        } catch (error) {
            console.error("Failed to reset PWA settings:", error);
        }
    };

    // Toggle debug mode with a special key combination (Ctrl+Shift+D)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                setDebugMode(prev => !prev);
                console.log("PWA debug mode:", !debugMode);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [debugMode]);

    // Debug logging to check database status
    useEffect(() => {
        const checkDatabaseStatus = async () => {
            try {
                console.log("Checking database status...");
                const dbVersion = db.verno;
                console.log(`Database version: ${dbVersion}`);

                // Check if settings table exists
                const tables = db.tables.map(table => table.name);
                console.log("Available tables:", tables);

                if (tables.includes('settings')) {
                    const settings = await db.settings.toArray();
                    console.log("Settings in database:", settings);
                } else {
                    console.warn("Settings table not found in the database");
                }
            } catch (error) {
                console.error("Error checking database status:", error);
            }
        };

        checkDatabaseStatus();
    }, []);

    // Check if the user has dismissed the prompt recently
    useEffect(() => {
        const checkDismissalStatus = async () => {
            try {
                const dismissed = await SettingsService.getPwaInstallDismissed();
                setIsDismissed(dismissed);
            } catch (error) {
                console.error('Error checking PWA dismissal status:', error);
            }
        };

        checkDismissalStatus();
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            const pwaEvent = e as BeforeInstallPromptEvent;

            // Check if the prompt was recently dismissed
            SettingsService.getPwaInstallDismissed()
                .then(dismissed => {
                    if (dismissed) {
                        setIsDismissed(true);
                        return;
                    }

                    // Stash the event so it can be triggered later
                    setDeferredPrompt(pwaEvent);
                    setShowInstallPrompt(true);
                })
                .catch(error => {
                    console.error('Error handling install prompt:', error);
                    // If there's an error, show the prompt anyway
                    setDeferredPrompt(pwaEvent);
                    setShowInstallPrompt(true);
                });
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

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

    const handleDismiss = async () => {
        try {
            // Store the dismissal in IndexedDB
            await SettingsService.setPwaInstallDismissed();
            setIsDismissed(true);
            setShowInstallPrompt(false);
        } catch (error) {
            console.error('Error saving PWA dismissal status:', error);
            // Still hide the prompt even if there's an error saving
            setShowInstallPrompt(false);
        }
    };

    if (isInstalled || !showInstallPrompt || isDismissed) {
        return null;
    }

    return (
        <Snackbar
            open={showInstallPrompt}
            onClose={handleDismiss}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{
                mb: 2,
                width: isMobile ? '100%' : 'auto',
                '& .MuiPaper-root': {
                    width: isMobile ? '95%' : 'auto',
                    maxWidth: '600px',
                }
            }}
        >
            <Alert
                severity="info"
                sx={{
                    width: '100%',
                    alignItems: 'center',
                    '& .MuiAlert-message': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isMobile ? 'center' : 'flex-start',
                        gap: isMobile ? 1 : 2,
                        flexDirection: isMobile ? 'column' : 'row',
                        flexWrap: isMobile ? 'nowrap' : 'wrap',
                        width: '100%',
                        py: isMobile ? 1 : 0,
                    },
                }}
                action={
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={handleDismiss}
                        sx={{ marginLeft: isMobile ? 0 : 'auto' }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                }
            >
                <span style={{ textAlign: isMobile ? 'center' : 'left', marginBottom: isMobile ? '8px' : 0 }}>
                    Install Vitaena for quick access!
                </span>
                <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
                    <Button
                        size={isMobile ? "medium" : "small"}
                        variant="contained"
                        fullWidth={isMobile}
                        startIcon={<Download />}
                        onClick={handleInstallClick}
                        sx={{
                            background: 'linear-gradient(135deg, #61C0BE 0%, #4A9A98 100%)',
                            color: 'white',
                            fontWeight: 600,
                            minWidth: isMobile ? '100%' : 'auto',
                            mt: isMobile ? 1 : 0,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #4A9A98 0%, #61C0BE 100%)',
                            },
                        }}
                    >
                        Install
                    </Button>
                    {debugMode && (
                        <Button
                            size={isMobile ? "medium" : "small"}
                            variant="outlined"
                            fullWidth={isMobile}
                            onClick={resetPwaSettings}
                            sx={{
                                mt: isMobile ? 1 : 0,
                                fontSize: '0.7rem',
                            }}
                        >
                            Reset Settings
                        </Button>
                    )}
                </div>
            </Alert>
        </Snackbar>
    );
}
