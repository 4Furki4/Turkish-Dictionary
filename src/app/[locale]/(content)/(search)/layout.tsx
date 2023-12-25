import Search from "@/src/components/customs/Search";
import { getTranslations } from "next-intl/server";
import React from "react";

export default async function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Home");
  return <Search warningParamIntl={t("alreadySignedIn")}>{children}</Search>;
}
