"use client"
import { HistoryIcon, HomeIcon, LayoutDashboard, ListTree, SidebarClose, SidebarOpen, StarIcon } from 'lucide-react'
import React from 'react'
import { Link as NextIntlLink } from "@/src/navigation";
import { Session } from 'next-auth';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from '@nextui-org/react';

export default function Sidebar(
    {
        session,
        isSidebarOpen,
        setIsSidebarOpen
    }
        : {
            session: Session | null,
            isSidebarOpen: boolean,
            setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
        }
) {
    return (
        <>
            <Sheet open={isSidebarOpen} onOpenChange={(isOpen) => {
                setIsSidebarOpen(isOpen)
            }}>
                <SheetContent side={'left'} className="w-[200px] sm:w-[240px] max-sm:p-0 max-sm:pt-8">
                    <SheetHeader>
                        <SheetTitle>Turkish Dictionary</SheetTitle>
                    </SheetHeader>
                    <SheetDescription>
                        <nav className='p-5'>
                            <ul className='sticky top-4 max-h-max space-y-4'>
                                <li>
                                    <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/'}>
                                        <HomeIcon className="h-6 w-6" /> <span className={`text-nowrap`}>Home</span>
                                    </NextIntlLink>
                                </li>
                                <li className='flex'>
                                    <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                        <StarIcon className="h-6 w-6" /> <span className={`text-nowrap`}>Saved Words</span>
                                    </NextIntlLink>
                                </li>
                                <li>
                                    <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                        <HistoryIcon className="h-6 w-6" /> <span className={`text-nowrap`}>Search History</span>
                                    </NextIntlLink>
                                </li>
                                <li>
                                    <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                        <ListTree className="h-6 w-6" /> <span className={`text-nowrap`}>Word List</span>
                                    </NextIntlLink>
                                </li>
                                {session?.user.role === "admin" ? (
                                    <li>
                                        <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
                                            <LayoutDashboard className='h-6 w-6' /> <span className={`text-nowrap`}>Dashboard</span>
                                        </NextIntlLink>
                                    </li>
                                ) : null}
                            </ul>
                        </nav>
                    </SheetDescription>

                </SheetContent>
            </Sheet>
            {/* <aside className={`z-50 bg-black transition-all absolute top-0 right-0 h-full border-r-0 border-y-0 border-1 hidden lg:flex ${isSidebarOpen ? 'w-[var(--sidebar-width)]' : 'flex w-[var(--sidebar-width-collapsed)]'}`}>
                <nav className='p-5'>
                <ul className='sticky top-4 max-h-max space-y-4'>
                <li>
                <button onClick={() => {
                    saveIsSidebarOpen(!isSidebarOpen)
                    }} className='z-[99] h-max cursor-pointer max-lg:hidden rounded-sm' >
                    {isSidebarOpen ? <SidebarOpen className='h-7 w-7' /> : <SidebarClose className='h-7 w-7' />}
                    </button>
                        </li>
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
            </aside> */}
        </>
    )
}
