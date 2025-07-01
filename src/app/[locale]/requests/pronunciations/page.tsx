import { api } from "@/src/trpc/server";
import { HydrateClient } from "@/src/trpc/server";
import { PronunciationVotingPage } from "@/src/_pages/requests/pronunciation-voting-page";


export default async function Page() {
    await api.request.getVotablePronunciationRequests.prefetch({});

    return (
        <HydrateClient>
            <PronunciationVotingPage />
        </HydrateClient>
    );
}
