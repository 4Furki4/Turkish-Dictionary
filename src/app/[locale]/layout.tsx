import { Metadata } from "next";
import "@/app/globals.css";
import { TRPCReactProvider } from "@/src/trpc/react";
import { GeistSans } from "geist/font/sans";
import Providers from "@/src/components/customs/provider";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { Toaster } from "@/src/components/customs/sonner";
import Footer from "@/src/components/customs/footer";
import { routing } from "@/src/i18n/routing";
import { notFound } from "next/navigation";
import { auth } from "@/src/server/auth/auth";
import { Params } from "next/dist/server/request/params";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import NavbarAndSidebar from "@/src/components/customs/navbar-and-sidebar";
import { BackgroundGradient } from "@/src/components/customs/background-gradient";
import { CaptchaProvider } from "@/src/components/customs/captcha-provider";
import { PreferencesInitializer } from "@/src/components/customs/preferences-initializer";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale === 'en';
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
  const { locale } = await params;
  const session = await auth();
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const messages = await getMessages();
  setRequestLocale(locale);
  const t = await getTranslations("Navbar");

  return (
    <html suppressHydrationWarning lang={locale} className="dark">
      <body className={`${GeistSans.className} relative`}>
        <TRPCReactProvider>
          <NextIntlClientProvider messages={messages}>
            <CaptchaProvider>
              <Providers>
                <div className="flex flex-col min-h-screen">
                  <PreferencesInitializer />
                  <NavbarAndSidebar
                    session={session}
                    HomeIntl={t("Home")}
                    SignInIntl={t("Sign In")}
                    WordListIntl={t("Word List")}
                    TitleIntl={t("Title")}
                    ProfileIntl={t("Profile")}
                    SavedWordsIntl={t("SavedWords")}
                    MyRequestsIntl={t("MyRequests")}
                    SearchHistoryIntl={t("SearchHistory")}
                    LogoutIntl={t("Logout")}
                    AnnouncementsIntl={t("Announcements")}
                    ariaAvatar={t("ariaAvatar")}
                    ariaMenu={t("ariaMenu")}
                    ariaLanguages={t("ariaLanguages")}
                    ariaSwitchTheme={t("ariaSwitchTheme")}
                  />
                  <main className="relative flex-grow w-full flex">
                    {/* ✨ Moved BackgroundGradient here */}
                    <BackgroundGradient />
                    {children}
                  </main>
                  <Footer />
                </div>
                <SpeedInsights />
                <Analytics />
              </Providers>
            </CaptchaProvider >
          </NextIntlClientProvider >
        </TRPCReactProvider >
        <Toaster />
      </body >
    </html >
  );
}
