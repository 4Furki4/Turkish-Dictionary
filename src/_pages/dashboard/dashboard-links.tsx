"use client"
import React from 'react';
import { Link, usePathname } from "@/src/i18n/routing";
import { Link as NextUILink } from "@heroui/react";
import { Settings } from "lucide-react";
import { useLocale } from 'next-intl';

const getLinks: (locale: string) => { href: string; label: string; icon?: React.ReactNode; }[] = (locale) => [
  {
    href: "/dashboard",
    label: locale === "en" ? "Word List" : "Kelimeler",
  },
  {
    href: "/dashboard/user-list",
    label: locale === "en" ? "User List" : "Kullanıcı Listesi",
  },
  {
    href: "/dashboard/announcements",
    label: locale === "en" ? "Announcements" : "Duyurular",
  },
  {
    href: "/dashboard/dynamic-parameters",
    label: locale === "en" ? "Dynamic Parameters" : "Dinamik Parametreler",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    href: "/dashboard/requests",
    label: locale === "en" ? "Requests" : "İstekler",
    icon: <Settings className="w-5 h-5" />,
  },
]

export default function DashboardLinks() {
  const pathname = usePathname()
  const locale = useLocale()
  return (
    <div className='flex gap-2'>
      {getLinks(locale).map((link, index) => (
        <NextUILink as={Link} href={link.href} key={index} underline={pathname === link.href ? "always" : "hover"}>
          {link.label}
        </NextUILink>
      ))}
    </div>
  )
}
