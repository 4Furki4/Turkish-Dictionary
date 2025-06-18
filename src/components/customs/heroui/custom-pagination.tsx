"use client";

import React from 'react';
import { Pagination, type PaginationProps } from "@heroui/react";
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';

// Define the default styles for the pagination slots using tailwind-variants.
const customPaginationStyles = tv({
    slots: {
        wrapper: "mx-auto",
        item: "[&[data-hover=true]:not([data-active=true])]:bg-primary/30 bg-primary/10 p-1 min-w-max",
        next: "[&[data-hover=true]:not([data-active=true])]:bg-primary/30 bg-primary/10",
        prev: "[&[data-hover=true]:not([data-active=true])]:bg-primary/30 bg-primary/10",
    }
});

// We accept all of HeroUI's PaginationProps so we can override anything we need.
export interface CustomPaginationProps extends PaginationProps { }

export function CustomPagination({ className, classNames, ...props }: CustomPaginationProps) {
    // Get the default styles.
    const styles = customPaginationStyles();

    return (
        <Pagination
            isCompact
            showControls
            className={cn("cursor-pointer", className)} // Merge base className
            // Deeply merge our default styles with any custom ones passed in.
            // This allows for overriding specific slots while keeping the others.
            classNames={{
                wrapper: cn(styles.wrapper(), classNames?.wrapper),
                item: cn(styles.item(), classNames?.item),
                next: cn(styles.next(), classNames?.next),
                prev: cn(styles.prev(), classNames?.prev),
                // Pass through any other classNames not defined in our defaults
                ...classNames,
            }}
            // Spread the rest of the props.
            {...props}
        />
    );
}
