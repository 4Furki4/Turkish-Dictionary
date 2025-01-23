import { signIn } from "@/src/server/auth/auth";
import { Button, ButtonGroup } from "@heroui/button";
export default async function OAuthButton({ provider }: { provider: string }) {
    return (
        <form
            action={async () => {
                "use server"
                await signIn(provider)
            }}
        >
            <Button type="submit" > Signin with {provider.charAt(0).toUpperCase() + provider.slice(1)} </Button>
        </form>
    )
} 