import { Metadata } from "next";
import RequestDetail from "@/src/_pages/requests/request-detail";
import { getTranslations } from "next-intl/server";
import { HydrateClient } from "@/src/trpc/server";
import { auth } from "@/src/server/auth/auth";
import { redirect } from "next/navigation";
import { api } from "@/src/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("requestDetail.title"),
    description: t("requestDetail.description"),
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Check if user is authenticated
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const requestId = parseInt(id, 10);

  if (isNaN(requestId)) {
    // Handle invalid ID
    redirect("/requests");
  }

  // Prefetch request data
  api.request.getUserRequest.prefetch({ requestId });

  return (
    <HydrateClient>
      <RequestDetail requestId={requestId} />
    </HydrateClient>
  );
}
