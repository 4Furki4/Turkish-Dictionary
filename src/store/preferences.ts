// src/store/preferences.ts
import { proxy, subscribe } from 'valtio';

// 1. Define the type for our state
type PreferencesState = {
    isBlurEnabled: boolean;
    isInitialized: boolean; // To prevent writing to localStorage on server/initial render
};

// 2. Create the proxy state object
export const preferencesState = proxy<PreferencesState>({
    isBlurEnabled: true,
    isInitialized: false,
});

// 3. Define actions to mutate the state
export const initializePreferences = () => {
    if (typeof window !== 'undefined') {
        try {
            const storedPreference = localStorage.getItem('isBlurEnabled');
            if (storedPreference !== null) {
                preferencesState.isBlurEnabled = JSON.parse(storedPreference);
            }
        } catch (error) {
            console.error('Failed to parse blur preference from localStorage', error);
        }
        preferencesState.isInitialized = true;
    }
};

export const toggleBlur = () => {
    preferencesState.isBlurEnabled = !preferencesState.isBlurEnabled;
};

// 4. Subscribe to changes and persist to localStorage
subscribe(preferencesState, () => {
    // Only save to localStorage if the state has been initialized on the client
    if (preferencesState.isInitialized && typeof window !== 'undefined') {
        localStorage.setItem('isBlurEnabled', JSON.stringify(preferencesState.isBlurEnabled));
    }
});