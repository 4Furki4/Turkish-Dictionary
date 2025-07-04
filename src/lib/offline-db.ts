import { openDB, DBSchema, IDBPDatabase } from "idb";
import { decode } from "@msgpack/msgpack";
import { WordSearchResult } from "@/types";

const DB_NAME = "turkish-dictionary-offline";
// Increment the database version to trigger a schema upgrade.
const DB_VERSION = 2;
const WORDS_STORE = "words";
const METADATA_STORE = "metadata";
const WORD_NAME_INDEX = "word_name_index";

// Define the structure of your Word data
// This should match the structure from your `prepare-offline-data.ts` script
export type WordData = WordSearchResult["word_data"];
// Define the database schema using the DBSchema interface from 'idb'
interface OfflineDB extends DBSchema {
    [WORDS_STORE]: {
        key: number; // The key is now the word_id (number)
        value: WordData;
        indexes: { [WORD_NAME_INDEX]: string }; // We have an index on word_name (string)
    };
    [METADATA_STORE]: {
        key: string;
        value: any;
    };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

// Function to initialize and open the database
const getDb = (): Promise<IDBPDatabase<OfflineDB>> => {
    if (!dbPromise) {
        dbPromise = openDB<OfflineDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`Upgrading database from version ${oldVersion} to ${newVersion}...`);

                // If the words store already exists from a previous (potentially broken) version,
                // delete it to ensure we start with a clean slate.
                if (db.objectStoreNames.contains(WORDS_STORE)) {
                    console.log(`Deleting old '${WORDS_STORE}' object store.`);
                    db.deleteObjectStore(WORDS_STORE);
                }

                // Create the new, correct object store and its index.
                console.log(`Creating new '${WORDS_STORE}' object store with index.`);
                const store = db.createObjectStore(WORDS_STORE, { keyPath: "word_id" });
                store.createIndex(WORD_NAME_INDEX, "word_name", { unique: false });

                // Do the same for the metadata store to be safe.
                if (db.objectStoreNames.contains(METADATA_STORE)) {
                    db.deleteObjectStore(METADATA_STORE);
                }
                db.createObjectStore(METADATA_STORE);
            },
        });
    }
    return dbPromise;
};

// --- Database Interaction Functions ---

/**
 * Gets the currently stored version of the offline dictionary.
 * @returns The version number (timestamp) or null if not found.
 */
export const getLocalVersion = async (): Promise<number | null> => {
    const db = await getDb();
    return db.get(METADATA_STORE, "version");
};

/**
 * Updates the stored version of the offline dictionary.
 * @param version The new version number to store.
 */
export const setLocalVersion = async (version: number): Promise<void> => {
    const db = await getDb();
    await db.put(METADATA_STORE, version, "version");
};

/**
 * Clears all word data and metadata from the database.
 */
export const clearOfflineData = async (): Promise<void> => {
    const db = await getDb();
    await db.clear(WORDS_STORE);
    await db.clear(METADATA_STORE);
    console.log("Offline data cleared.");
};

/**
 * Processes a downloaded MessagePack file and stores its contents in the database.
 * @param fileUrl The URL of the .msgpack file to fetch and process.
 */
export const processWordFile = async (fileUrl: string): Promise<void> => {
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to download file: ${fileUrl}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const words = decode(arrayBuffer) as WordData[];

    const db = await getDb();
    const tx = db.transaction(WORDS_STORE, "readwrite");

    for (const word of words) {
        try {
            // Robust check: ensure the object has a valid key (word_id)
            // and a valid property for indexing (word_name).
            if (!word || typeof word.word_id !== 'number' || typeof word.word_name !== 'string' || word.word_name.length === 0) {
                console.warn("Skipping invalid word object lacking a valid 'word_id' or 'word_name':", word);
                continue;
            }
            await tx.store.put(word);
        } catch (error) {
            console.error("--- IndexedDB Error ---");
            console.error("Failed to store the following word object in IndexedDB:");
            console.error(word);
            console.error("Original Error:", error);

            throw new Error(`Failed to store word with ID: "${word?.word_id || 'unknown'}". Check the console for the problematic data object.`);
        }
    }

    await tx.done;
};


/**
 * Finds a single word by its name from the offline database using the index.
 * @param wordName The name of the word to search for.
 * @returns The word data or undefined if not found.
 */
export const getWordByNameOffline = async (
    wordName: string
): Promise<WordData | undefined> => {
    const db = await getDb();
    // Use the index to perform the lookup
    return db.getFromIndex(WORDS_STORE, WORD_NAME_INDEX, wordName);
};
