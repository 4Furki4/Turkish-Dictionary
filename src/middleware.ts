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
  const { nextUrl } = req
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );
  const defaultLocale = routing.defaultLocale
  const pathLocale = nextUrl.pathname.split("/")[1];
  const locale = (routing.locales as readonly string[]).includes(pathLocale)
    ? pathLocale
    : defaultLocale;
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);
  if (isPublicPage) {
    return handleI18nRouting(req);
  }
  console.log(req.nextUrl.pathname)
  const signinPath = routing.pathnames["/signin"]
  const isSigninPath = signinPath[locale as keyof typeof signinPath] === req.nextUrl.pathname
  if (!req.auth && !isSigninPath) {
    console.log("redirecting to signin")
    const newUrl = new URL("/signin", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
  return handleI18nRouting(req)
})

// Middleware Configuration
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
