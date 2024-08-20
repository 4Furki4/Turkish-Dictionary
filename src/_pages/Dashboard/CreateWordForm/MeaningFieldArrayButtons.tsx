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
        <ButtonGroup radius='sm' className="w-full">
            <Button
                className="w-full rounded-sm"
                type="button"
                variant="ghost"
                onPress={() => {
                    append(meaningDefaultValues);
                }}
            >
                Append <span className="max-sm:hidden">Meaning</span>
            </Button>
            <Button
                className="w-full rounded-sm"
                type="button"
                variant="ghost"
                onPress={() => {
                    prepend(meaningDefaultValues);
                }}
            >
                Prepend <span className="max-sm:hidden">Meaning</span>
            </Button>
        </ButtonGroup>
    )
}
