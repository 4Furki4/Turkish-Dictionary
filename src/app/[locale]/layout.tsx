import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import "../globals.css";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Turkish Dictionary",
  description:
    "Online Turkish Dictionary where you can search for Turkish words and can save them to your account for later.",
};
export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.className} min-h-[100dvh]`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Suspense
            fallback={
              <Loader2
                size={"32px"}
                color="hsl(var(--background) / 0.7)"
                className="fixed inset-0 m-auto animate-spin duration-500"
              />
            }
          >
            {children}
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
