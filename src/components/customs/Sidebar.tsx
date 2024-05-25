"use client"
import { ChevronLeftIcon, ChevronRightIcon, HistoryIcon, HomeIcon, LayoutDashboard, ListTree, StarIcon } from 'lucide-react'
import React from 'react'
import { Link as NextIntlLink } from "@/src/navigation";
import { Session } from 'next-auth';
export default function Sidebar({ session, isSidebarOpen, setIsSidebarOpen }: { session: Session | null, isSidebarOpen: boolean, setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
    return (
        <aside className={`transition-all absolute right-0 min-h-screen border-1 p-4 pt-[var(--navbar-height)] hidden lg:flex ${isSidebarOpen ? 'w-[var(--sidebar-width)]' : 'flex w-[var(--sidebar-width-collapsed)]'}`}>
            <nav>
                <ul className='space-y-4'>
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
                        {/* TODO: history path will be added */}
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
            <button onClick={() => setIsSidebarOpen(value => !value)} className='p-2 hover:bg-background-foreground/25'>
                {isSidebarOpen ? <ChevronRightIcon className="h-5 w-5 transition-transform absolute top-1/2 left-0 translate-y-1/2" /> : <ChevronLeftIcon className="h-5 w-5 transition-transform absolute top-1/2 left-0 translate-y-1/2" />}
            </button>
        </aside>
    )
}
