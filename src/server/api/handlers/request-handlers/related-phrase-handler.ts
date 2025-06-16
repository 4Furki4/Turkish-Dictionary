import { and, eq } from "drizzle-orm";
import { relatedPhrases } from "@/db/schema/related_phrases";
import { RequestHandler, RequestHandlerContext } from "./types";
import { TRPCError } from "@trpc/server";

interface RelatedPhraseData {
    relatedPhraseId?: number;
}

export class DeleteRelatedPhraseHandler implements RequestHandler<void> {
    async handle(context: RequestHandlerContext): Promise<void> {
        const { tx, request } = context;
        const { entityId: wordId, newData } = request;

        if (wordId === null || wordId === undefined) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Word ID (entityId) is missing in the request for related phrase deletion.",
            });
        }

        const parsedNewData = newData as Pick<RelatedPhraseData, 'relatedPhraseId'>;
        const { relatedPhraseId } = parsedNewData;

        if (relatedPhraseId === undefined) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Missing relatedPhraseId in newData for related phrase deletion.",
            });
        }

        await tx
            .delete(relatedPhrases)
            .where(
                and(
                    eq(relatedPhrases.wordId, wordId),
                    eq(relatedPhrases.relatedPhraseId, relatedPhraseId)
                )
            );
    }
}
