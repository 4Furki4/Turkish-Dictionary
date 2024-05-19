import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { pathnames, localePrefix, locales } from "./navigation";
import { Session } from "next-auth";
const publicPages = [
  "/",
  "/search",
  "/search?word=(.*)",
  "/search(.*)",
  "/signup",
  "/signin",
  "/forgot-password",
  "/reset-password/(.*)",
  "/arama",
  "/arama?word=(.*)",
  "/giris-yap",
  "/kayit-ol",
  "/sifremi-unuttum",
  "/sifreyi-yenile/(.*)",
];

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix,
  pathnames,
});
const authMiddleware = withAuth(
  // Note that this callback is only invoked if
  // the `authorized` callback has returned `true`
  // and not for pages listed in `pages`.
  async function onSuccess(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ req: { cookies } }) => {
        const sessionToken = cookies.get("next-auth.session-token");
        if (sessionToken == null) {
          const sessionToken = cookies.get("__Secure-next-auth.session-token");
          return sessionToken != null;
        }
        return sessionToken != null;
      },
    },

  }
);

export default async function middleware(req: NextRequest) {

  const publicPathnameRegex = RegExp(
    `^(/(${locales.join("|")}))?(${publicPages.join("|")})?/?$`,
    "i"
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(req as any);
  } else {
    return (authMiddleware as any)(req);
  }
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};