"use client"
import { Button } from "@heroui/button";
import { signIn } from "next-auth/react";
export default function SigninButton({ provider, IntlMessage, startContent, redirectUrl }: { provider: "google" | "discord" | "github", IntlMessage: string, startContent: React.ReactNode, redirectUrl?: string }) {
    return (
        <Button
            onPress={() => signIn(provider, { redirectTo: redirectUrl })}
            className="rounded-sm w-full"
            variant="flat"
            color="primary"
            type="submit"
            startContent={startContent}
        > {IntlMessage} </Button>
    )
} 