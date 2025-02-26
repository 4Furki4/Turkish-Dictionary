"use client"
import { HistoryIcon, HomeIcon, Languages, LayoutDashboard, ListTree, Palette, StarIcon } from 'lucide-react'
import React from 'react'
import { Link as NextIntlLink, usePathname } from "@/src/i18n/routing";
import { Session } from 'next-auth';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut, } from "next-auth/react";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
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
    const { theme, setTheme } = useTheme();
    const pathName = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const params = useParams();
    const isAuthPage = ["/signup", "/signin", "/forgot-password"].includes(
        pathName
    );
    return (
        <>
            <Sheet open={isSidebarOpen} onOpenChange={(isOpen) => {
                setIsSidebarOpen(isOpen)
            }}>
                <SheetContent hideCloseButton={true} side={'left'} className="w-[200px] sm:w-[240px] max-sm:p-0 max-sm:pt-8 sidebar">
                    <SheetHeader>
                        <SheetTitle>Turkish Dictionary</SheetTitle>
                    </SheetHeader>
                    <nav className='p-5'>
                        <ul className='sticky top-4 max-h-max space-y-4'>
                            <Separator />
                            <li>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/'}>
                                    <HomeIcon className="h-6 w-6" /> <span className={`text-nowrap`}>Home</span>
                                </NextIntlLink>
                            </li>
                            <li>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/word-list'}>
                                    <ListTree className="h-6 w-6" /> <span className={`text-nowrap`}>Word List</span>
                                </NextIntlLink>
                            </li>
                            <Separator />
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
                            {session?.user.role === "admin" ? (
                                <li>
                                    <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
                                        <LayoutDashboard className='h-6 w-6' /> <span className={`text-nowrap`}>Dashboard</span>
                                    </NextIntlLink>
                                </li>
                            ) : null}
                        </ul>
                    </nav>
                </SheetContent>
            </Sheet >
        </>
    )
}
