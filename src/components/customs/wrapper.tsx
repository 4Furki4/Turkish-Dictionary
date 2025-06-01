import { Session } from "next-auth";
import NavbarAndSidebar from "./navbar-and-sidebar";
export function Wrapper({ session, HomeIntl, SignInIntl, WordListIntl, TitleIntl, ProfileIntl, SavedWordsIntl, MyRequestsIntl, SearchHistoryIntl, LogoutIntl, AnnouncementsIntl }: {
    session: Session | null
    HomeIntl: string
    SignInIntl: string
    WordListIntl: string
    TitleIntl: string
    ProfileIntl: string
    SavedWordsIntl: string
    MyRequestsIntl: string
    SearchHistoryIntl: string
    LogoutIntl: string
    AnnouncementsIntl: string
}) {
    return (
        <NavbarAndSidebar 
            session={session} 
            HomeIntl={HomeIntl} 
            SignInIntl={SignInIntl} 
            WordListIntl={WordListIntl} 
            TitleIntl={TitleIntl} 
            ProfileIntl={ProfileIntl} 
            SavedWordsIntl={SavedWordsIntl} 
            MyRequestsIntl={MyRequestsIntl} 
            SearchHistoryIntl={SearchHistoryIntl} 
            LogoutIntl={LogoutIntl} 
            AnnouncementsIntl={AnnouncementsIntl} 
        />
    )
}