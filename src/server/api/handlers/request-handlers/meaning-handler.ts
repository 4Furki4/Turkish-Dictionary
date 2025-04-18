import { eq } from "drizzle-orm";
import { RequestHandler, RequestHandlerContext } from "./types";
import { requests } from "@/db/schema/requests";
import { meanings } from "@/db/schema/meanings";
import { meaningAttributes, meaningsAttributes } from "@/db/schema/meaning_attributes";
import { examples } from "@/db/schema/examples";
import { TRPCError } from "@trpc/server";

export class UpdateMeaningHandler implements RequestHandler<void> {
    async handle({ tx, request }: RequestHandlerContext) {
        const requestableId = request.entityId;
        if (!requestableId) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "entityId is required"
            });
        }
        const newData = request.newData as {
            meaning?: string;
            part_of_speech_id?: number;
            sentence?: string;
            attributes?: number[];
            author_id?: number;
        };
        const { meaning, part_of_speech_id, sentence, attributes, author_id } = newData;

        if (meaning) {
            await tx.update(meanings)
                .set({ meaning })
                .where(eq(meanings.id, requestableId));
        }
        if (part_of_speech_id) {
            await tx.update(meanings)
                .set({ partOfSpeechId: part_of_speech_id })
                .where(eq(meanings.id, requestableId));
        }

        if (attributes) {
            const existingAttributes = attributes.filter(attr => attr >= 0);
            const pendingAttributes = attributes.filter(attr => attr < 0);
            let newAttributeIds: number[] = [...existingAttributes];

            if (pendingAttributes.length > 0) {
                for (const attr of pendingAttributes) {
                    const requestId = Math.abs(attr);
                    const requestedRows = await tx.select().from(requests).where(eq(requests.id, requestId));
                    if (!requestedRows.length) {
                        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Requested attribute not found" });
                    }
                    const attributeData = requestedRows[0].newData as { attribute: string };
                    const [inserted] = await tx.insert(meaningAttributes)
                        .values({ attribute: attributeData.attribute })
                        .returning({ id: meaningAttributes.id });
                    newAttributeIds.push(inserted.id);
                }
            }
            for (const attrId of newAttributeIds) {
                await tx.insert(meaningsAttributes)
                    .values({ meaningId: requestableId, attributeId: attrId });
            }
        }

        if (sentence) {
            await tx.update(examples)
                .set({ sentence })
                .where(eq(examples.meaningId, requestableId));
        }
        if (author_id) {
            await tx.update(examples)
                .set({ authorId: author_id })
                .where(eq(examples.meaningId, requestableId));
        }
    }
}

export class DeleteMeaningHandler implements RequestHandler<void> {
    async handle({ tx, request }: RequestHandlerContext) {
        const requestableId = request.entityId;
        if (!requestableId) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "entityId is required"
            });
        }
        await tx.delete(meanings).where(eq(meanings.id, requestableId));
    }
}
