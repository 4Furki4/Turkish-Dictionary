'use client'
// @ts-nocheck
import React, {
  Fragment
} from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Accordion,
  AccordionItem,
  Chip,
} from "@nextui-org/react";
import { Bookmark } from "lucide-react";
import { api } from "@/src/trpc/react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { WordSearchResult } from "@/types";
import Loading from "@/src/app/[locale]/(content)/(search)/search/loading";
const itemClasses = {
  title: "font-normal text-fs-1 text-primary",
  trigger: "px-2 py-0 rounded-lg h-14 flex items-center",
  indicator: "text-fs-0",
  content: "px-2 text-fs--1",
};
export default function WordCard({ word: { word_data }, isSavedWord }: { word: WordSearchResult, isSavedWord?: boolean }) {
  // const savedWords = api.user.getSavedWords.useQuery();

  const locale = useLocale() as "en" | "tr";
  const utils = api.useUtils()
  const savedWordsQuery = api.user.getWordSaveStatus.useQuery(word_data.word_id, {
    queryKey: ["user.getWordSaveStatus", word_data.word_id],
    initialData: isSavedWord,
  });
  const t = useTranslations("WordCard");
  const saveWordMutation = api.user.saveWord.useMutation({
    onMutate: async ({ wordId }) => {
      await utils.user.getWordSaveStatus.cancel(wordId)
      const previousValue = utils.user.getWordSaveStatus.getData(wordId);
      utils.user.getWordSaveStatus.setData(wordId, !previousValue);
      return { previousValue };
    },
    onError: (error, { wordId }, context) => {
      switch (error.message) {
        case "UNAUTHORIZED":
          toast.error(t("UnauthSave"), {
            position: "bottom-center",
          });
          utils.user.getWordSaveStatus.setData(wordId, context?.previousValue)
          break;
      }
    },
    // Always refetch after error or success:
    onSettled: (newValue, error, { wordId }) => {
      void utils.user.getWordSaveStatus.invalidate(wordId)
    },
  });


  return (
    <>
      <Card
        aria-label="word card"
        role="article"
        isBlurred
        className="border border-border rounded-sm p-4"
      >
        <button
          className="absolute top-4 right-4 cursor-pointer z-50 sm:hover:scale-125 transition-all"
          onClick={async () => {
            await saveWordMutation.mutateAsync({ wordId: word_data.word_id });
          }}
          disabled={saveWordMutation.isLoading}
        >
          <Bookmark
            aria-label="bookmark icon"
            size={32}
            fill={savedWordsQuery.data ? "#F59E0B" : "#fff"}
          />
        </button>

        <CardHeader className="block sm:flex justify-center ">
          <h2 className="text-fs-6 w-full text-center sm:text-start">
            {word_data.prefix && (
              <span className="text-fs-4">
                <span aria-label="word prefix">{word_data.prefix}</span>
                <span aria-hidden>-,</span>
              </span>
            )}
            {word_data.word_name}
            {word_data.suffix && (
              <span className="text-fs-4">
                <span aria-hidden></span>
                <span aria-label="word-suffix">{word_data.suffix}</span>
              </span>
            )}
          </h2>
          {word_data.root.root && word_data.root[`language_${locale}`] ? (
            <Chip size="sm" className="rounded-sm">
              <div className="flex h-6 items-center space-x-1">
                <h3 >{word_data.root.root}</h3>
                {word_data.root.root && word_data.root[`language_${locale}`] ? <Divider orientation="vertical"></Divider> : null}
                <h3 >{word_data.root[`language_${locale}`]}</h3>
              </div>
            </Chip>
          ) : null}
        </CardHeader>
        <CardBody>
          <>
            <div className="grid gap-2">
              {word_data.meanings.map((meaning, index) => (
                <Fragment key={meaning.meaning_id}>
                  <p>
                    {meaning.part_of_speech}
                    {meaning.attributes && meaning.attributes.length > 0
                      ? `, ${meaning.attributes.map((attr) => attr.attribute).join(", ")}`
                      : null}
                  </p>
                  <p className="text-fs-1">
                    {meaning.meaning}
                  </p>
                  {meaning.sentence ? (
                    <p className="text-center italic px-2 text-fs--1">
                      <q>{meaning.sentence}</q>{meaning.author ? ` - ${meaning.author}` : null}
                    </p>
                  ) : null}
                  {/* do not render a divider after the last meaning. */}
                  {index === word_data.meanings.length - 1 ? null : <Divider />}
                </Fragment>
              ))}
            </div>
          </>
        </CardBody>
        <CardFooter>
          {/* <Accordion selectionMode="multiple" itemClasses={itemClasses}>
          <AccordionItem
            key={1}
            aria-label="Related Words"
            title="Related Words"
          >
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {word_data.related_words ? (
                word_data.related_words.map((word, index) => (
                  <Fragment key={index}>
                    <Link
                      className="text-center underline"
                      href={`?word=${word}`}
                    >
                      {word}
                    </Link>
                  </Fragment>
                ))
              ) : (
                <p className="">No related words</p>
              )}
            </div>
          </AccordionItem>
          <AccordionItem title="Related Phareses">
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {word.related_phrases ? (
                word.related_phrases.map((word, index) => (
                  <Fragment key={index}>
                    <Link
                      className="text-center underline"
                      href={`?word=${word}`}
                    >
                      {word}
                    </Link>
                  </Fragment>
                ))
              ) : (
                <p className="text-center">No related phrases</p>
              )}
            </div>
          </AccordionItem>
        </Accordion> */}
        </CardFooter>
      </Card>
      <Loading />
    </>
  );
}
