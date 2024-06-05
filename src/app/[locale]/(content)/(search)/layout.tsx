import Search from "@/src/components/customs/Search";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import React from "react";

export default async function SearchLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale)
  const t = await getTranslations("Home");
  return <Search warningParamIntl={t("alreadySignedIn")}>{children}</Search>;
}
