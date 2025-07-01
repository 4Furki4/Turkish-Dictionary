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
        inputWrapper: "border-primary/40",
        input: "text-base",
        label: "pb-1",
        popoverContent: "bg-background/80 backdrop-blur-sm",
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
                popoverContent: "bg-background",
            }
        }
    }
});

// We extend the base AutocompleteProps.
export interface CustomAutocompleteProps<T extends object> extends AutocompleteProps<T> { }

export const CustomAutocomplete = <T extends object>(
    { children, className, classNames, ...props }: CustomAutocompleteProps<T>) => {
    const { isBlurEnabled } = useSnapshot(preferencesState);
    const styles = customAutocompleteStyles({ isBlurred: isBlurEnabled });

    return (
        <Autocomplete
            inputProps={{
                classNames: {
                    inputWrapper: styles.inputWrapper(),
                    input: styles.input(),
                    label: styles.label(),
                }
            }}
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

CustomAutocomplete.displayName = "CustomAutocomplete";
