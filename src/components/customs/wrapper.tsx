import { Session } from "next-auth";
import NavbarAndSidebar from "./navbar-and-sidebar";
export function Wrapper({ session, HomeIntl, SignInIntl, WordListIntl }: {
    session: Session | null
    HomeIntl: string
    SignInIntl: string
    WordListIntl: string

}) {
    return (
        <NavbarAndSidebar session={session} HomeIntl={HomeIntl} SignInIntl={SignInIntl} WordListIntl={WordListIntl} />
    )
}