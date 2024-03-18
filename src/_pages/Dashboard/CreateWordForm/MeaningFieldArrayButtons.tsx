import { Meaning, MeaningInputs, WordForm } from '@/types';
import { Button, ButtonGroup } from '@nextui-org/react';
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
        <ButtonGroup className="w-full">
            <Button
                className="w-full"
                type="button"
                variant="ghost"
                onClick={() => {
                    append(meaningDefaultValues);
                }}
            >
                Append <span className="max-sm:hidden">Meaning</span>
            </Button>
            <Button
                className="w-full"
                type="button"
                variant="ghost"
                onClick={() => {
                    prepend(meaningDefaultValues);
                }}
            >
                Prepend <span className="max-sm:hidden">Meaning</span>
            </Button>
        </ButtonGroup>
    )
}
