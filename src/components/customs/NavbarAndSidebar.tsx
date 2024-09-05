"use client"
import { Session } from 'next-auth'
import React, { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
export default function NavbarAndSidebar({

    session,
    HomeIntl,
    SignInIntl,
    WordListIntl,

}: {
    session: Session | null
    HomeIntl: string
    SignInIntl: string
    WordListIntl: string
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
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <Sidebar session={session} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        </>
    )
}
