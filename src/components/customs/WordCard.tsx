'use client'
// @ts-nocheck
import React, {
  Fragment,
  useOptimistic,
} from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Accordion,
  AccordionItem,
} from "@nextui-org/react";
import { Bookmark } from "lucide-react";
import { api } from "@/src/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { SelectWordWithMeanings } from "@/db/schema/words";
import { WordSearchResult } from "@/types";
const itemClasses = {
  title: "font-normal text-fs-1 text-primary",
  trigger: "px-2 py-0 rounded-lg h-14 flex items-center",
  indicator: "text-fs-0",
  content: "px-2 text-fs--1",
};
export default function WordCard({ word: { word_data } }: { word: WordSearchResult }) {
  const savedWords = api.user.getSavedWords.useQuery();
  const savedWordsQuery = api.user.getWordSaveStatus.useQuery(word_data.word_id, {
    queryKey: ["user.getWordSaveStatus", word_data.word_id],
    staleTime: Infinity,
  });
  const [optimisticIsSaved, setOptimisticIsSave] = useOptimistic(
    savedWordsQuery.data,
    (currentState, optimisticValue) => currentState!
  );
  const t = useTranslations("WordCard");
  const saveWordMutation = api.user.saveWord.useMutation({
    onError: (error) => {
      switch (error.message) {
        case "UNAUTHORIZED":
          toast.error(t("UnauthSave"), {
            position: "bottom-center",
          });
          break;
      }
    },
    onSuccess: async () => {
      await savedWordsQuery.refetch();
    },
  });
  const unsaveWordMutation = api.user.unsaveWord.useMutation({
    onError: (error) => {
      switch (error.message) {
        case "UNAUTHORIZED":
          toast.error(t("UnauthUnsave"), {
            position: "bottom-center",
          });
          break;
      }
    },
    onSuccess: async () => {
      await savedWordsQuery.refetch();
    },
  });

  return (
    <Card
      aria-label="word card"
      role="article"
      isBlurred
      className="bg-content1 text-primary-foreground"
    >
      <button
        className="absolute top-2 right-2 cursor-pointer z-50 sm:hover:scale-125 transition-all"
        onClick={async () => {
          setOptimisticIsSave(!optimisticIsSaved);
          if (savedWordsQuery.data) {
            await unsaveWordMutation.mutateAsync(word_data.word_id);
            return;
          }
          await saveWordMutation.mutateAsync({ wordId: word_data.word_id });
        }}
      >
        <Bookmark
          aria-label="bookmark icon"
          size={32}
          fill={savedWordsQuery.data ? "#F59E0B" : "#fff"}
        />
      </button>

      <CardHeader className="justify-center">
        <h2 className="text-fs-6 text-center w-full self-start">
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
      </CardHeader>
      <CardBody>
        <>
          <div className="flex space-x-4">
            <h3 className="text-fs-0">{word_data.root.root}</h3>
            <Divider orientation="vertical"></Divider>
            <h3 className="text-fs-0">{word_data.root.language}</h3>
          </div>
          <div className="grid gap-2 mt-4">
            {word_data.meanings.map((meaning) => (
              <Fragment key={meaning.meaning_id}>
                <p className="text-fs-1">
                  {meaning.part_of_speech ? `${meaning.part_of_speech}` : null}
                  {/* {meaning.attributes && <span aria-hidden>, </span>}
                  {meaning.attributes ? `${meaning.attributes}` : null} */}
                  <span aria-hidden>{": "}</span>
                  {meaning.meaning}
                </p>
                {/* {meaning.exampleSentece ? (
                  <p className="text-center italic px-2 text-fs--1">
                    <q>{meaning.exampleSentece}</q>{" "}
                    {"- " + meaning.exampleSentenceAuthor}
                  </p>
                ) : null} */}
                <Divider />
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
  );
}
