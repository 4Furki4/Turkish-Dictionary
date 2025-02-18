import { Metadata } from "next";
import "@/app/globals.css";
import { TRPCReactProvider } from "@/src/trpc/react";
import { GeistSans } from "geist/font/sans";
import Providers from "@/src/components/customs/Provider";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/src/components/customs/Sonner";
import { Wrapper } from "@/src/components/customs/Wrapper";
import Footer from "@/src/components/customs/Footer";
import { routing } from "@/src/i18n/routing";
import { notFound } from "next/navigation";
import { auth } from "@/src/server/auth/auth";
import { Params } from "next/dist/server/request/params";
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}
export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params
  const metadata: Metadata = {
    title: {
      template: locale === "en" ? "%s | Turkish Dictionary" : "%s | Türkçe Sözlük",
      default: locale === "en" ? "Turkish Dictionary - Words, Definitions and Examples" : "Türkçe Sözlük - Kelimeler, Anlamları ve Örnek Cümleler",
    },
    description:
      locale === "en" ? "Online Turkish Dictionary where you can search for Turkish words and can save them to your account for later." : "Türkçe kelimeleri arayabileceğiniz ve daha sonra hesabınıza kaydedebileceğiniz çevrimiçi Türkçe Sözlük.",
  }
  return metadata;
};
export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<Params>
}) {
  const { locale } = await params
  setRequestLocale(locale as string)
  const session = await auth();
  const t = await getTranslations("Navbar");
  const messages = await getMessages();
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  return (
    <html suppressHydrationWarning lang={locale as string} className="dark">
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </head>
      <body className={`${GeistSans.className} relative`}>
        <TRPCReactProvider>
          {/* <NextSSRPlugin

            //   The `extractRouterConfig` will extract **only** the route configs
            // from the router to prevent additional information from being
            // leaked to the client. The data passed to the client is the same
            // as if you were to fetch `/api/uploadthing` directly.

            routerConfig={extractRouterConfig(ourFileRouter)}
          /> */}
          <Providers>
            <NextIntlClientProvider messages={messages}>
              <Wrapper HomeIntl={t("Home")}
                session={session}
                SignInIntl={t("Sign In")}
                WordListIntl={t("Word List")} />
              {children}
              <Footer />
            </NextIntlClientProvider>
          </Providers>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
