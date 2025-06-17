"use client"
import { Button, Input } from '@heroui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MailIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'
import React from 'react'
import { Controller, FieldValues, useForm } from 'react-hook-form'
import { z } from 'zod'

export default function SigninWithEmailForm({ SigninWithEmailIntl, EnterYourEmailIntl, EmailSigninLabelIntl, MagicLinkIntl, InvalidEmailIntl }: { SigninWithEmailIntl: string, EnterYourEmailIntl: string, EmailSigninLabelIntl: string, MagicLinkIntl: string, InvalidEmailIntl: string }) {
    const { control, handleSubmit } = useForm({
        resolver: zodResolver(z.object({
            email: z.string().email({ message: InvalidEmailIntl })
        })),
        mode: 'all'
    })
    const mutation = useMutation({
        mutationFn: async (data: FieldValues) => {
            await signIn("nodemailer", { email: data.email })
        }
    })
    return (
        <form
            className="w-full flex flex-col gap-2"
            onSubmit={handleSubmit(async (data) => await mutation.mutateAsync(data))}
        >
            <Controller
                control={control}
                name="email"
                render={({ field, fieldState: { error } }) => (
                    <Input
                        classNames={{
                            inputWrapper: [
                                "rounded-sm",
                                "backdrop-blur-xs",
                                "border-2 border-primary/40",
                                "shadow-xl",
                                "group-data-[hover=true]:border-primary/60",
                            ],
                            input: [
                                "py-6",
                                "text-base",
                                "text-foreground",
                                "placeholder:text-muted-foreground",
                            ]
                        }}
                        {...field}
                        className="rounded-sm w-full"
                        label={EmailSigninLabelIntl}
                        variant="bordered"
                        labelPlacement='outside'
                        color='primary'
                        type="email"
                        name="email"
                        errorMessage={error?.message}
                        placeholder={EnterYourEmailIntl}
                        description={MagicLinkIntl}
                        startContent={<MailIcon size={24} />}
                    />
                )}
            />
            <Button
                className="rounded-sm w-full"
                variant="flat"
                color="primary"
                type="submit"
                isLoading={mutation.isPending}
            >
                {SigninWithEmailIntl}
            </Button>
        </form>
    )
}
