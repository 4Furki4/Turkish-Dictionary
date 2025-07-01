import { api } from "@/src/trpc/server";
import { HydrateClient } from "@/src/trpc/server";
import { PronunciationVotingPage } from "@/src/_pages/requests/pronunciation-voting-page";

export default async function Pronunciations() {
  await api.request.getVotablePronunciationRequests.prefetch({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  return (
    <HydrateClient>
      <PronunciationVotingPage />
    </HydrateClient>
  );
}
