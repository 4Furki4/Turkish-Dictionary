import createMiddleware from "next-intl/middleware";
import { locales, routing } from "./i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "./server/auth/config";
const publicPages = [
  "/",
  "/search",
  "/search/(.*)",
  "/search(.*)",
  "/signup",
  "/signin",
  "/forgot-password",
  "/reset-password/(.*)",
  "/arama",
  "/arama/(.*)",
  "/giris-yap",
  "/kayit-ol",
  "/sifremi-unuttum",
  "/sifreyi-yenile/(.*)",
];
const handleI18nRouting = createMiddleware(routing);
const { auth: middleware } = NextAuth(authConfig)

export default middleware(async (req) => {
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);
  if (isPublicPage) {
    return handleI18nRouting(req);
  }
  if (!req.auth && req.nextUrl.pathname !== "/signin") {
    const newUrl = new URL("/singin", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
  return handleI18nRouting(req)
})

// Middleware Configuration
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)", "/", "/(api|trpc)(.*)"],
};