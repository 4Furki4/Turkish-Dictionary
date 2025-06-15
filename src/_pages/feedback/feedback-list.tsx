"use client";

import { api } from "@/src/trpc/react";
import { useTranslations } from "next-intl";
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Chip } from "@heroui/react";
import { formatDate } from "@/src/utils/date";
import { toast } from "sonner";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/src/server/api/root";
import { Session } from "next-auth";
// Define the type for a single feedback item based on router output
type RouterOutput = inferRouterOutputs<AppRouter>;
type FeedbackItem = RouterOutput["feedback"]["list"]["items"][number];
type InitialFeedbackData = RouterOutput["feedback"]["list"];
/**
 * Renders a single feedback card with details and voting button.
 */
function FeedbackCard({ item, session }: { item: FeedbackItem, session: Session | null }) {
    const t = useTranslations("Feedback");
    const utils = api.useUtils();

    const voteMutation = api.feedback.vote.useMutation({
        onMutate: async ({ feedbackId }) => {
            // Optimistic update
            await utils.feedback.list.cancel();
            const previousData = utils.feedback.list.getInfiniteData();

            utils.feedback.list.setInfiniteData({}, (oldData) => {
                if (!oldData) return previousData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
                        ...page,
                        items: page.items.map((feedbackItem) =>
                            feedbackItem.feedback.id === feedbackId
                                ? {
                                    ...feedbackItem,
                                    hasVoted: !feedbackItem.hasVoted,
                                    voteCount: feedbackItem.hasVoted
                                        ? feedbackItem.voteCount - 1
                                        : feedbackItem.voteCount + 1,
                                }
                                : feedbackItem
                        ),
                    })),
                };
            });

            return { previousData };
        },
        onError: (err, newVote, context) => {
            // Revert on error
            utils.feedback.list.setInfiniteData({}, context?.previousData);
            toast.error(t("voteError"));
        },
        onSettled: () => {
            utils.feedback.list.invalidate();
        },
    });

    const handleVote = () => {
        if (!session) {
            toast.error(t('mustBeLoggedIn'));
            return;
        }
        voteMutation.mutate({ feedbackId: item.feedback.id });
    };

    return (
        <Card classNames={{
            base: "bg-background/10",
        }} className="border border-border rounded-sm p-2 w-full mb-4" isBlurred >
            <CardHeader className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <Avatar src={item.user?.image ?? '/default-avatar.png'} />
                    <div>
                        <p className="font-semibold">{item.user?.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(item.feedback.createdAt)}
                        </p>
                    </div>
                </div>
                <Chip color={item.feedback.type === "feature" ? "success" : item.feedback.type === "bug" ? "danger" : "warning"} variant="flat" radius="sm" className="text-xs font-semibold uppercase px-2 py-1">
                    {t(`types.${item.feedback.type}`)}
                </Chip>
            </CardHeader>
            <CardBody>
                <h3 className="text-xl font-bold mb-2">{item.feedback.title}</h3>
                <p className="text-muted-foreground">{item.feedback.description}</p>
            </CardBody>
            <CardFooter>
                <Button
                    variant={item.hasVoted ? "solid" : "flat"}
                    color="primary"
                    onPress={handleVote}
                    disabled={voteMutation.isPending}
                    className="flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7" /></svg>
                    <span>{t("upvote")}</span>
                    <span className="font-bold">{item.voteCount}</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

/**
 * Main component to display the list of feedback items with a "Load More" button.
 */
export function FeedbackList({ initialData, session }: { initialData: InitialFeedbackData, session: Session | null }) {
    const t = useTranslations("Feedback");
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        api.feedback.list.useInfiniteQuery(
            {},
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
                initialData: { pages: [initialData], pageParams: [null] },
            }
        );

    const feedbackItems = data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div>
            {feedbackItems.map((item) => (
                <FeedbackCard key={item.feedback.id} item={item} session={session} />
            ))}
            <div className="mt-6 text-center">
                {/* Render a button to manually trigger fetching the next page */}
                {hasNextPage && (
                    <Button
                        onPress={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="flat"
                    >
                        {isFetchingNextPage
                            ? t("loadingMore")
                            : t("loadMore")}
                    </Button>
                )}
                {!hasNextPage && feedbackItems.length > 0 && (
                    <p className="text-center text-muted-foreground mt-4">
                        {t("noMoreFeedback")}
                    </p>
                )}
                {feedbackItems.length === 0 && !isFetchingNextPage && (
                    <p>{t("noFeedbackYet")}</p>
                )}
            </div>
        </div>
    );
}
