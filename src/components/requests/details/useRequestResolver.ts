// src/components/requests/details/useRequestResolver.ts
import { useMemo } from "react";
import { api } from "@/src/trpc/react";
import { EntityTypes, Actions } from "@/db/schema/requests";
import { useTranslations } from "next-intl";

interface UseRequestResolverProps {
  entityType: EntityTypes;
  action: Actions;
  newData?: any;
  oldData?: any;
}

/**
 * A hook to resolve IDs in request data to human-readable names.
 * It fetches all necessary lookup data (attributes, languages, etc.)
 * and provides a "beautified" version of the input data.
 */
export function useRequestResolver({ entityType, action, newData, oldData }: UseRequestResolverProps) {
  const { data: wordAttributes, isLoading: isLoadingWordAttributes } = api.request.getWordAttributesWithRequested.useQuery();
  const { data: meaningAttributes, isLoading: isLoadingMeaningAttributes } = api.request.getMeaningAttributesWithRequested.useQuery();
  const { data: languages, isLoading: isLoadingLanguages } = api.params.getLanguages.useQuery();
  const { data: partsOfSpeech, isLoading: isLoadingPartsOfSpeech } = api.params.getPartOfSpeeches.useQuery();
  const { data: authors, isLoading: isLoadingAuthors } = api.request.getAuthorsWithRequested.useQuery();
  const tRelationTypes = useTranslations("RelationTypes");

  // Collect all word IDs that need to be resolved for related words/phrases
  const wordIdsToResolve = useMemo(() => {
    const ids = new Set<number>();
    if (entityType === 'related_words' || entityType === 'related_phrases' || entityType === 'words') {
      console.log('newData', newData)
      console.log('oldData', oldData)
      if (Array.isArray(newData?.relatedWords)) {
        newData.relatedWords.forEach((word: any) => ids.add(word.relatedWordId));
      }
      if (Array.isArray(oldData?.relatedWords)) {
        oldData.relatedWords.forEach((word: any) => ids.add(word.relatedWordId));
      }
      if (Array.isArray(newData?.relatedPhrases)) {
        newData.relatedPhrases.forEach((phrase: any) => ids.add(phrase.relatedWordId));
      }
      if (Array.isArray(oldData?.relatedPhrases)) {
        oldData.relatedPhrases.forEach((phrase: any) => ids.add(phrase.relatedWordId));
      }
      if (newData?.relatedWordId) {
        ids.add(newData.relatedWordId);
      }
      if (oldData?.relatedWordId) {
        ids.add(oldData.relatedWordId);
      }
      if (newData?.relatedPhraseId) {
        ids.add(newData.relatedPhraseId);
      }
      if (oldData?.relatedPhraseId) {
        ids.add(oldData.relatedPhraseId);
      }

    }
    return Array.from(ids);
  }, [entityType, newData, oldData]);

  const { data: resolvedWords, isLoading: isLoadingResolvedWords } = api.word.getWordsByIds.useQuery(
    { ids: wordIdsToResolve },
    { enabled: wordIdsToResolve.length > 0 }
  );

  const isLoading =
    isLoadingWordAttributes ||
    isLoadingMeaningAttributes ||
    isLoadingLanguages ||
    isLoadingPartsOfSpeech ||
    isLoadingAuthors ||
    isLoadingResolvedWords;

  const resolvedData = useMemo(() => {
    if (isLoading) {
      return { new: {}, old: {} };
    }

    const createMap = <T extends { id: number | string }>(arr: T[] | undefined, key: keyof T = 'id') => {
      return new Map(arr?.map(item => [item[key], item]));
    };

    const wordAttrMap = createMap(wordAttributes, 'id');
    const meaningAttrMap = createMap(meaningAttributes, 'id');
    const posMap = createMap(partsOfSpeech, 'id');
    const langMap = createMap(languages, 'language_code');
    const authorMap = createMap(authors, 'id');
    const wordNamesMap = createMap(resolvedWords, 'id');

    const beautify = (data: any, entity: EntityTypes) => {
      if (!data) return {};
      const beautifiedData = { ...data };
      console.log('beautifiedData', beautifiedData);
      switch (entity) {
        case 'words':
          if (beautifiedData.language) {
            beautifiedData.language = langMap.get(beautifiedData.language)?.language_en || beautifiedData.language;
          }
          if (beautifiedData.attributes) {
            beautifiedData.attributes = beautifiedData.attributes.map(
              (id: number) => wordAttrMap.get(id)?.attribute || `ID: ${id}`
            );
          }
          if (beautifiedData.wordName) {
            beautifiedData.name = beautifiedData.wordName;
            delete beautifiedData.wordName;
          }
          if (beautifiedData.meanings && Array.isArray(beautifiedData.meanings)) {
            beautifiedData.meanings = beautifiedData.meanings.map((m: any) => beautify(m, 'meanings'));
          }
          if (beautifiedData.relatedWords && Array.isArray(beautifiedData.relatedWords)) {
            beautifiedData.relatedWords = beautifiedData.relatedWords.map((m: any) => {
              if (m.relatedWordId) {
                return {
                  relatedWord: wordNamesMap.get(m.relatedWordId)?.name || `ID: ${m.relatedWordId}`,
                  relationType: tRelationTypes(m.relationType),
                }
              }
            });
          }
          if (beautifiedData.relatedPhrases && Array.isArray(beautifiedData.relatedPhrases)) {
            beautifiedData.relatedPhrases = beautifiedData.relatedPhrases.map((m: any) => {
              if (m.relatedWordId) {
                return {
                  relatedWord: wordNamesMap.get(m.relatedWordId)?.name || `ID: ${m.relatedWordId}`,
                  relationType: tRelationTypes(m.relationType),
                }
              }
            });
          }
          break;

        case 'meanings':
          if (beautifiedData.partOfSpeechId) {
            beautifiedData.partOfSpeech = posMap.get(beautifiedData.partOfSpeechId)?.partOfSpeech || `ID: ${beautifiedData.partOfSpeechId}`;
            delete beautifiedData.partOfSpeechId;
          }
          if (beautifiedData.authorId) {
            beautifiedData.author = authorMap.get(beautifiedData.authorId)?.name || `ID: ${beautifiedData.authorId}`;
            delete beautifiedData.author_id;
          }
          if (beautifiedData.attributes) {
            beautifiedData.attributes = beautifiedData.attributes.map(
              (id: number) => meaningAttrMap.get(id)?.attribute || `ID: ${id}`
            );
          }
          break;

        case 'related_words':
          if (beautifiedData.relatedWordId) {
            beautifiedData.relatedWord = wordNamesMap.get(beautifiedData.relatedWordId)?.name || `ID: ${beautifiedData.relatedWordId}`;
            delete beautifiedData.relatedWordId;
          }
          if (beautifiedData.relationType) {
            beautifiedData.relationType = tRelationTypes(beautifiedData.relationType);
          }
          break;

        case 'related_phrases':
          if (beautifiedData.relatedPhraseId) {
            beautifiedData.relatedPhrase = wordNamesMap.get(beautifiedData.relatedPhraseId)?.name || `ID: ${beautifiedData.relatedPhraseId}`;
            delete beautifiedData.relatedPhraseId;
          }
          if (beautifiedData.relationType) {
            beautifiedData.relationType = tRelationTypes(beautifiedData.relationType);
          }
          break;

        case 'word_attributes':
        case 'authors':
        default:
          break;
      }

      return beautifiedData;
    };

    return {
      new: beautify(newData, entityType),
      old: beautify(oldData, entityType),
    };
  }, [isLoading, newData, oldData, entityType, wordAttributes, meaningAttributes, partsOfSpeech, languages, authors, resolvedWords, tRelationTypes]);

  return { resolvedData, isLoading };
}
