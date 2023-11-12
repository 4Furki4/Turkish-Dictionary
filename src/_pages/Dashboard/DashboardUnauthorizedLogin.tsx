"use client";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function DashboardUnauthorizedMessage() {
  const t = useTranslations("Dashboard");

  return (
    <main className="text-center px-4 sm:px-0 sm:max-w-5xl mx-auto grid gap-4 justify-items-center mt-4">
      <h1 className="text-fs-3">{t("UnauthorizedMessage")}</h1>
      <Link className="text-fs-1 hover:underline" href={"/"}>
        {t("GoBackToHomepage")}
      </Link>
      {/* Todo(1): Add a link to contact the admin */}
    </main>
  );
}
