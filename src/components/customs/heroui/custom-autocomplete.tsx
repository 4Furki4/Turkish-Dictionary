"use client";

import React from 'react';
import { Autocomplete, type AutocompleteProps } from "@heroui/react";
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';
import { useSnapshot } from 'valtio';
import { preferencesState } from '@/src/store/preferences';

// Define the default styles for the Autocomplete component slots.
const customAutocompleteStyles = tv({
    slots: {
        base: "sm:max-w-64",
        listboxWrapper: "max-h-[320px]",
        listbox: "bg-background/90",
        popoverContent: "bg-background/80 backdrop-blur-sm border-primary/40",
        inputWrapper: [ // Added from the Input component for consistency
            "rounded-sm",
            "border-2",
            "border-primary/40",
            "shadow-xl",
            "group-data-[hover=true]:border-primary/60",
        ],
        input: [ // Added from the Input component for consistency
            "text-base",
            "text-foreground",
            "placeholder:text-muted-foreground",
        ],
        clearButton: "text-foreground",
        selectorButton: "text-foreground",
    },
    variants: {
        isBlurred: {
            true: {
                inputWrapper: "backdrop-blur-xs",
                popoverContent: "backdrop-blur-sm",
            },
            false: {
                popoverContent: "bg-background border-primary/40",
            }
        }
    }
});

// We extend the base AutocompleteProps.
export interface CustomAutocompleteProps<T extends object> extends AutocompleteProps<T> { }

export const CustomAutocomplete = React.forwardRef<HTMLInputElement, CustomAutocompleteProps<object>>(
    ({ children, className, classNames, ...props }, ref) => {
        const { isBlurEnabled } = useSnapshot(preferencesState);
        const styles = customAutocompleteStyles({ isBlurred: isBlurEnabled });

        return (
            <Autocomplete
                ref={ref}
                // Apply default props
                color="primary"
                variant="bordered"
                // Pass through any other props like `label`, `items`, etc.
                {...props}
                className={cn("w-full", className)}
                // Deeply merge our default classNames with any custom ones passed in.
                classNames={{
                    base: cn(styles.base(), classNames?.base),
                    listboxWrapper: cn(styles.listboxWrapper(), classNames?.listboxWrapper),
                    listbox: cn(styles.listbox(), classNames?.listbox),
                    popoverContent: cn(styles.popoverContent(), classNames?.popoverContent),
                    clearButton: cn(styles.clearButton(), classNames?.clearButton),
                    selectorButton: cn(styles.selectorButton(), classNames?.selectorButton),
                    ...classNames,
                }}
            >
                {children}
            </Autocomplete>
        );
    }
);

CustomAutocomplete.displayName = "CustomAutocomplete";
