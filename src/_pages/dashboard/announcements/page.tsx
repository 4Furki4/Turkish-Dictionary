"use client";

import React from "react";
import AnnouncementsList from "./announcements-list";
import { useTranslations } from "next-intl";

export default function AnnouncementsPage() {
  const t = useTranslations("Dashboard.Announcements");
  
  return (
    <div className="container mx-auto py-6">
      <AnnouncementsList />
    </div>
  );
}
