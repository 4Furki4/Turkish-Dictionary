"use client"
import { ChevronLeftIcon, ChevronRightIcon, HistoryIcon, HomeIcon, LayoutDashboard, ListTree, SidebarClose, SidebarOpen, StarIcon } from 'lucide-react'
import React from 'react'
import { Link as NextIntlLink } from "@/src/navigation";
import { Session } from 'next-auth';
export default function Sidebar(
    {
        session,
        isSidebarOpen,
        saveIsSidebarOpen
    }
        : {
            session: Session | null,
            isSidebarOpen: boolean,
            saveIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
        }
) {
    return (
        <>
            <div onClick={() => {
                saveIsSidebarOpen(!isSidebarOpen)
            }} className='p-4 z-50 h-max cursor-pointer sticky top-1' >
                {isSidebarOpen ? <SidebarOpen className='h-7 w-7' /> : <SidebarClose className='h-7 w-7' />}
            </div>
            <aside className={`transition-all absolute right-0 h-full border-1 p-4 pt-[calc(var(--navbar-height)+.5rem)] hidden lg:flex ${isSidebarOpen ? 'w-[var(--sidebar-width)]' : 'flex w-[var(--sidebar-width-collapsed)]'}`}>

                <nav>
                    <ul className='sticky top-16 max-h-max space-y-4'>
                        <li>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50' href={'/'}>
                                <HomeIcon className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Home</span>
                            </NextIntlLink>
                        </li>
                        <li className='flex'>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50' href={'/saved-words'}>
                                <StarIcon className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Saved Words</span>
                            </NextIntlLink>
                        </li>
                        <li>
                            {/* TODO: history path will be added */}
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50' href={'/saved-words'}>
                                <HistoryIcon className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Search History</span>
                            </NextIntlLink>
                        </li>
                        <li>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50' href={'/saved-words'}>
                                <ListTree className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Word List</span>
                            </NextIntlLink>
                        </li>
                        {session?.user.role === "user" ? null : (
                            <li>
                                {/* TODO: history path will be added */}
                                <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'>
                                    <LayoutDashboard className='h-6 w-6' /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Dashboard</span>
                                </NextIntlLink>
                            </li>
                        )}

                    </ul>

                </nav>
            </aside>
            {/* <button onClick={() => {
                saveIsSidebarOpen(!isSidebarOpen)
            }} className='p-2 hover:bg-background-foreground/25'>
                {isSidebarOpen ? <ChevronRightIcon className="h-5 w-5 transition-transform sticky translate-y-1/2 top-1/2 right-16" /> : <ChevronLeftIcon className="h-5 w-5 transition-transform sticky top-1/2 right-16 translate-y-1/2" />}
            </button> */}
        </>
    )
}
