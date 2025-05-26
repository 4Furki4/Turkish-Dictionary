"use client";

import React from "react";
import AnnouncementForm from "../../announcement-form";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { Spinner } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";

export default function EditAnnouncementPage() {
  const t = useTranslations("Dashboard.Announcements");
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  
  const { data, isLoading, isError } = api.admin.announcements.getAnnouncementForEdit.useQuery(
    { id },
    {
      enabled: !isNaN(id),
      onError: () => {
        router.push("/dashboard/announcements");
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-10">
        <p className="text-danger">{t("announcementNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t("editAnnouncement", { slug: data.slug })}
        </h1>
        <p className="text-gray-500 mt-1">{t("editDescription")}</p>
      </div>
      
      <AnnouncementForm initialData={data} />
    </div>
  );
}
