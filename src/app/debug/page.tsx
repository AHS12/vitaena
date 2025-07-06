'use client';

import { OfflineNavigationDebugger } from '@/lib/offline-debug';
import { Box, Button, Card, CardContent, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export default function DebugPage() {
    const [debugResults, setDebugResults] = useState<string[]>([]);
    const [isOnline, setIsOnline] = useState<boolean | null>(null); // null initially for SSR
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Set client-side flag
        setIsClient(true);

        // Set initial online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            console.log('🌐 Network status changed: Online');
            setIsOnline(true);
        };
        const handleOffline = () => {
            console.log('🌐 Network status changed: Offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Also check periodically in case events are missed
        const intervalId = setInterval(() => {
            const currentOnlineStatus = navigator.onLine;
            if (currentOnlineStatus !== isOnline) {
                console.log(`🌐 Network status sync: ${currentOnlineStatus ? 'Online' : 'Offline'}`);
                setIsOnline(currentOnlineStatus);
            }
        }, 5000); // Check every 5 seconds

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, [isOnline]); // Add isOnline as dependency to detect changes

    const runDebugTest = async () => {
        setDebugResults([]);

        // Capture console logs
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const logs: string[] = [];

        console.log = (...args) => {
            logs.push(`[LOG] ${args.join(' ')}`);
            originalLog(...args);
        };
        console.warn = (...args) => {
            logs.push(`[WARN] ${args.join(' ')}`);
            originalWarn(...args);
        };
        console.error = (...args) => {
            logs.push(`[ERROR] ${args.join(' ')}`);
            originalError(...args);
        };

        // Run debug tests
        await OfflineNavigationDebugger.fullDebugReport();

        // Restore console
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;

        setDebugResults(logs);
    };

    const forceCachePages = async () => {
        const pagesToCache = [
            '/',
            '/editor/test-resume-1',
            '/editor/test-resume-2'
        ];

        for (const page of pagesToCache) {
            await OfflineNavigationDebugger.forceCacheURL(`${window.location.origin}${page}`);
        }
    };

    const refreshStatus = async () => {
        const navigatorOnline = navigator.onLine;
        console.log(`🔄 Manual status refresh: navigator.onLine = ${navigatorOnline}`);

        // Also try to make a network request to verify actual connectivity
        try {
            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-store',
                mode: 'no-cors'
            });
            console.log(`🔄 Network test: fetch successful = ${response.ok || response.type === 'opaque'}`);
        } catch (error) {
            console.log(`🔄 Network test: fetch failed =`, error);
        }

        setIsOnline(navigatorOnline);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                � PWA Debug Console
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Debug tools for testing offline navigation and PWA functionality.
            </Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Current Status
                    </Typography>
                    <Typography>
                        Online Status: {isOnline === null ? '⏳ Loading...' : isOnline ? '✅ Online' : '❌ Offline'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        navigator.onLine: {isClient ? (navigator.onLine ? 'true' : 'false') : 'Loading...'}
                    </Typography>
                    <Typography>
                        Current URL: {isClient ? window.location.href : 'Loading...'}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            size="small"
                            onClick={refreshStatus}
                            variant="outlined"
                        >
                            🔄 Refresh Status
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    onClick={runDebugTest}
                    sx={{ background: 'linear-gradient(135deg, #61C0BE 0%, #4A90A4 100%)' }}
                >
                    Run Full Debug Test
                </Button>

                <Button
                    variant="outlined"
                    onClick={forceCachePages}
                    color="primary"
                >
                    Force Cache Test Pages
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => window.location.href = '/'}
                    color="secondary"
                >
                    Test Navigation to Home
                </Button>
            </Box>

            {debugResults.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#fff' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#61C0BE' }}>
                        Debug Results:
                    </Typography>
                    <Box component="pre" sx={{
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        maxHeight: 400,
                        overflow: 'auto'
                    }}>
                        {debugResults.join('\n')}
                    </Box>
                </Paper>
            )}

            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        🧪 Manual Testing Instructions
                    </Typography>
                    <Typography component="div" sx={{ '& ol': { pl: 2 } }}>
                        <ol>
                            <li>Click &quot;Force Cache Test Pages&quot; while online</li>
                            <li>Click &quot;Run Full Debug Test&quot; to check service worker and cache</li>
                            <li>Go offline (DevTools → Network → Offline checkbox)</li>
                            <li>Click &quot;Test Navigation to Home&quot;</li>
                            <li>Check if navigation works offline</li>
                        </ol>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
