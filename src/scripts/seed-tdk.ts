import 'dotenv/config';
import fetch from 'node-fetch';
import { eq, and, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { languages } from '@/db/schema/languages';
import { roots } from '@/db/schema/roots';
import { authors } from '@/db/schema/authors';
import { partOfSpeechs } from '@/db/schema/part_of_speechs';
import { words } from '@/db/schema/words';
import { meanings } from '@/db/schema/meanings';
import { examples } from '@/db/schema/examples';
import { relatedPhrases } from '@/db/schema/related_phrases';
import { relatedWords } from '@/db/schema/related_words';
import { meaningAttributes, meaningsAttributes } from '@/db/schema/meaning_attributes';
import { wordAttributes, wordsAttributes } from '@/db/schema/word_attributes';
import pMap from 'p-map'
const AUTOCOMPLETE_URL = 'https://sozluk.gov.tr/autocomplete.json';
const SAPKA_URL = 'https://sozluk.gov.tr/assets/js/autocompleteSapka.json';
const DETAIL_URL = (word: string) => `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function getOrCreateLanguage(tx: any, code: string): Promise<number> {
    const existing = await tx.select().from(languages).where(eq(languages.language_tr, code));
    if (existing.length) return existing[0].id;
    const newCode = code.slice(0, 2).toLowerCase();
    const [{ id }] = await tx
        .insert(languages)
        .values({ language_tr: code, language_code: newCode, language_en: code })
        .returning({ id: languages.id });
    return id;
}

async function getOrCreatePartOfSpeech(tx: any, fullName: string): Promise<number> {
    const existing = await tx.select().from(partOfSpeechs).where(eq(partOfSpeechs.partOfSpeech, fullName));
    if (existing.length) return existing[0].id;
    const [{ id }] = await tx
        .insert(partOfSpeechs)
        .values({ partOfSpeech: fullName })
        .returning({ id: partOfSpeechs.id });
    return id;
}

async function getOrCreateAuthor(tx: any, name: string): Promise<number> {
    const existing = await tx.select().from(authors).where(eq(authors.name, name));
    if (existing.length) return existing[0].id;
    const [{ id }] = await tx
        .insert(authors)
        .values({ name })
        .returning({ id: authors.id });
    return id;
}

// helper for meaning attributes
async function getOrCreateMeaningAttribute(tx: any, attribute: string): Promise<number> {
    const existing = await tx.select({ id: meaningAttributes.id })
        .from(meaningAttributes)
        .where(eq(meaningAttributes.attribute, attribute));
    if (existing.length) return existing[0].id;
    const [{ id }] = await tx.insert(meaningAttributes)
        .values({ attribute })
        .returning({ id: meaningAttributes.id });
    return id;
}

// helper for word attributes
async function getOrCreateWordAttribute(tx: any, attribute: string): Promise<number> {
    const existing = await tx.select({ id: wordAttributes.id })
        .from(wordAttributes)
        .where(eq(wordAttributes.attribute, attribute));
    if (existing.length) return existing[0].id;
    const [{ id }] = await tx.insert(wordAttributes)
        .values({ attribute })
        .returning({ id: wordAttributes.id });
    return id;
}

async function seedDatabase() {
    const startTime = Date.now();
    console.log('Fetching word lists...');
    const [autoRes, sapkaRes] = await Promise.all([
        fetch(AUTOCOMPLETE_URL),
        fetch(SAPKA_URL)
    ]);
    const autoList = (await autoRes.json()) as { madde: string }[];
    const sapkaList = (await sapkaRes.json()) as Record<string, string>[];

    const sapkaMap = new Map<string, string>();
    sapkaList.forEach(obj => {
        const [key, val] = Object.entries(obj)[0];
        sapkaMap.set(key, val);
    });
    const nonHatted = new Set(sapkaMap.keys());

    const finalSet = new Set<string>();
    autoList.forEach(item => {
        const w = item.madde;
        if (!nonHatted.has(w)) finalSet.add(w);
    });
    sapkaMap.forEach(h => finalSet.add(h));
    const wordsToProcess = Array.from(finalSet);
    console.log(`Total unique words: ${wordsToProcess.length}`);

    // process words in parallel with concurrency limit
    await pMap(wordsToProcess, async (word, i) => {
        console.log(`[${i + 1}/${wordsToProcess.length}] Processing: "${word}"`);
        // Skip if already fully ingested
        const existingWord = await db.select({ id: words.id })
            .from(words)
            .where(eq(words.name, word));
        if (existingWord.length) {
            const existingMeanings = await db.select()
                .from(meanings)
                .where(eq(meanings.wordId, existingWord[0].id));
            if (existingMeanings.length) {
                console.log(`Skipping "${word}", already seeded.`);
                return;
            }
        }
        try {
            const res = await fetch(DETAIL_URL(word));
            if (!res.ok) {
                console.warn(`Skipping "${word}": HTTP ${res.status}`);
                return;
            }
            const details = await res.json();
            if (!Array.isArray(details) || !details.length) return;
            // Process all variants of the word
            for (const detail of details) {
                if (detail.madde !== word) continue; // Skip if not matching our search word

                await db.transaction(async tx => {
                    // parse lisan
                    let rootText = '';
                    if (detail.lisan) {
                        const parts = detail.lisan.split(' ');
                        rootText = parts.slice(1).join(' ');
                    }

                    // words upsert (prefix/suffix)
                    let wordId: number;
                    const prefixVal = detail.on_taki || null;
                    const suffixVal = detail.taki || null;
                    // Get variant number from kac field (defaults to 0 if not present)
                    const variantNum = detail.kac ? parseInt(String(detail.kac), 10) : 0;

                    // Check if this exact variant already exists
                    const existingWord = await tx.select()
                        .from(words)
                        .where(
                            and(
                                eq(words.name, detail.madde),
                                eq(words.variant, variantNum)
                            )
                        );
                    if (existingWord.length) {
                        wordId = existingWord[0].id;
                        await tx.update(words)
                            .set({
                                phonetic: detail.telaffuz || null,
                                prefix: prefixVal,
                                suffix: suffixVal,
                                variant: variantNum,
                                updated_at: new Date().toISOString()
                            })
                            .where(eq(words.id, wordId));
                    } else {
                        const [{ id }] = await tx.insert(words)
                            .values({
                                name: detail.madde,
                                phonetic: detail.telaffuz || null,
                                prefix: prefixVal,
                                suffix: suffixVal,
                                variant: variantNum,
                                updated_at: new Date().toISOString()
                            })
                            .returning({ id: words.id });
                        wordId = id;
                    }

                    // word attributes
                    const wordAttrs: string[] = [];
                    if (detail.cogul_mu === '1') wordAttrs.push('çoğul');
                    if (detail.ozel_mi === '1') wordAttrs.push('özel');
                    if (detail.egik_mi === '1') wordAttrs.push('eğik');
                    for (const name of wordAttrs) {
                        const attrId = await getOrCreateWordAttribute(tx, name);
                        await tx.insert(wordsAttributes)
                            .values({ wordId, attributeId: attrId })
                            .onConflictDoNothing();
                    }

                    // Process roots (handle both single and multiple language-root segments)
                    if (detail.lisan) {
                        // First, check if it contains multiple segments (separated by +)
                        const lisanStr = String(detail.lisan);
                        if (lisanStr.includes('+')) {
                            // Handle multiple language-root segments
                            const segments: string[] = lisanStr.split('+').map((s: string) => s.trim());
                            for (const seg of segments) {
                                const parts = seg.split(' ');
                                const codeSeg = parts[0].replace(/\.$/, '');
                                const rootSeg = parts.slice(1).join(' ');
                                const langIdSeg = codeSeg ? await getOrCreateLanguage(tx, codeSeg) : undefined;
                                if (rootSeg && langIdSeg) {
                                    await tx.insert(roots)
                                        .values({ root: rootSeg, languageId: langIdSeg, wordId })
                                        .onConflictDoNothing();
                                }
                            }
                        } else {
                            // Handle single language-root pair
                            const parts = lisanStr.split(' ');
                            const code = parts[0].replace(/\.$/, '');
                            const rootText = parts.slice(1).join(' ');
                            const langId = code ? await getOrCreateLanguage(tx, code) : undefined;
                            if (rootText && langId) {
                                await tx.insert(roots)
                                    .values({ root: rootText, languageId: langId, wordId })
                                    .onConflictDoNothing();
                            }
                        }
                    }

                    // meanings & examples & attributes
                    for (const anlam of detail.anlamlarListe || []) {
                        // determine part of speech: fiil or one from ozelliklerListe if valid
                        const validPOS = ['isim', 'fiil', 'sıfat', 'zarf', 'zamir', 'edat', 'bağlaç'];
                        let partName: string | undefined;
                        if (String(anlam.fiil) === '1') {
                            partName = 'fiil';
                        } else {
                            const posFromOz = (anlam.ozelliklerListe || []).find((o: any) =>
                                validPOS.includes(String(o.tam_adi).toLowerCase())
                            );
                            partName = posFromOz ? posFromOz.tam_adi : undefined;
                        }
                        const posId = partName ? await getOrCreatePartOfSpeech(tx, partName) : undefined;
                        // Check if meaning contains navigation patterns (► or 343)
                        const meaningText = String(anlam.anlam);

                        // Check for ► navigation
                        const arrowMatch = meaningText.match(/►\s*([^\s]+.*?)(?:\s*$|\.|,)/i);

                        // Check for 343 navigation ("bakınız" - see also)
                        const seeAlsoMatch = meaningText.match(/343\s+([^\s]+.*?)(?:\s*$|\.|,)/i);

                        let meaningId: number;
                        if (arrowMatch || seeAlsoMatch) {
                            // Extract the related word and determine relation type
                            let relatedWordText: string;
                            let relationType: string;

                            if (arrowMatch) {
                                relatedWordText = arrowMatch[1].trim();
                                // If lisan is empty, it's likely an obsolete word pointing to current usage
                                // Otherwise, it's likely a foreign word pointing to Turkish equivalent
                                relationType = !detail.lisan ? 'obsolete' : 'turkish_equivalent';
                            } else if (seeAlsoMatch && seeAlsoMatch[1]) {
                                relatedWordText = seeAlsoMatch[1].trim();
                                relationType = 'see_also';
                            } else {
                                // Fallback in case neither match has valid capture groups
                                relatedWordText = word;
                                relationType = 'see_also';
                            }
                            // Related word and type already determined above

                            // Check if related word exists
                            let relatedWordId: number;
                            const existingRelated = await tx.select().from(words).where(eq(words.name, relatedWordText));

                            if (existingRelated.length) {
                                relatedWordId = existingRelated[0].id;
                            } else {
                                // Create the related word
                                const [{ id }] = await tx.insert(words)
                                    .values({
                                        name: relatedWordText,
                                        updated_at: new Date().toISOString()
                                    })
                                    .returning({ id: words.id });
                                relatedWordId = id;
                            }

                            // Check if relationship already exists before creating it
                            const existingRelation = await tx.select()
                                .from(relatedWords)
                                .where(
                                    and(
                                        eq(relatedWords.wordId, wordId),
                                        eq(relatedWords.relatedWordId, relatedWordId)
                                    )
                                );

                            if (existingRelation.length === 0) {
                                // Create relationship only if it doesn't exist
                                await tx.insert(relatedWords)
                                    .values({
                                        wordId,
                                        relatedWordId,
                                        relationType,
                                        updatedAt: new Date().toISOString()
                                    });
                            } else {
                                // Optionally update the relation type if needed
                                await tx.update(relatedWords)
                                    .set({
                                        relationType,
                                        updatedAt: new Date().toISOString()
                                    })
                                    .where(
                                        and(
                                            eq(relatedWords.wordId, wordId),
                                            eq(relatedWords.relatedWordId, relatedWordId)
                                        )
                                    );
                            }

                            // For words that are just navigation pointers, we don't create a meaning
                            // The frontend will handle these by checking if they have related words
                            // but no meanings

                            // Check if this is the only meaning for this word and if it's entirely a navigation
                            const isOnlyMeaning = detail.anlamlarListe?.length === 1;
                            const isEntirelyNavigation = (
                                (arrowMatch && arrowMatch[0] === meaningText.trim()) ||
                                (seeAlsoMatch && seeAlsoMatch[0] === meaningText.trim())
                            );

                            // If this is the only meaning and it's entirely navigation, skip creating a meaning
                            if (isOnlyMeaning && isEntirelyNavigation) {
                                // Skip creating meaning - we'll just have the relation
                                console.log(`Skipping meaning for "${detail.madde}", just a navigation pointer to "${relatedWordText}"`);
                                meaningId = 0; // Dummy value, not used for examples since we'll skip that too
                            } else {
                                // Clean the meaning text by removing navigation patterns
                                let cleanMeaning = meaningText;
                                if (arrowMatch) {
                                    cleanMeaning = cleanMeaning.replace(/►\s*[^\s]+.*?(?:\s*$|\.|,)/i, '').trim();
                                }
                                if (seeAlsoMatch && seeAlsoMatch[0]) {
                                    cleanMeaning = cleanMeaning.replace(/343\s+[^\s]+.*?(?:\s*$|\.|,)/i, '').trim();
                                }

                                // If after cleaning there's no meaningful content, use a placeholder
                                if (!cleanMeaning) {
                                    cleanMeaning = `Bakınız: ${relatedWordText}`;
                                }

                                const result = await tx
                                    .insert(meanings)
                                    .values({
                                        meaning: cleanMeaning,
                                        wordId,
                                        partOfSpeechId: posId,
                                        order: parseInt(anlam.anlam_sira || '0', 10)
                                    })
                                    .onConflictDoNothing()
                                    .returning({ id: meanings.id });
                                meaningId = result[0].id;
                            }
                        } else {
                            // Regular meaning without navigation
                            const result = await tx
                                .insert(meanings)
                                .values({
                                    meaning: meaningText,
                                    wordId,
                                    partOfSpeechId: posId,
                                    order: parseInt(anlam.anlam_sira || '0', 10)
                                })
                                .onConflictDoNothing()
                                .returning({ id: meanings.id });
                            meaningId = result[0].id;
                        }

                        // examples (skip if we skipped creating a meaning)
                        if (meaningId === 0) continue;

                        for (const ornek of anlam.orneklerListe || []) {
                            const sentence = ornek.ornek || ornek.sentence;

                            // Skip examples without sentences (required field)
                            if (!sentence) continue;

                            // Handle examples without authors (keep authorId as null)
                            let authorId = null;
                            if (ornek.yazar && ornek.yazar[0] && ornek.yazar[0].tam_adi) {
                                const authorName = ornek.yazar[0].tam_adi;
                                authorId = await getOrCreateAuthor(tx, authorName);
                            }

                            await tx
                                .insert(examples)
                                .values({ sentence, authorId, meaningId })
                                .onConflictDoNothing();
                        }

                        // meaning attributes (exclude part-of-speech values)
                        for (const oz of anlam.ozelliklerListe || []) {
                            const name = oz.tam_adi;
                            if (!name) continue;
                            const lower = String(name).toLowerCase();
                            if (validPOS.includes(lower)) continue;
                            const attrId = await getOrCreateMeaningAttribute(tx, name);
                            await tx
                                .insert(meaningsAttributes)
                                .values({ meaningId, attributeId: attrId })
                                .onConflictDoNothing();
                        }
                    }

                    // Process all related phrases at once to avoid duplicates
                    const phrases = detail.atasozu || [];
                    if (phrases.length > 0) {
                        // Collect all phrase texts
                        const phraseTexts = phrases.map((phrase: Record<string, any>) => phrase.madde);
                        
                        // Get existing words that match these phrases (case-insensitive)
                        // First get all words with these names
                        const lowerPhraseTexts = phraseTexts.map((p: string) => p.toLowerCase());
                        const existingPhraseWords = await tx.select()
                            .from(words)
                            .where(
                                or(
                                    ...lowerPhraseTexts.map((text: string) => 
                                        sql`LOWER(${words.name}) = ${text}`
                                    )
                                )
                            );
                        
                        // Create a lookup map for faster access
                        const existingPhrasesMap = new Map<string, number>();
                        existingPhraseWords.forEach(word => {
                            existingPhrasesMap.set(word.name.toLowerCase(), word.id);
                        });
                        
                        // Process each phrase
                        for (const phrase of phrases) {
                            const related = phrase.madde as string;
                            let relatedPhraseId: number;
                            
                            // Check if this phrase already exists (case-insensitive)
                            const existingId = existingPhrasesMap.get(related.toLowerCase());
                            
                            if (existingId) {
                                // Use existing word
                                relatedPhraseId = existingId;
                                console.log(`Using existing phrase: "${related}" (ID: ${relatedPhraseId})`);
                            } else {
                                // Create new word
                                const [{ id }] = await tx.insert(words)
                                    .values({
                                        name: related,
                                        updated_at: new Date().toISOString()
                                    })
                                    .returning({ id: words.id });
                                relatedPhraseId = id;
                                
                                // Add to our map to prevent duplicates in subsequent iterations
                                existingPhrasesMap.set(related.toLowerCase(), id);
                                console.log(`Created new phrase: "${related}" (ID: ${relatedPhraseId})`);
                            }

                            // Check if relationship already exists
                            const existingRelation = await tx.select()
                                .from(relatedPhrases)
                                .where(
                                    and(
                                        eq(relatedPhrases.wordId, wordId),
                                        eq(relatedPhrases.relatedPhraseId, relatedPhraseId)
                                    )
                                );

                            if (existingRelation.length === 0) {
                                // Create the relationship
                                await tx.insert(relatedPhrases)
                                    .values({
                                        wordId,
                                        relatedPhraseId
                                    });
                            }
                        }
                    }

                    // birlesikler (compound words)
                    const compounds: string[] = Array.isArray(detail.birlesikler)
                        ? (detail.birlesikler as any[]).map((comp: any) => comp.madde || String(comp))
                        : String(detail.birlesikler || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                    for (const related of compounds) {
                        // ensure compound word exists
                        const existComp = await tx.select().from(words).where(eq(words.name, related));
                        let compId: number;
                        if (existComp.length) {
                            compId = existComp[0].id;
                        } else {
                            const [{ id }] = await tx.insert(words)
                                .values({ name: related, phonetic: null, prefix: null, suffix: null, updated_at: new Date().toISOString() })
                                .returning({ id: words.id });
                            compId = id;
                        }
                        await tx.insert(relatedWords)
                            .values({ wordId, relatedWordId: compId })
                            .onConflictDoNothing();
                    }
                });
            }
        } catch (err) {
            console.error(`Error "${word}":`, err);
        }
        const elapsedMs = Date.now() - startTime;
        console.log(`Uptime: ${(elapsedMs / 1000).toFixed(1)}s`);
        await sleep(100);
    }, { concurrency: 10 });
}

async function main() {
    try {
        console.log('Seeding TDK data...');
        await seedDatabase();
        console.log('Seeding complete.');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();