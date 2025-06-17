// src/components/customs/preferences-initializer.tsx
'use client';

import { useEffect } from 'react';
import { initializePreferences } from '@/src/store/preferences';

export function PreferencesInitializer() {
    // This effect runs once on the client after the component mounts
    useEffect(() => {
        initializePreferences();
    }, []);

    // This component doesn't render anything to the DOM
    return null;
}