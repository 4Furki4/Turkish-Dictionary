"use client";

import React from "react";
import AnnouncementForm from "../announcement-form";
import { useTranslations } from "next-intl";

export default function NewAnnouncementPage() {
  const t = useTranslations("Dashboard.Announcements");
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("createNew")}</h1>
        <p className="text-gray-500 mt-1">{t("createDescription")}</p>
      </div>
      
      <AnnouncementForm />
    </div>
  );
}
