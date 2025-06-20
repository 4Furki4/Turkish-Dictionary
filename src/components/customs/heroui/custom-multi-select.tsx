"use client";

import React from 'react';
import { Select, SelectItem, type SelectProps, Selection } from "@heroui/react";
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';

// Define the structure for the options we'll pass in.
export type OptionsMap = Record<string, string> | { key: string; label: string }[];

// Define the props for our custom component.
export interface CustomMultiSelectProps extends Omit<SelectProps, 'children' | 'selectedKeys' | 'onSelectionChange'> {
    options: OptionsMap;
    selectedKeys: string[];
    onSelectionChange: (keys: string[]) => void;
    placeholder?: string;
}

export function CustomMultiSelect({
    options,
    selectedKeys,
    onSelectionChange,
    placeholder = "Select options",
    className,
    classNames,
    ...props
}: CustomMultiSelectProps) {
    // We use tailwind-variants to define the default styles for our component slots.
    const customMultiSelectStyles = tv({
        slots: {
            base: "sm:max-w-64",
            trigger: "border-2 border-primary/40 cursor-pointer",
            label: "text-foreground",
            listbox: "bg-background/10",
            popoverContent: "bg-background border-primary/40",
        }
    });

    const styles = customMultiSelectStyles();

    const handleSelectionChange = (selection: Selection) => {
        if (selection === "all") {
            onSelectionChange(Object.keys(options));
        } else {
            onSelectionChange(Array.from(selection) as string[]);
        }
    };

    return (
        <Select
            size="sm"
            color="primary"
            variant="bordered"
            selectionMode="multiple"
            placeholder={placeholder}
            selectedKeys={new Set(selectedKeys)}
            onSelectionChange={handleSelectionChange}
            className={className}
            classNames={{
                base: cn(styles.base(), classNames?.base),
                trigger: cn(styles.trigger(), classNames?.trigger),
                label: cn(styles.label(), classNames?.label),
                listbox: cn(styles.listbox(), classNames?.listbox),
                popoverContent: cn(styles.popoverContent(), classNames?.popoverContent),
                ...classNames,
            }}
            {...props}
        >
            {Array.isArray(options) ? options.map(option => (
                <SelectItem key={option.key}>
                    {option.label}
                </SelectItem>
            )) : Object.entries(options).map(([key, label]) => (
                <SelectItem key={key}>
                    {label}
                </SelectItem>
            ))}
        </Select>
    );
}
