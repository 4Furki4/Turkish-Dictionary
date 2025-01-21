"use client"
import React from 'react'
import { Link, usePathname, useRouter } from "@/src/navigation";
import { Link as NextUILink } from "@heroui/react"
export default function DashboardLinks() {
    const pathname = usePathname()
    return (
        <div className='flex gap-2'>
            <NextUILink as="div" underline={pathname === "/dashboard" ? "always" : "hover"}>
                <Link href={'/dashboard'}>
                    Word List
                </Link>
            </NextUILink>
            <NextUILink as="div" underline={pathname === "/dashboard/user-list" ? "always" : "hover"}>
                <Link href={'/dashboard/user-list'}>
                    User List
                </Link>
            </NextUILink>
        </div>
    )
}
