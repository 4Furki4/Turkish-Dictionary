import type { db as applicationDb } from "@/db";
import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";
import { words } from "@/db/schema/words";
import { meanings } from "@/db/schema/meanings";
import { examples } from "@/db/schema/examples";
import { roots } from "@/db/schema/roots";
import { wordAttributes, wordsAttributes } from "@/db/schema/word_attributes";
import { meaningAttributes } from "@/db/schema/meaning_attributes";
import { authors } from "@/db/schema/authors";
import { languages } from "@/db/schema/languages";
import { partOfSpeechs } from "@/db/schema/part_of_speechs";
import { users } from "@/db/schema/users";
import { requests } from "@/db/schema/requests";
import { feedbacks } from "@/db/schema/feedbacks";
import { announcements } from "@/db/schema/announcements";
import { announcementTranslations } from "@/db/schema/announcement_translations";
import { dailyWords } from "@/db/schema/daily-words";
import { misspellings } from "@/db/schema/misspellings";
import { galatiMeshur } from "@/db/schema/galatimeshur";
import { relatedWords } from "@/db/schema/related_words";
import { relatedPhrases } from "@/db/schema/related_phrases";
import { wordRelationSuggestions } from "@/db/schema/word_relation_suggestions";
import { badges, usersToBadges } from "@/db/schema/gamification";
import { foreignTermSuggestions } from "@/db/schema/foreign_term_suggestions";
import type { adminAuditEvents } from "@/db/schema/admin_audit";

export type AuditDatabase = typeof applicationDb;
export type AuditTransaction = Parameters<Parameters<AuditDatabase["transaction"]>[0]>[0];
type Snapshot = Record<string, unknown> | null;
type Action = typeof adminAuditEvents.$inferInsert.action;
type Entity = {
  type: string;
  label: string;
  read(tx: AuditTransaction, id: string): Promise<Snapshot>;
};
export type AuditDescriptor = { action: Action; entity: Entity; inputKey: string; createKey?: string };

function entity(type: string, table: AnyPgTable, names: string[], label = "id", key = "id"): Entity {
  const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
  const selected = Object.fromEntries(names.map(name => [name, columns[name]]));
  return { type, label, async read(tx, id) {
    const [row] = await tx.select(selected).from(table).where(eq(columns[key], id)).limit(1).for("update");
    return row ?? null;
  } };
}

const word = entity("word", words, ["id", "name", "variant", "phonetic", "prefix", "suffix", "rootId", "sourceId"], "name");
const wordReader = word.read;
word.read = async (tx, id) => {
  const row = await wordReader(tx, id);
  if (!row) return null;
  const wordId = Number(id);
  const definitions = await tx.select({ id: meanings.id, meaning: meanings.meaning, partOfSpeechId: meanings.partOfSpeechId, order: meanings.order })
    .from(meanings).where(eq(meanings.wordId, wordId)).orderBy(asc(meanings.id)).limit(41);
  const sentences = definitions.length ? await tx.select({ id: examples.id, meaningId: examples.meaningId, sentence: examples.sentence, authorId: examples.authorId })
    .from(examples).where(inArray(examples.meaningId, definitions.map(value => value.id))).orderBy(asc(examples.id)).limit(41) : [];
  const attributes = await tx.select({ attributeId: wordsAttributes.attributeId }).from(wordsAttributes)
    .where(eq(wordsAttributes.wordId, wordId)).orderBy(asc(wordsAttributes.attributeId)).limit(41);
  const etymology = await tx.select({ id: roots.id, root: roots.root, languageId: roots.languageId }).from(roots)
    .where(eq(roots.wordId, wordId)).orderBy(asc(roots.id)).limit(41);
  return { ...row, meanings: definitions, examples: sentences, attributes, etymology };
};
const announcement = entity("announcement", announcements, ["id", "slug", "status", "publishedAt", "actionTextKey"], "slug");
const announcementReader = announcement.read;
announcement.read = async (tx, id) => {
  const row = await announcementReader(tx, id);
  if (!row) return null;
  const translations = await tx.select({ locale: announcementTranslations.locale, title: announcementTranslations.title, content: announcementTranslations.content, excerpt: announcementTranslations.excerpt })
    .from(announcementTranslations).where(eq(announcementTranslations.announcementId, Number(id))).orderBy(asc(announcementTranslations.locale)).limit(41);
  return { ...row, translations };
};

