"use client"
import { Meaning, WordForm } from '@/types';
import { Button, ButtonGroup } from "@heroui/react";
import React from 'react'
import { UseFieldArrayAppend, UseFieldArrayPrepend } from 'react-hook-form';

export default function MeaningFieldArrayButtons({
    append,
    prepend,
    meaningDefaultValues
}: {
    append: UseFieldArrayAppend<WordForm>,
    prepend: UseFieldArrayPrepend<WordForm>,
    meaningDefaultValues: Partial<Meaning>
}) {
    return (
        <ButtonGroup radius='sm' className="w-full flex  gap-2 ">
            <Button
                radius='sm'
                className="w-full"
                type="button"
                onPress={() => {
                    append(meaningDefaultValues);
                }}
            >
                Append <span className="max-sm:hidden">Meaning</span>
            </Button>
            <Button
                radius='sm'
                className="w-full"
                type="button"
                onPress={() => {
                    prepend(meaningDefaultValues);
                }}
            >
                Prepend <span className="max-sm:hidden">Meaning</span>
            </Button>
        </ButtonGroup>
    )
}
