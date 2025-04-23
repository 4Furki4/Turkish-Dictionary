import 'dotenv/config';
import fetch from 'node-fetch';
import { eq } from 'drizzle-orm';
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
            const detail = details.find((d: any) => d.madde === word) || details[0];

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
                const existingWord = await tx.select().from(words).where(eq(words.name, detail.madde));
                if (existingWord.length) {
                    wordId = existingWord[0].id;
                    await tx.update(words)
                        .set({ phonetic: detail.telaffuz || null, prefix: prefixVal, suffix: suffixVal, updated_at: new Date().toISOString() })
                        .where(eq(words.id, wordId));
                } else {
                    const [{ id }] = await tx.insert(words)
                        .values({ name: detail.madde, phonetic: detail.telaffuz || null, prefix: prefixVal, suffix: suffixVal, updated_at: new Date().toISOString() })
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

                // roots (multiple language-root segments)
                if (detail.lisan) {
                    const segments: string[] = String(detail.lisan).split('+').map((s: string) => s.trim());
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
                    const [{ id: meaningId }] = await tx
                        .insert(meanings)
                        .values({
                            meaning: String(anlam.anlam).replace(/►/g, '').trim(),
                            wordId,
                            partOfSpeechId: posId,
                            order: parseInt(anlam.anlam_sira || '0', 10)
                        })
                        .onConflictDoNothing()
                        .returning({ id: meanings.id });

                    // examples
                    for (const ornek of anlam.orneklerListe || []) {
                        const sentence = ornek.ornek || ornek.sentence;
                        const authorName = ornek.yazar?.[0]?.tam_adi || 'unknown';
                        const authorId = await getOrCreateAuthor(tx, authorName);
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

                // related phrases
                for (const phrase of detail.atasozu || []) {
                    const related = phrase.madde;
                    const rows = await tx.select().from(words).where(eq(words.name, related));
                    if (rows.length) {
                        await tx.insert(relatedPhrases)
                            .values({ wordId, relatedPhraseId: rows[0].id })
                            .onConflictDoNothing();
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