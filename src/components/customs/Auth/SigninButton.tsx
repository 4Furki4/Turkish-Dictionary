import { signIn } from "@/src/server/auth/auth";
import { Button } from "@heroui/button";
export default async function SigninButton({ provider, IntlMessage, startContent }: { provider: "google" | "discord" | "github", IntlMessage: string, startContent: React.ReactNode }) {
    return (
        <form
            className="w-full "
            action={async () => {
                "use server"
                await signIn(provider)
            }}
        >
            <Button
                className="rounded-sm w-full"
                variant="bordered"
                color="primary"
                type="submit"
                startContent={startContent}
            > {IntlMessage} </Button>
        </form>
    )
} 