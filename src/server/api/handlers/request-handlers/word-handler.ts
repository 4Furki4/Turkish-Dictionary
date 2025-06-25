import { eq } from "drizzle-orm";
import { RequestHandler, RequestHandlerContext } from "./types";
import { requests } from "@/db/schema/requests";
import { db } from "@/db";
import { TRPCError } from "@trpc/server";
import { wordAttributes, wordsAttributes } from "@/db/schema/word_attributes";
import { words } from "@/db/schema/words";
import { languages } from "@/db/schema/languages";
import { roots } from "@/db/schema/roots";
import { meanings } from "@/db/schema/meanings";
import { examples } from "@/db/schema/examples";
import { meaningsAttributes } from "@/db/schema/meaning_attributes";
import { relatedWords } from "@/db/schema/related_words";
import { relatedPhrases } from "@/db/schema/related_phrases";

interface WordCreationData {
    name: string;
    language?: string;
    phonetic?: string;
    root?: string;
    prefix?: string;
    suffix?: string;
    attributes?: number[];
    meanings: Array<{
        meaning: string;
        partOfSpeechId?: number | null;
        attributes: number[];
        example?: {
            sentence: string;
            author?: number | null;
        };
        imageUrl?: string;
    }>;
    relatedWords?: Array<{
        relatedWordId: number;
        relationType: string;
    }>;
    relatedPhrases?: Array<{
        relatedWordId: number;
        relationType: string;
    }>;
}

export class CreateWordHandler implements RequestHandler<void> {
    async handle(context: RequestHandlerContext): Promise<void> {
        const { tx, request } = context;
        
        if (!request.newData) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Request data is missing for word creation."
            });
        }

        const wordData = request.newData as WordCreationData;
        
        // Create the word
        const [createdWord] = await tx.insert(words).values({
            name: wordData.name,
            phonetic: wordData.phonetic,
            prefix: wordData.prefix,
            suffix: wordData.suffix,
        }).returning({ id: words.id });

        if (!createdWord) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create word"
            });
        }

        const wordId = createdWord.id;

        // Create root if language and root are provided
        if (wordData.language && wordData.root) {
            const [language] = await db.select({ id: languages.id })
                .from(languages)
                .where(eq(languages.language_code, wordData.language));
            
            if (language) {
                await tx.insert(roots).values({
                    wordId: wordId,
                    languageId: language.id,
                    root: wordData.root
                });
            }
        }

        // Create word attributes relationships
        if (wordData.attributes && wordData.attributes.length > 0) {
            for (const attributeId of wordData.attributes) {
                await tx.insert(wordsAttributes).values({
                    wordId: wordId,
                    attributeId: attributeId
                });
            }
        }

        // Create meanings
        if (wordData.meanings && wordData.meanings.length > 0) {
            for (const meaningData of wordData.meanings) {
                const [createdMeaning] = await tx.insert(meanings).values({
                    wordId: wordId,
                    meaning: meaningData.meaning,
                    partOfSpeechId: meaningData.partOfSpeechId,
                    imageUrl: meaningData.imageUrl
                }).returning({ id: meanings.id });

                if (createdMeaning) {
                    // Create meaning attributes
                    if (meaningData.attributes && meaningData.attributes.length > 0) {
                        for (const attributeId of meaningData.attributes) {
                            await tx.insert(meaningsAttributes).values({
                                meaningId: createdMeaning.id,
                                attributeId: attributeId
                            });
                        }
                    }

                    // Create example if provided
                    if (meaningData.example?.sentence) {
                        await tx.insert(examples).values({
                            meaningId: createdMeaning.id,
                            sentence: meaningData.example.sentence,
                            authorId: meaningData.example.author
                        });
                    }
                }
            }
        }

        // Create related words relationships
        if (wordData.relatedWords && wordData.relatedWords.length > 0) {
            for (const relatedWord of wordData.relatedWords) {
                await tx.insert(relatedWords).values({
                    wordId: wordId,
                    relatedWordId: relatedWord.relatedWordId,
                    relationType: relatedWord.relationType,
                    userId: request.userId
                });
            }
        }

        // Create related phrases relationships
        if (wordData.relatedPhrases && wordData.relatedPhrases.length > 0) {
            for (const relatedPhrase of wordData.relatedPhrases) {
                await tx.insert(relatedPhrases).values({
                    wordId: wordId,
                    relatedPhraseId: relatedPhrase.relatedWordId
                });
            }
        }
    }
}

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