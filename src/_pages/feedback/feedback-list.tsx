"use client";

import { api } from "@/src/trpc/react";
import { useTranslations } from "next-intl";
import { Avatar, Button, Card, CardBody, CardFooter, CardHeader, Chip } from "@heroui/react";
import { formatDate } from "@/src/utils/date";
import { toast } from "sonner";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/src/server/api/root";
import { Session } from "next-auth";
import { FeedbackStatus, statusColorMap } from "../dashboard/feedback/feedback-list";
import { useCallback, useState, useMemo } from "react";
import { PublicFeedbackFilterBar, type PublicFeedbackFilters } from "@/src/_pages/feedback/public-feedback-filter-bar";
import { useDebounce } from "@/src/hooks/use-debounce";
import { feedbackTypeEnum, feedbackStatusEnum } from "@/db/schema/feedbacks";
import { FeedbackSkeleton } from "./skeleton";

// Define the type for a single feedback item based on router output
type RouterOutput = inferRouterOutputs<AppRouter>;
type FeedbackItem = RouterOutput["feedback"]["list"]["items"][number];
type InitialFeedbackData = RouterOutput["feedback"]["list"];

/**
 * Renders a single feedback card with details and voting button.
 */
function FeedbackCard({ item, session }: { item: FeedbackItem, session: Session | null }) {
    const t = useTranslations("Feedback");
    const tDashboard = useTranslations("Dashboard.feedback");
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

    const isUpvoteDisabled = useCallback((feedbackStatus: FeedbackStatus) => {
        const disabledStatuses: FeedbackStatus[] = ["closed", "rejected", "duplicate", "fixed", "wont_implement", "implemented"];
        if (disabledStatuses.includes(feedbackStatus)) return true;
    }, []);

    return (
        <Card classNames={{
            base: "bg-background/10",
        }} className="border border-border rounded-sm p-2 w-full mb-4" isBlurred >
            <CardHeader className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="flex gap-2 md:gap-4">
                    <Avatar
                        isBordered
                        radius="full"
                        size="md"
                        src={item.user?.image ?? undefined}
                        name={item.user?.name ?? t("anonymousUser")}
                    />
                    <div className="flex flex-col">
                        <p className="text-small text-default-500">
                            {item.user?.name ?? t("anonymousUser")}
                        </p>
                        <p className="text-small text-default-500">
                            {formatDate(item.feedback.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="sm:ml-auto flex flex-col xs:flex-row gap-2">
                    <Chip
                        color={statusColorMap[item.feedback.status]}
                        variant="flat" radius="sm" className="text-xs font-semibold uppercase px-2 py-1" size="sm"
                    >
                        {tDashboard(`statuses.${item.feedback.status}`)}
                    </Chip>
                    <Chip color={item.feedback.type === "feature" ? "success" : item.feedback.type === "bug" ? "danger" : "warning"} variant="flat" radius="sm" className="text-xs font-semibold uppercase px-2 py-1" size="sm">
                        {t(`types.${item.feedback.type}`)}
                    </Chip>
                </div>
            </CardHeader>
            <CardBody>
                <h3 className="text-xl font-semibold">{item.feedback.title}</h3>
                <p className="text-default-600">{item.feedback.description}</p>
            </CardBody>
            <CardFooter className="gap-3">
                <Button
                    color={item.hasVoted ? "primary" : "default"}
                    variant={item.hasVoted ? "solid" : "bordered"}
                    size="sm"
                    onPress={handleVote}
                    isDisabled={!session || isUpvoteDisabled(item.feedback.status)}
                    isLoading={voteMutation.isPending}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7" /></svg>
                    <span>{t("upvote")}</span>
                    <span className="font-bold">{item.voteCount}</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

// Main component to display the list of feedback items with filters and "Load More" button.
interface FeedbackListProps {
    initialData?: any;
    session: Session | null;
}

export function FeedbackList({ session }: FeedbackListProps) {
    const t = useTranslations("Feedback");

    // Filter state
    const [filters, setFilters] = useState<PublicFeedbackFilters>({
        type: [],
        status: [],
        searchTerm: "",
        sortBy: "votes",
        sortOrder: "desc",
        startDate: undefined,
        endDate: undefined,
    });

    // Debounce search term
    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    // Prepare query parameters
    const queryFilters = useMemo(() => ({
        limit: 10,
        type: filters.type.length > 0 ? filters.type as (typeof feedbackTypeEnum.enumValues[number])[] : undefined,
        status: filters.status.length > 0 ? filters.status as (typeof feedbackStatusEnum.enumValues[number])[] : undefined,
        searchTerm: debouncedSearchTerm || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        startDate: filters.startDate,
        endDate: filters.endDate,
    }), [filters.type, filters.status, debouncedSearchTerm, filters.sortBy, filters.sortOrder, filters.startDate, filters.endDate]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = api.feedback.list.useInfiniteQuery(
        queryFilters,
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
    );

    const handleClearFilters = () => {
        setFilters({
            type: [],
            status: [],
            searchTerm: "",
            sortBy: "votes",
            sortOrder: "desc",
            startDate: undefined,
            endDate: undefined,
        });
    };

    const allItems = data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <PublicFeedbackFilterBar
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
            />

            {/* Feedback List */}
            <div className="space-y-4">
                {isLoading ? (
                    <FeedbackSkeleton count={6} />
                ) : allItems.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">{t("noFeedbackFound")}</p>
                    </div>
                ) : (
                    allItems.map((item) => (
                        <FeedbackCard key={item.feedback.id} item={item} session={session} />
                    ))
                )}

                {/* Load More Button */}
                {hasNextPage && (
                    <div className="text-center">
                        <Button
                            onPress={() => fetchNextPage()}
                            isLoading={isFetchingNextPage}
                            variant="bordered"
                        >
                            {isFetchingNextPage ? t("loading") : t("loadMore")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
