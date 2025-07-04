#!/usr/bin/env bun
/**
 * @name prepare-offline-data.ts
 * @description This script fetches all word data from the database in parallel to
 * significantly speed up the process. It groups words by their first letter,
 * then fetches the full data for each group concurrently.
 *
 * @execution To run this script, use the command: `bun src/scripts/prepare-offline-data.ts`
 */

import "dotenv/config";
import { db } from "@/db";
import { words } from "@/db/schema/words";
import { encode } from "@msgpack/msgpack";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { sql } from "drizzle-orm";
import os from "os";

console.log("Starting optimized offline data preparation script...");

// Define a type for the structure returned by our SQL query.
type WordData = {
  word_data: {
    word_id: string;
    word_name: string;
    [key: string]: any;
  };
};

async function main() {
  const startTime = Date.now();
  try {
    // 1. Fetch all word IDs and names (lightweight query)
    console.log("Fetching all word identifiers...");
    const allWordIdentifiers = await db
      .select({
        id: words.id,
        name: words.name,
      })
      .from(words);
    console.log(`Found ${allWordIdentifiers.length} words.`);

    if (allWordIdentifiers.length === 0) {
      console.log("No words found in the database. Exiting.");
      return;
    }

    // 2. Group word identifiers by their starting letter
    console.log("Grouping words by starting letter...");
    const groupedWords: Record<string, { id: number; name: string }[]> = {};
    for (const word of allWordIdentifiers) {
      if (!word || !word.name) continue;
      const firstLetter = word.name.charAt(0).toLowerCase();
      if (/^[a-zçğıöşüâ.-]$/.test(firstLetter)) {
        if (!groupedWords[firstLetter]) {
          groupedWords[firstLetter] = [];
        }
        groupedWords[firstLetter].push(word);
      } else {
        if (!groupedWords["special"]) {
          groupedWords["special"] = [];
        }
        groupedWords["special"].push(word);
      }
    }
    console.log(`Words grouped into ${Object.keys(groupedWords).length} chunks.`);

    // 3. Create output directory
    const outputDir = path.join(process.cwd(), "public", "offline-data");
    await mkdir(outputDir, { recursive: true });
    console.log(`Output directory is ready at: ${outputDir}`);

    // 4. Process each group in parallel
    const concurrencyLimit = os.cpus().length; // Limit concurrency to number of CPU cores
    console.log(`Processing chunks with a concurrency limit of ${concurrencyLimit}...`);
    const allLetters = Object.keys(groupedWords);
    const fileNames: string[] = [];

    for (let i = 0; i < allLetters.length; i += concurrencyLimit) {
      const batch = allLetters.slice(i, i + concurrencyLimit);
      await Promise.all(batch.map(async (letter) => {
        const wordsInGroup = groupedWords[letter];
        if (wordsInGroup.length === 0) return; // Skip empty groups

        const wordIds = wordsInGroup.map(w => w.id);
        const fileName = `words-${letter}.msgpack`;
        fileNames.push(fileName);

        console.log(`[Processing] Group '${letter}' with ${wordsInGroup.length} words...`);

        // This is the same powerful raw SQL query, but now targeted at a small chunk of IDs
        const queryForGroup = sql`
              SELECT json_build_object(
                    'word_id', w.id, 'word_name', w.name, 'phonetic', w.phonetic, 'prefix', w.prefix, 'suffix', w.suffix,
                    'attributes', COALESCE((SELECT json_agg(json_build_object('attribute_id', wa.id, 'attribute', wa.attribute)) FROM words_attributes wattr JOIN word_attributes wa ON wattr.attribute_id = wa.id WHERE wattr.word_id = w.id), '[]'::json),
                    'root', COALESCE((SELECT json_build_object('root', r.root, 'language_en', l.language_en, 'language_tr', l.language_tr, 'language_code', l.language_code) FROM roots r JOIN languages l ON r.language_id = l.id WHERE r.word_id = w.id LIMIT 1), json_build_object('root', null, 'language_en', null, 'language_tr', null, 'language_code', null)),
                    'meanings', COALESCE((SELECT json_agg(json_build_object('meaning_id', m.id, 'meaning', m.meaning, 'imageUrl', m."imageUrl", 'part_of_speech', p.part_of_speech, 'part_of_speech_id', p.id, 'attributes', COALESCE((SELECT json_agg(json_build_object('attribute_id', ma.id, 'attribute', ma.attribute)) FROM meanings_attributes mattr JOIN meaning_attributes ma ON mattr.attribute_id = ma.id WHERE mattr.meaning_id = m.id), '[]'::json), 'sentence', e.sentence, 'author', a.name, 'author_id', a.id) ORDER BY m."order" ASC) FROM meanings m LEFT JOIN part_of_speechs p ON m.part_of_speech_id = p.id LEFT JOIN examples e ON e.meaning_id = m.id LEFT JOIN authors a ON e.author_id = a.id WHERE m.word_id = w.id), '[]'::json),
                    'relatedWords', COALESCE((SELECT json_agg(json_build_object('related_word_id', rw.id, 'related_word_name', rw.name, 'relation_type', rel.relation_type)) FROM related_words rel JOIN words rw ON rel.related_word_id = rw.id WHERE rel.word_id = w.id), '[]'::json),
                    'relatedPhrases', COALESCE((SELECT json_agg(json_build_object('related_phrase_id', rp.id, 'related_phrase', rp.name)) FROM related_phrases rel JOIN words rp ON rel.related_phrase_id = rp.id WHERE rel.phrase_id = w.id), '[]'::json)
                ) AS word_data
              FROM words w
              WHERE w.id IN (${sql.join(wordIds, sql`, `)})
            `;

        const result = (await db.execute(queryForGroup)) as WordData[];
        const fullWordData = result.map((row) => row.word_data);

        const encodedData = encode(fullWordData);
        const filePath = path.join(outputDir, fileName);
        await writeFile(filePath, encodedData);
        console.log(`[Done] Group '${letter}' written to ${fileName}`);
      }));
    }

    // 5. Generate and write metadata file
    const metadata = {
      version: Date.now(),
      files: fileNames.sort(),
    };

    const metadataPath = path.join(outputDir, "metadata.json");
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Successfully wrote metadata.json with version ${metadata.version}`);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`\n✅ Offline data preparation complete in ${duration.toFixed(2)} seconds!`);

  } catch (error) {
    console.error("\n❌ An error occurred during data preparation:");
    console.error(error);
    process.exit(1);
  }
}

main().finally(() => {
  process.exit(0);
});
