'use client';

import { useEffect } from "react";
import OfflineIndicator from "./OfflineIndicator";
import PWAInstallPrompt from "./PWAInstallPrompt";

export default function PWAWrapper() {
    useEffect(() => {
        // Register service worker manually
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('✅ Service Worker registered:', registration.scope);
                    }
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return (
        <>
            <OfflineIndicator />
            <PWAInstallPrompt />
        </>
    );
}
