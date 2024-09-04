"use client"
import { WordForm } from '@/types';
import { Button } from '@nextui-org/react';
import React, { ChangeEvent } from 'react'
import { Control, FieldArrayWithId, FormState, UseFormClearErrors } from 'react-hook-form';

export default function MeaningImageInput({
    index,
    control,
    formState,
    clearErrors,
    field,
    setImagePreviewUrls,
    imagePreviewUrls
}: {
    index: number,
    control: Control<WordForm>,
    formState: FormState<WordForm>,
    clearErrors: UseFormClearErrors<WordForm>,
    field: FieldArrayWithId<WordForm>,
    setImagePreviewUrls: React.Dispatch<React.SetStateAction<string[]>>,
    imagePreviewUrls: string[]
}) {
    return (
        <>
            <input
                className="w-full"
                placeholder="Browse Image"
                accept="image/*"
                type="file"
                multiple={false}
                {...control.register(`meanings.${index}.image`, {
                    validate: (file) => {
                        const FOUR_MB = 4 * 1024 * 1024;
                        if (file && file[0]?.size > FOUR_MB) {
                            return "Image must be smaller than 4MB";
                        }
                        return true;
                    },
                })}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setImagePreviewUrls((prev) => {
                                prev[index] = reader.result as string;
                                return [...prev];
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                }}
            />
            {
                formState.errors?.meanings?.[index]?.image && (
                    <p>{formState.errors?.meanings?.[index]?.image?.message}</p>
                )
            }
            {
                imagePreviewUrls[0] ? (
                    <img
                        src={imagePreviewUrls[index] ?? ""}
                        alt="selected image"
                    />
                ) : (
                    <p>
                        Image is optional. If you want to add an image, please
                        select one.
                    </p>
                )
            }
            {
                imagePreviewUrls[index] && (
                    <Button
                        className="w-full"
                        onPress={() => {
                            field.image = undefined;
                            clearErrors(`meanings.${index}.image`);
                            setImagePreviewUrls((prev) => {
                                prev[index] = "";
                                return [...prev];
                            });
                        }}
                    >
                        Unselect Image
                    </Button>
                )
            }
        </>
    )
}
