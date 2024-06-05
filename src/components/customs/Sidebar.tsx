"use client"
import { HistoryIcon, HomeIcon, LayoutDashboard, ListTree, SidebarClose, SidebarOpen, StarIcon } from 'lucide-react'
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
            <button onClick={() => {
                saveIsSidebarOpen(!isSidebarOpen)
            }} className='z-50 h-max cursor-pointer sticky top-5 ml-4 hidden lg:block rounded-sm' >
                {isSidebarOpen ? <SidebarOpen className='h-7 w-7' /> : <SidebarClose className='h-7 w-7' />}
            </button>
            <aside className={`transition-all absolute right-0 h-full border-r-0 border-y-0 border-1 p-4 pt-[calc(var(--navbar-height)+.5rem)] hidden lg:flex ${isSidebarOpen ? 'w-[var(--sidebar-width)]' : 'flex w-[var(--sidebar-width-collapsed)]'}`}>

                <nav>
                    <ul className='sticky top-16 max-h-max space-y-4'>
                        <li>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/'}>
                                <HomeIcon className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Home</span>
                            </NextIntlLink>
                        </li>
                        <li className='flex'>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                <StarIcon className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Saved Words</span>
                            </NextIntlLink>
                        </li>
                        <li>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                <HistoryIcon className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Search History</span>
                            </NextIntlLink>
                        </li>
                        <li>
                            <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                <ListTree className="h-6 w-6" /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Word List</span>
                            </NextIntlLink>
                        </li>
                        {session?.user.role === "admin" ? (
                            <li>
                                <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
                                    <LayoutDashboard className='h-6 w-6' /> <span className={`text-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Dashboard</span>
                                </NextIntlLink>
                            </li>
                        ) : null}
                    </ul>
                </nav>
            </aside>
        </>
    )
}
