import { Metadata } from "next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

import "@/app/globals.css";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TRPCReactProvider } from "@/src/trpc/react";
import { headers } from "next/headers";
import { GeistSans } from "geist/font/sans";
import Providers from "@/src/components/customs/Provider";
import { getServerAuthSession } from "@/src/server/auth";
import Navbar from "@/src/components/customs/Navbar";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
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
  const session = await getServerAuthSession();
  const t = await getTranslations("Navbar");
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${GeistSans.className} min-h-[100dvh]`}>
        <TRPCReactProvider headers={headers()}>

          <NextSSRPlugin
            /**
             * The `extractRouterConfig` will extract **only** the route configs
             * from the router to prevent additional information from being
             * leaked to the client. The data passed to the client is the same
             * as if you were to fetch `/api/uploadthing` directly.
             */
            routerConfig={extractRouterConfig(ourFileRouter)}
          />
          <Providers>
            <NextIntlClientProvider messages={messages}>
              <Navbar
                HomeIntl={t("Home")}
                session={session}
                SignInIntl={t("Sign In")}
                WordListIntl={t("Word List")}
              />
              {children}
            </NextIntlClientProvider>
          </Providers>

        </TRPCReactProvider>
      </body>
    </html>
  );
}
