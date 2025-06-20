"use client"
import { BellIcon, HistoryIcon, HomeIcon, LayoutDashboard, ListTree, StarIcon, UserIcon } from 'lucide-react'
import React from 'react'
import { Link as NextIntlLink } from "@/src/i18n/routing";
import { Session } from 'next-auth';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations()
    return (
        <>
            <Sheet open={isSidebarOpen} onOpenChange={(isOpen) => {
                setIsSidebarOpen(isOpen)
            }}>
                <SheetContent hideCloseButton={true} side={'left'} className="w-[240px] sm:w-[280px] max-sm:p-0 max-sm:pt-8 sidebar">
                    <SheetHeader>
                        <SheetTitle>{t("Navbar.Title")}</SheetTitle>
                    </SheetHeader>
                    <nav className='p-5'>
                        <ul className='sticky top-4 max-h-max space-y-4'>
                            <Separator />
                            <li>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/'}>
                                    <HomeIcon className="h-6 w-6" /> <span className={`text-nowrap`}>{t("Navbar.Home")}</span>
                                </NextIntlLink>
                            </li>
                            <li>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/word-list'}>
                                    <ListTree className="h-6 w-6" /> <span className={`text-nowrap`}>{t("Navbar.Word List")}</span>
                                </NextIntlLink>
                            </li>
                            <li>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/announcements'}>
                                    <BellIcon className="h-6 w-6" /> <span className={`text-nowrap`}>{t("Navbar.Announcements")}</span>
                                </NextIntlLink>
                            </li>
                            <Separator />
                            {session?.user?.id ? (
                                <li>
                                    <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={{
                                        pathname: "/profile/[id]",
                                        params: { id: session?.user?.id },
                                    }}>
                                        <UserIcon className="h-6 w-6" /> <span className={`text-nowrap`}>{t("Navbar.Profile")}</span>
                                    </NextIntlLink>
                                </li>
                            ) : null}
                            <li className='flex'>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/saved-words'}>
                                    <StarIcon className="h-6 w-6" /> <span className={`text-nowrap`}>{t("Navbar.SavedWords")}</span>
                                </NextIntlLink>
                            </li>
                            <li>
                                <NextIntlLink className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm' href={'/search-history'}>
                                    <HistoryIcon className="h-6 w-6" /> <span className={`text-nowrap`}>{t("Navbar.SearchHistory")}</span>
                                </NextIntlLink>
                            </li>
                            {session?.user?.role === "admin" ? (
                                <li>
                                    <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 rounded-sm'>
                                        <LayoutDashboard className='h-6 w-6' /> <span className={`text-nowrap`}>{t("Navbar.Dashboard")}</span>
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