const entities = {
  word,
  wordAttribute: entity("word_attribute", wordAttributes, ["id", "attribute"], "attribute"),
  meaningAttribute: entity("meaning_attribute", meaningAttributes, ["id", "attribute"], "attribute"),
  author: entity("author", authors, ["id", "name"], "name"),
  partOfSpeech: entity("part_of_speech", partOfSpeechs, ["id", "partOfSpeech"], "partOfSpeech"),
  language: entity("language", languages, ["id", "language_code", "language_tr", "language_en"], "language_tr"),
  root: entity("root", roots, ["id", "wordId", "languageId", "root"], "root"),
  user: entity("user", users, ["id", "role"]),
  request: entity("request", requests, ["id", "entityType", "entityId", "action", "status", "resolvedAt", "resolvedBy"]),
  feedback: entity("feedback", feedbacks, ["id", "status", "type"]),
  announcement,
  dailyWord: entity("daily_word", dailyWords, ["id", "wordId", "date"]),
  misspelling: entity("misspelling", misspellings, ["id", "correctWordId", "incorrectSpelling"], "incorrectSpelling"),
  galatiMeshur: entity("galatimeshur", galatiMeshur, ["id", "wordId", "explanation", "correctUsage"]),
  badge: entity("badge", badges, ["slug", "nameTr", "nameEn", "descriptionTr", "descriptionEn", "icon", "requirementType", "requirementValue", "category"], "slug", "slug"),
  relationSuggestion: entity("relation_suggestion", wordRelationSuggestions, ["id", "wordId", "relatedWordId", "status", "reviewedAt", "reviewedBy"]),
  foreignSuggestion: entity("foreign_suggestion", foreignTermSuggestions, ["id", "status", "createdWordId", "resolvedAt", "resolvedBy"]),
};

function pairEntity(type: string, table: AnyPgTable, first: string, second: string, fields: string[]): Entity {
  const columns = getTableColumns(table) as Record<string, AnyPgColumn>;
  const selected = Object.fromEntries(fields.map(name => [name, columns[name]]));
  return { type, label: first, async read(tx, id) {
    const [left, right] = JSON.parse(id) as [string | number, string | number];
    const rows = await tx.select(selected).from(table).where(and(eq(columns[first], left), eq(columns[second], right))).limit(41).for("update");
    return rows.length ? { pair: rows } : null;
  } };
}
const relation = pairEntity("word_relation", relatedWords, "wordId", "relatedWordId", ["wordId", "relatedWordId", "relationType"]);
const phrase = pairEntity("phrase_relation", relatedPhrases, "wordId", "relatedPhraseId", ["wordId", "relatedPhraseId"]);
const badgeAssignment = pairEntity("badge_assignment", usersToBadges, "userId", "badgeSlug", ["userId", "badgeSlug", "awardedAt"]);

