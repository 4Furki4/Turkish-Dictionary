import { Metadata } from "next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TRPCReactProvider } from "@/src/trpc/react";
import { headers } from "next/headers";
import { GeistSans } from "geist/font/sans";
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "tr" }];
}
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
      <body className={`${GeistSans.className} min-h-[100dvh]`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TRPCReactProvider headers={headers()}>
            <Suspense
              fallback={
                <Loader2
                  size={"32px"}
                  color="hsl(var(--background) / 0.7)"
                  className="fixed inset-0 m-auto animate-spin duration-500"
                />
              }
            >
              <NextSSRPlugin
                /**
                 * The `extractRouterConfig` will extract **only** the route configs
                 * from the router to prevent additional information from being
                 * leaked to the client. The data passed to the client is the same
                 * as if you were to fetch `/api/uploadthing` directly.
                 */
                routerConfig={extractRouterConfig(ourFileRouter)}
              />
              {children}
            </Suspense>
          </TRPCReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
