"use client"
import { Session } from 'next-auth'
import React, { useState } from 'react'
import Navbar from './navbar'
import Sidebar from './sidebar'
export default function NavbarAndSidebar({

    session,
    HomeIntl,
    SignInIntl,
    WordListIntl,
    TitleIntl,
    ProfileIntl,
    SavedWordsIntl,
    MyRequestsIntl,
    SearchHistoryIntl,
    LogoutIntl,
    AnnouncementsIntl
}: {
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
    // Render children if on client side, otherwise return null
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    return (
        <>
            <Navbar
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
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <Sidebar session={session} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        </>
    )
}
