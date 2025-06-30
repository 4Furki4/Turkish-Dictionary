"use client";

import { api } from "@/src/trpc/react";
import { useTranslations } from "next-intl";
import { CardBody, CardHeader, Button } from "@heroui/react";
import CustomCard from "@/src/components/customs/heroui/custom-card";

export default function PronunciationVotingPage() {
    const t = useTranslations("pronunciation");
    const { data: requests, isLoading } = api.request.getVotablePronunciationRequests.useQuery();
    const voteMutation = api.vote.toggleVote.useMutation();

    const handleVote = (requestId: number) => {
        voteMutation.mutate({ requestId });
    };

    if (isLoading) {
        return <div>{t("loading")}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests?.map(({ request, user, word, vote_count }) => (
                    <CustomCard key={request.id}>
                        <CardHeader>
                            <div className="flex flex-col">
                                <p className="text-md">{t("word")}: {word?.name}</p>
                                <p className="text-small text-default-500">{t("submittedBy")}: {user?.name}</p>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <audio controls src={(request.newData as { audio_url: string }).audio_url} className="w-full" />
                            <div className="flex justify-between items-center mt-4">
                                <span>{t("votes", { count: vote_count })}</span>
                                <Button
                                    size="sm"
                                    onClick={() => handleVote(request.id)}
                                    isLoading={voteMutation.isPending && voteMutation.variables?.requestId === request.id}
                                >
                                    {t("vote")}
                                </Button>
                            </div>
                        </CardBody>
                    </CustomCard>
                ))}
            </div>
        </div>
    );
}
