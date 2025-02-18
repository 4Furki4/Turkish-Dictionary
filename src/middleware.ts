import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
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
export default handleI18nRouting

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',]
}
