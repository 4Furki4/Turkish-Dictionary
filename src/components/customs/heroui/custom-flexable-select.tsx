"use client";

import React from 'react';
import { Select, type SelectProps } from "@heroui/react";
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';

// Define the default styles for our component slots.
const customSelectStyles = tv({
    slots: {
        base: "sm:max-w-64",
        trigger: "border-2 border-primary/40",
        label: "text-foreground",
        listbox: "bg-background/90",
        popoverContent: "bg-background/80 backdrop-blur-sm border-primary/40",
    }
});

// The props for our custom component are now identical to the base SelectProps,
// allowing us to pass `children` and any other prop directly.
export interface CustomSelectProps extends SelectProps { }

export const CustomSelect = React.forwardRef<HTMLSelectElement, CustomSelectProps>(
    ({ children, className, classNames, ...props }, ref) => {
        // Get the default styles from our definition above.
        const styles = customSelectStyles();

        return (
            <Select
                ref={ref}
                // Apply default props. These can be overridden by passing them to <CustomSelect>.
                size="sm"
                color="primary"
                variant="bordered"
                // Pass through any other props like `label`, `selectedKeys`, `onChange`, etc.
                {...props}
                className={cn("w-full", className)}
                // Deeply merge our default classNames with any custom ones passed in.
                classNames={{
                    base: cn(styles.base(), classNames?.base),
                    trigger: cn(styles.trigger(), classNames?.trigger),
                    label: cn(styles.label(), classNames?.label),
                    listbox: cn(styles.listbox(), classNames?.listbox),
                    popoverContent: cn(styles.popoverContent(), classNames?.popoverContent),
                    ...classNames,
                }}
            >
                {/*
          Render the children directly. This allows you to define the
          <SelectItem> components yourself in the parent component.
        */}
                {children}
            </Select>
        );
    }
);

CustomSelect.displayName = "CustomSelect";

