import { Metadata } from "next";
import RequestsList from "@/src/_pages/requests/requests-list";
import { getTranslations } from "next-intl/server";
import { HydrateClient } from "@/src/trpc/server";
import { auth } from "@/src/server/auth/auth";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("requests.title"),
    description: t("requests.description"),
  };
}

export default async function RequestsPage() {
  // Check if user is authenticated
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <HydrateClient>
      <RequestsList />
    </HydrateClient>
  );
}
