'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OfflineNavigationProps {
    children: React.ReactNode;
}

export const OfflineNavigation: React.FC<OfflineNavigationProps> = ({ children }) => {
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Set initial online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        // Preload critical routes when online
        if (isOnline) {
            // Preload home page
            router.prefetch('/');

            // Preload editor routes if we have resume IDs in localStorage
            try {
                const resumeIds = Object.keys(localStorage).filter(key => key.startsWith('resume-'));
                resumeIds.slice(0, 5).forEach(key => {
                    const resumeId = key.replace('resume-', '');
                    router.prefetch(`/editor/${resumeId}`);
                });
            } catch (error) {
                console.warn('Could not preload editor routes:', error);
            }
        }
    }, [isOnline, router]);

    return <>{children}</>;
};

// Enhanced navigation hook with offline support
export const useOfflineNavigation = () => {
    const router = useRouter();
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const navigateWithFallback = (path: string) => {
        console.log('Navigation attempt:', { path, isOnline });

        // Always use window.location for offline navigation to ensure cached pages are used
        if (!isOnline) {
            console.log('Offline navigation detected, using page reload for:', path);
            window.location.href = path;
            return;
        }

        // For online navigation, try Next.js router first
        try {
            console.log('Using Next.js router navigation');
            router.push(path);
        } catch (error) {
            console.warn('Client-side navigation failed, using fallback:', error);
            console.log('Falling back to window.location.href');
            window.location.href = path;
        }
    };

    // Enhanced navigation method with better offline support
    const navigateReliably = (path: string) => {
        // Check if the target path is likely to be cached
        const isCriticalPath = path === '/' || path.startsWith('/editor/');

        if (!isOnline && isCriticalPath) {
            // For offline navigation to critical paths, use window.location
            console.log('Offline navigation to critical path:', path);
            window.location.href = path;
        } else if (!isOnline) {
            // For non-critical paths offline, show a message or handle gracefully
            console.warn('Offline navigation to non-critical path attempted:', path);
            // Could show a toast notification here
            window.location.href = path; // Still attempt navigation
        } else {
            // Online navigation
            navigateWithFallback(path);
        }
    };

    return {
        isOnline,
        navigate: navigateReliably,
        navigateWithFallback,
        router,
    };
};
