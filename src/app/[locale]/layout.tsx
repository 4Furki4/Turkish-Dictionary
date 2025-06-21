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
import { SessionProvider } from "next-auth/react";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}

// Assuming Params is defined elsewhere, if not, define it.
// type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;

}): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale === 'en';

  // --- Unified, SEO-friendly Description ---
  // Using a single, strong description ensures a consistent message.
  // This version highlights the key features: community-driven, modern, and open-source.
  const description = isEnglish
    ? "The community-driven, modern, and open-source Turkish Dictionary. Search for words and their meanings, see sample sentences, and contribute."
    : "Toplulukla gelişen, çağdaş ve açık kaynak Türkçe Sözlük. Kelimeleri ve anlamlarını arayın, paylaşın, örnek cümleleri görün ve katkıda bulunun.";

  // --- Homepage-specific Keywords ---
  // While not used by Google for ranking, this can be useful for other tools.
  const keywords = isEnglish
    ? ['turkish', 'dictionary', 'turkish language', 'online dictionary', 'learn turkish', 'sozluk', 'modern', 'open source', 'community driven']
    : ['türkçe', 'sözlük', 'türkçe sözlük', 'online sözlük', 'türkçe öğren', 'kelime anlamları', 'tdk', 'çağdaş türkçe sözlük', 'modern', 'açık kaynak', 'toplulukla gelişen'];

  return {
    metadataBase: new URL('https://turkce-sozluk.com'),
    // --- Title ---
    // The title structure is excellent. No changes needed.
    title: {
      template: isEnglish ? "%s | Modern Turkish Dictionary" : "%s | Çağdaş Türkçe Sözlük",
      default: isEnglish
        ? "Turkish Dictionary - The Modern, Open-Source and Community-Driven Dictionary"
        : "Türkçe Sözlük - Toplulukla Gelişen, Çağdaş ve Açık Kaynak Sözlük",
    },
    // --- Main Description ---
    description,
    // --- Keywords ---
    keywords,
    // --- Open Graph (for social media) ---
    openGraph: {
      title: isEnglish ? "Modern Turkish Dictionary" : "Çağdaş Türkçe Sözlük",
      description, // Using the unified description
      type: 'website',
      locale: isEnglish ? 'en_US' : 'tr_TR',
      siteName: isEnglish ? 'Turkish Dictionary' : 'Türkçe Sözlük',
      // The opengraph-image is automatically added by Next.js
    },
    // --- Twitter Card ---
    twitter: {
      card: 'summary_large_image',
      title: isEnglish ? "Modern Turkish Dictionary" : "Çağdaş Türkçe Sözlük",
      description, // Using the unified description
      // The twitter:image is also automatically added
    },
    // --- Alternates ---
    // Your alternates configuration is perfect for i18n. No changes needed.
    alternates: {
      canonical: '/',
      languages: {
        'en-US': '/en',
        'tr-TR': '/tr',
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
                <SessionProvider session={session}>

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
                      ariaBlur={t("ariaBlur")}
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
                </SessionProvider>
              </Providers>
            </CaptchaProvider >
          </NextIntlClientProvider >
        </TRPCReactProvider >
        <Toaster />
      </body >
    </html >
  );
}
