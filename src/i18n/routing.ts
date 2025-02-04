import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ["en", "tr"] as const;
export const localePrefix = "as-needed";

// The `pathnames` object holds pairs of internal
// and external paths, separated by locale.
export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: 'tr',
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      'en': '/en',
      'tr': '/tr',
    },
  },
  pathnames: {
    // If all locales use the same pathname, a
    // single external path can be provided.
    "/": "/",

    // If locales use different paths, you can
    // specify each external path per locale.
    "/signin": {
      "en": "/signin",
      "tr": "/giris-yap",
    },
    "/signup": {
      "en": "/signup",
      "tr": "/kayit-ol",
    },
    "/forgot-password": {
      "en": "/forgot-password",
      "tr": "/sifremi-unuttum",
    },
    "/saved-words": {
      "en": "/saved-words",
      "tr": "/kaydedilen-kelimeler",
    },
    "/profile": {
      "en": "/profile",
      "tr": "/profil",
    },
    "/dashboard": {
      "en": "/dashboard",
      "tr": "/panel",
    },
    "/dashboard/create-word": {
      "en": "/dashboard/create-word",
      "tr": "/panel/kelime-ekle",
    },
    "/dashboard/user-list": {
      "en": "/dashboard/user-list",
      "tr": "/panel/kullanicilar",
    },
    "/search": {
      "en": "/search",
      "tr": "/arama",
    },
    "/search/[word]": {
      "en": "/search/[word]",
      "tr": "/arama/[word]",
    },
    // Dynamic params are supported via square brackets
    "/reset-password/[token]": {
      "en": "/reset-password/[token]",
      "tr": "/sifreyi-yenile/[token]",
    },
  }

})


export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
