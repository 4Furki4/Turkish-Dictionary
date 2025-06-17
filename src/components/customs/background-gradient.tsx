"use client";
import React, { useState, useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { preferencesState } from '@/src/store/preferences';
import { cn } from '@/src/lib/utils';

export function BackgroundGradient() {
    const { isBlurEnabled } = useSnapshot(preferencesState);
    const [isMounted, setIsMounted] = useState(false);

    // This effect runs only once on the client, after the component has mounted.
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // We always render the container.
    // Its visibility is controlled by opacity, which prevents a layout shift.
    // The gradient will smoothly fade in only if it's mounted AND enabled.
    return (
        <div
            className={cn(
                'pointer-events-none transition-opacity duration-500', // pointer-events-none to ensure it's not interactive
                isMounted && isBlurEnabled ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden={!isMounted || !isBlurEnabled}
        >
            {/* Top Gradient Shape */}
            <div
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-30"
            >
                <div
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2  bg-gradient-to-tr from-primary via-primary/75 to-primary/25 opacity-30 sm:left-[calc(50%-36rem)] sm:w-[72.1875rem]"
                />
            </div>
            {/* Bottom Gradient Shape */}
            <div
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            >
                <div
                    className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary via-primary/75 to-primary/25 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                />
            </div>
        </div>
    );
}
