import { Metadata } from "next";
import "@/app/globals.css";
import { TRPCReactProvider } from "@/src/trpc/react";
import { GeistSans } from "geist/font/sans";
import Providers from "@/src/components/customs/provider";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/src/components/customs/sonner";
import { Wrapper } from "@/src/components/customs/wrapper";
import Footer from "@/src/components/customs/footer";
import { routing } from "@/src/i18n/routing";
import { notFound } from "next/navigation";
import { auth } from "@/src/server/auth/auth";
import { Params } from "next/dist/server/request/params";
import { SpeedInsights } from "@vercel/speed-insights/next"

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale === "en";

  return {
    metadataBase: new URL('https://turkce-sozluk.com'),
    title: {
      template: isEnglish ? "%s | Turkish Dictionary" : "%s | Türkçe Sözlük",
      default: isEnglish
        ? "Turkish Dictionary - Words, Definitions and Examples"
        : "Türkçe Sözlük - Kelimeler, Anlamları ve Örnek Cümleler",
    },
    description: isEnglish
      ? "Online Turkish Dictionary where you can search for Turkish words and can save them to your account for later."
      : "Türkçe kelimeleri arayabileceğiniz ve daha sonra hesabınıza kaydedebileceğiniz çevrimiçi Türkçe Sözlük.",
    openGraph: {
      title: isEnglish ? "Turkish Dictionary" : "Türkçe Sözlük",
      description: isEnglish
        ? "Comprehensive Turkish dictionary with definitions, examples, and more"
        : "Kapsamlı Türkçe sözlük, tanımlar, örnekler ve daha fazlası",
      type: 'website',
      locale: isEnglish ? 'en_US' : 'tr_TR',
      siteName: isEnglish ? 'Turkish Dictionary' : 'Türkçe Sözlük',
    },
    twitter: {
      card: 'summary_large_image',
      title: isEnglish ? "Turkish Dictionary" : "Türkçe Sözlük",
      description: isEnglish
        ? "Comprehensive Turkish dictionary with definitions, examples, and more"
        : "Kapsamlı Türkçe sözlük, tanımlar, örnekler ve daha fazlası",
    },
    alternates: {
      canonical: '/',
      languages: {
        'en': 'https://turkce-sozluk.com/en',
        'tr': 'https://turkce-sozluk.com/tr',
      },
    },
  };
}
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
    <html suppressHydrationWarning lang={locale as string} className="dark" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <Wrapper TitleIntl={t("Title")}
                HomeIntl={t("Home")}
                session={session}
                SignInIntl={t("Sign In")}
                WordListIntl={t("Word List")}
                ProfileIntl={t("Profile")}
                SavedWordsIntl={t("SavedWords")}
                MyRequestsIntl={t("MyRequests")}
                SearchHistoryIntl={t("SearchHistory")}
                LogoutIntl={t("Logout")} />
              {children}
              <SpeedInsights />
              <Footer />
            </Providers>
          </NextIntlClientProvider>
        </TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
