import { Metadata } from "next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/src/app/api/uploadthing/core";
import "@/app/globals.css";
import { TRPCReactProvider } from "@/src/trpc/react";
import { GeistSans } from "geist/font/sans";
import Providers from "@/src/components/customs/Provider";
import { getServerAuthSession } from "@/src/server/auth";
import { getMessages, getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/src/components/customs/Sonner";
import { Wrapper } from "@/src/components/customs/Wrapper";
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}
export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const metadata: Metadata = {
    title: locale === "en" ? "Turkish Dictionary - Words, Definitions and Examples" : "Türkçe Sözlük - Kelimeler, Anlamları ve Örnek Cümleler",
    description:
      locale === "en" ? "Online Turkish Dictionary where you can search for Turkish words and can save them to your account for later." : "Türkçe kelimeleri arayabileceğiniz ve daha sonra hesabınıza kaydedebileceğiniz çevrimiçi Türkçe Sözlük.",
  }
};
export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const session = await getServerAuthSession();
  const t = await getTranslations("Navbar");
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${GeistSans.className} min-h-[100dvh] overflow-x-hidden relative`}>
        <TRPCReactProvider>
          <NextSSRPlugin

            //   The `extractRouterConfig` will extract **only** the route configs
            // from the router to prevent additional information from being
            // leaked to the client. The data passed to the client is the same
            // as if you were to fetch `/api/uploadthing` directly.

            routerConfig={extractRouterConfig(ourFileRouter)}
          />
          <Providers>
            <NextIntlClientProvider messages={messages}>
              <Wrapper HomeIntl={t("Home")}
                session={session}
                SignInIntl={t("Sign In")}
                WordListIntl={t("Word List")} />
              {children}
            </NextIntlClientProvider>
          </Providers>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
