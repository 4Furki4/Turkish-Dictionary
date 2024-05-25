"use client"
import { Session } from 'next-auth'
import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Wrapper({
    children,
    session,
    HomeIntl,
    SignInIntl,
    WordListIntl,

}: {
    children: React.ReactNode
    session: Session | null
    HomeIntl: string
    SignInIntl: string
    WordListIntl: string


}) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
    return (
        <>
            <section className={`transition-all ${isSidebarOpen ? 'lg:w-[calc(100%-var(--sidebar-width))] ' : 'lg:w-[calc(100%-var(--sidebar-width-collapsed))]'}`}>
                <Navbar
                    session={session}
                    HomeIntl={HomeIntl}
                    SignInIntl={SignInIntl}
                    WordListIntl={WordListIntl}
                />
                {children}
            </section>
            <Sidebar session={session} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        </>
    )
}
