import { db } from "@/db";
import { AddWordSchema } from "../../schemas/admin";
import { words } from "@/db/schema/words";
import { languages } from "@/db/schema/languages";
import { eq } from "drizzle-orm";
import { roots } from "@/db/schema/roots";
import { wordsAttributes } from "@/db/schema/word_attributes";
import z from "zod"
import { meanings } from "@/db/schema/meanings";
import { examples } from "@/db/schema/examples";
import { meaningsAttributes } from "@/db/schema/meaning_attributes";
type dbType = typeof db
type wordDataType = z.infer<typeof AddWordSchema>;

export async function addWordWithTransaction(db: dbType, data: wordDataType) {
    const { meanings: meaningData, ...wordData } = data;

    return await db.transaction(async (trx) => {
        // Insert the word
        const [addedWord] = await trx.insert(words).values(wordData).returning();

        // Handle root and language
        if (wordData.language && wordData.root) {
            const [languageResult] = await trx
                .select({ id: languages.id })
                .from(languages)
                .where(eq(languages.language_code, wordData.language));

            if (languageResult?.id) {
                await trx.insert(roots).values({
                    root: wordData.root,
                    languageId: languageResult.id,
                    wordId: addedWord.id,
                });
            }
        }

        // Insert word attributes
        if (wordData.attributes && wordData.attributes.length > 0) {
            await trx.insert(wordsAttributes).values(
                wordData.attributes.map((attributeId) => ({
                    attributeId,
                    wordId: addedWord.id,
                }))
            );
        }

        // Insert meanings and their related data
        const addedMeanings = await Promise.all(
            meaningData.map(async (meaning) => {
                // Insert the meaning
                const [addedMeaning] = await trx
                    .insert(meanings)
                    .values({
                        meaning: meaning.meaning,
                        partOfSpeechId: meaning.partOfSpeechId,
                        wordId: addedWord.id,
                        imageUrl: meaning.imageUrl,
                    })
                    .returning();

                // Insert example sentence if provided
                if (meaning.example) {
                    await trx.insert(examples).values({
                        sentence: meaning.example.sentence,
                        authorId: meaning.example.author || null,
                        meaningId: addedMeaning.id,
                    });
                }

                // Insert meaning attributes
                if (meaning.attributes && meaning.attributes.length > 0) {
                    await trx.insert(meaningsAttributes).values(
                        meaning.attributes.map((attributeId) => ({
                            attributeId,
                            meaningId: addedMeaning.id,
                        }))
                    );
                }

                return addedMeaning;
            })
        );

        // Return the added word and its meanings
        return {
            word: addedWord,
            meanings: addedMeanings,
        };
    });
}