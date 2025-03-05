// src/server/api/handlers/request-handlers/word-attributes-handlers.ts
import { RequestHandler, RequestHandlerContext } from "./types";
import { wordAttributes } from "@/db/schema/word_attributes";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export class CreateWordAttributeHandler implements RequestHandler<void> {
    async handle({ tx, request }: RequestHandlerContext) {
        const attributeData = request.newData as { attribute: string };

        // Insert the new attribute into the word_attributes table
        await tx.insert(wordAttributes).values({
            attribute: attributeData.attribute
        });
    }
}
type UpdateWordResult = {
    id: number;
    attribute: string;
    requestType: string | null;
}
export class UpdateWordAttributeHandler implements RequestHandler<UpdateWordResult> {
    async handle({ tx, request }: RequestHandlerContext) {
        const attributeData = request.newData as { attribute: string };

        // Update the attribute
        if (!request.entityId) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "entityId is required"
            })
        }
        const [updatedAttribute] = await tx.update(wordAttributes)
            .set({
                attribute: attributeData.attribute
            })
            .where(eq(wordAttributes.id, request.entityId)).returning()
        return updatedAttribute
    }
}

// Add DeleteWordAttributeHandler if needed