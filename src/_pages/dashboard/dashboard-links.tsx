"use client"
import React from 'react'
import { Link, usePathname } from "@/src/i18n/routing";
import { Link as NextUILink } from "@heroui/react"
import { Settings } from "lucide-react";

const links: { href: "/dashboard" | "/dashboard/user-list" | "/dashboard/dynamic-parameters"; label: string; icon?: React.ReactNode; }[] = [
  {
    href: "/dashboard",
    label: "Word List",
  },
  {
    href: "/dashboard/user-list",
    label: "User List",
  },
  {
    href: "/dashboard/dynamic-parameters",
    label: "Dynamic Parameters",
    icon: <Settings className="w-5 h-5" />,
  },
]

export default function DashboardLinks() {
  const pathname = usePathname()
  return (
    <div className='flex gap-2'>
      {links.map((link, index) => (
        <NextUILink as={Link} href={link.href} key={index} underline={pathname === link.href ? "always" : "hover"}>
          {link.label}
        </NextUILink>
      ))}
    </div>
  )
}
