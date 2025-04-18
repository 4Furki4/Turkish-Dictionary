import { eq } from "drizzle-orm";
import { RequestHandler, RequestHandlerContext } from "./types";
import { requests } from "@/db/schema/requests";
import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { wordAttributes, wordsAttributes } from "@/db/schema/word_attributes";
import { words } from "@/db/schema/words";
import { languages } from "@/db/schema/languages";
import { roots } from "@/db/schema/roots";

export class UpdateWordHandler implements RequestHandler<void> {
    async handle(context: RequestHandlerContext) {
        // Update the word
        // check if the attributes array includes requested attribute with negative id
        const { tx, request } = context;
        const requestableId = request.entityId;
        if (!requestableId) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "entityId is required"
            })
        }
        const newData = request.newData as {
            reason: string;
            phonetic?: string | undefined;
            prefix?: string | undefined;
            suffix?: string | undefined;
            root?: string | undefined;
            wordName?: string | undefined;
            language?: string | undefined;
            attributes?: string[] | undefined;
        }
        const attributes = newData.attributes;
        const existingAttributes = attributes?.filter(attr => Number(attr) >= 0)
        const pendingAttributes = attributes?.filter(attr => Number(attr) < 0)
        let newAttributeIds: number[] = existingAttributes?.map(attr => Number(attr)) || []
        if (pendingAttributes && pendingAttributes?.length > 0) {
            pendingAttributes.forEach(async (attr) => {
                const attributeId = Number(attr)
                const requestedAttribute = await db.query.requests.findFirst({
                    where: eq(requests.id, attributeId)
                })
                if (!requestedAttribute) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "An error occurred while updating the word and its attributes. Please try again. If the error persists, please contact the admins or developers."
                    })
                }
                const attributeData = requestedAttribute.newData as { attribute: string }
                const [insertedAttributeId] = await tx.insert(wordAttributes).values({
                    attribute: attributeData.attribute
                }).returning({
                    id: wordAttributes.id
                })

                newAttributeIds.push(insertedAttributeId.id)
            })
        }
        newAttributeIds.forEach(async (attr) => {
            // Check that requestableId is not null before inserting
            if (requestableId !== null && requestableId !== undefined) {
                await tx.insert(wordsAttributes).values({
                    wordId: requestableId,
                    attributeId: attr
                })
            }
        })
        Object.keys(newData).forEach(async (key) => {
            switch (key) {
                case "wordName":
                    await tx.update(words).set({
                        name: newData.wordName as string
                    }).where(eq(words.id, requestableId))
                    break
                case "phonetic":
                    await tx.update(words).set({
                        phonetic: newData.phonetic as string
                    }).where(eq(words.id, requestableId))
                    break
                case "prefix":
                    await tx.update(words).set({
                        prefix: newData.prefix as string
                    }).where(eq(words.id, requestableId))
                    break
                case "suffix":
                    await tx.update(words).set({
                        suffix: newData.suffix as string
                    }).where(eq(words.id, requestableId))
                    break
            }
        })
        const newLanguageCode = newData.language as string
        if (!newLanguageCode) return

        const [{ id: languageId }] = await db.select({ id: languages.id }).from(languages).where(eq(languages.language_code, newLanguageCode))
        const [root] = await db.select({ id: roots.id }).from(roots).where(eq(roots.wordId, requestableId))
        if (!root) {
            await tx.insert(roots).values({
                wordId: requestableId,
                languageId: languageId,
                root: newData.root as string
            })
            return
        }
        await tx.update(roots).set({
            languageId: languageId,
            root: newData.root as string
        }).where(eq(roots.id, root.id))

    }
}