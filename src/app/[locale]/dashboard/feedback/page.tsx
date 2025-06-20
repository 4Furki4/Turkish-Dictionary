import { api, HydrateClient } from "@/src/trpc/server";
import { FeedbackList } from "@/src/_pages/dashboard/feedback/feedback-list";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Dashboard.feedback" });
    return {
        title: t("title"),
    };
}

export default async function FeedbackPage() {
    await api.admin.feedback.getAll.prefetch({ page: 1, limit: 20 });

    return (
        <HydrateClient>
            <FeedbackList />
        </HydrateClient>
    );
}
