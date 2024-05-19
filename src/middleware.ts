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
      authorized: async ({ req }) => {
        try {
          const resSession = await fetch(
            process.env.NEXTAUTH_URL + '/api/auth/session',
            {
              method: 'GET',
              headers: {
                ...Object.fromEntries(req.headers),
              },
            },
          );
          const session = await resSession.json();
          if (session?.user?.id != null) return true;
          return false;
        } catch (error) {
          console.error("Error while checking session", error);
          return false;
        }


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

// export default createMiddleware({
//   locales: ["en", "tr"],
//   defaultLocale: "en",
// });

// export const config = {
//   // Skip all paths that should not be internationalized. This example skips
//   // certain folders and all pathnames with a dot (e.g. favicon.ico)
//   matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
// };