export const ADMIN_AUDIT_REGISTRY: Record<string, AuditDescriptor> = {};
function register(path: string, entity: Entity, action: Action, inputKey = "id", createKey?: string) {
  ADMIN_AUDIT_REGISTRY[path] = { entity, action, inputKey, createKey };
}
for (const [name, action] of [["addWord", "create"], ["editWord", "update"], ["deleteWord", "delete"]] as const) register(`admin.${name}`, word, action);
register("admin.addNewWordAttribute", entities.wordAttribute, "create");
register("admin.addNewMeaningAttribute", entities.meaningAttribute, "create");
register("admin.addAuthor", entities.author, "create");
for (const [suffix, target] of [["WordAttribute", entities.wordAttribute], ["MeaningAttribute", entities.meaningAttribute], ["Author", entities.author], ["PartOfSpeech", entities.partOfSpeech], ["Language", entities.language], ["Root", entities.root]] as const) {
  for (const action of ["create", "update", "delete"] as const) register(`admin.dynamicParameters.${action}${suffix}`, target, action);
}
register("user.setRole", entities.user, "update", "userId");
register("user.deleteUser", entities.user, "delete", "userId");
register("request.approveRequest", entities.request, "approve", "requestId");
register("request.rejectRequest", entities.request, "reject", "requestId");
for (const name of ["updateStatus", "updateType", "delete"] as const) register(`admin.feedback.${name}`, entities.feedback, name === "delete" ? "delete" : "update");
for (const action of ["create", "update", "delete"] as const) register(`admin.announcements.${action}Announcement`, announcement, action);
for (const [group, suffix, target] of [["dailyWords", "DailyWord", entities.dailyWord], ["misspellings", "Misspelling", entities.misspelling], ["galatiMeshur", "GalatiMeshur", entities.galatiMeshur]] as const) {
  for (const [verb, action] of [["add", "create"], ["update", "update"], ["delete", "delete"]] as const) register(`admin.${group}.${verb}${suffix}`, target, action);
}
for (const action of ["create", "update", "delete"] as const) register(`badge.${action}`, entities.badge, action, "slug", "slug");
for (const action of ["assign", "revoke"] as const) register(`badge.${action}`, badgeAssignment, action, "pair:userId:badgeSlug", "pair:userId:badgeSlug");
for (const [name, action] of [["addRelatedWord", "create"], ["removeRelatedWord", "delete"], ["updateRelatedWordType", "update"]] as const) register(`admin.wordRelations.${name}`, relation, action, "pair:wordId:relatedWordId", "pair:wordId:relatedWordId");
for (const [name, action] of [["addRelatedPhrase", "create"], ["removeRelatedPhrase", "delete"]] as const) register(`admin.wordRelations.${name}`, phrase, action, "pair:wordId:relatedPhraseId", "pair:wordId:relatedPhraseId");
for (const [name, action] of [["acceptSuggestion", "approve"], ["dismissSuggestion", "reject"], ["restoreSuggestion", "update"]] as const) register(`admin.wordRelations.${name}`, entities.relationSuggestion, action);
for (const action of ["approve", "reject"] as const) register(`foreignTermSuggestion.${action}`, entities.foreignSuggestion, action, "suggestionId");

// Do not extend a query-bearing 90-day triage record into 365-day history.
export const ADMIN_AUDIT_EXCLUSIONS: Record<string, string> = {
  "admin.searchGaps.review": "Query-bearing search-gap triage retains its separate 90-day policy.",
};
export const ADMIN_AUDIT_TARGETS = [...new Set(Object.values(ADMIN_AUDIT_REGISTRY).map(value => value.entity.type))].sort();

export function auditIdentifier(key: string, input: Record<string, unknown>): string | null {
  if (key.startsWith("pair:")) {
    const values = key.split(":").slice(1).map(name => input[name]);
    return values.every(value => (typeof value === "string" && value.length > 0) || (typeof value === "number" && Number.isSafeInteger(value))) ? JSON.stringify(values) : null;
  }
  const value = input[key];
  return typeof value === "number" && Number.isSafeInteger(value) ? String(value)
    : typeof value === "string" && value.length > 0 ? value : null;
}

export function createdAuditIdentifier(output: unknown): string | null {
  if (Array.isArray(output)) return createdAuditIdentifier(output[0]);
  if (!output || typeof output !== "object") return null;
  const row = output as Record<string, unknown>;
  return auditIdentifier("id", row) ?? (row.word ? createdAuditIdentifier(row.word) : null);
}
