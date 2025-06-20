import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/src/trpc/server";
import { HydrateClient } from "@/src/trpc/server";
import { auth } from "@/src/server/auth/auth";
import { FeedbackList } from "@/src/_pages/feedback/feedback-list";
import { FeedbackModal } from "@/src/components/customs/modals/add-feedback";

interface FeedbackPageProps {
    params: Promise<{
        locale: string;
    }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("Feedback");
    const session = await auth();

    // Prefetch with default filters (exclude closed statuses by default)
    await api.feedback.list.prefetch({
        limit: 10,
        // Default exclusion of closed/resolved statuses for public view
        status: undefined, // Let the backend handle default exclusions
        sortBy: "votes",
        sortOrder: "desc",
    });

    return (
        <HydrateClient>
            <div className="container mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">{t("title")}</h1>
                    <FeedbackModal session={session}>
                        {t("submitFeedback")}
                    </FeedbackModal>
                </div>
                <p className="text-muted-foreground mb-8">{t("description")}</p>

                <FeedbackList session={session} />
            </div>
        </HydrateClient>
    );
}
