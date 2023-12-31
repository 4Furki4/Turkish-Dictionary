"use client";
import React, {
  Fragment,
  experimental_useOptimistic as useOptimistic,
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
import Link from "next-intl/link";
import { Bookmark } from "lucide-react";
import { api } from "@/src/trpc/react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { SelectWordWithMeanings } from "@/db/schema";
const itemClasses = {
  title: "font-normal text-fs-1 text-primary",
  trigger: "px-2 py-0 rounded-lg h-14 flex items-center",
  indicator: "text-fs-0",
  content: "px-2 text-fs--1",
};
export default function WordCard({ word }: { word: SelectWordWithMeanings }) {
  const savedWords = api.user.getSavedWords.useQuery();
  const savedWordsQuery = api.user.getWordSaveStatus.useQuery(word.id, {
    queryKey: ["user.getWordSaveStatus", word.id],
    staleTime: Infinity,
  });
  const [optimisticIsSaved, setOptimisticIsSave] = useOptimistic(
    savedWordsQuery.data,
    (state, action) => !state
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
          await saveWordMutation.mutateAsync({ wordId: word.id });
        }}
      >
        <Bookmark
          aria-label="bookmark icon"
          size={32}
          fill={optimisticIsSaved ? "#F59E0B" : "#fff"}
        />
      </button>

      <CardHeader className="justify-center">
        <h2 className="text-fs-6 text-center w-full self-start">
          {word.prefix && (
            <span className="text-fs-4">
              <span aria-label="word prefix">{word.prefix}</span>
              <span aria-hidden>-,</span>
            </span>
          )}
          {word.name}
          {word.suffix && (
            <span className="text-fs-4">
              <span aria-hidden>, -</span>
              <span aria-label="word-suffix">{word.suffix}</span>
            </span>
          )}
        </h2>
      </CardHeader>
      <CardBody>
        <>
          <h3 className="text-fs-0">{word.root}</h3>
          <div className="grid gap-2 mt-4">
            {word.meanings.map((meaning) => (
              <Fragment key={meaning.id}>
                <p className="text-fs-1">
                  {meaning.partOfSpeech ? `${meaning.partOfSpeech}` : null}
                  {meaning.attributes && <span aria-hidden>, </span>}
                  {meaning.attributes ? `${meaning.attributes}` : null}
                  <span aria-hidden>{": "}</span>
                  {meaning.definition}
                </p>
                {meaning.exampleSentece ? (
                  <p className="text-center italic px-2 text-fs--1">
                    <q>{meaning.exampleSentece}</q>{" "}
                    {"- " + meaning.exampleSentenceAuthor}
                  </p>
                ) : null}
                <Divider />
              </Fragment>
            ))}
          </div>
        </>
      </CardBody>
      <CardFooter>
        <Accordion selectionMode="multiple" itemClasses={itemClasses}>
          <AccordionItem
            key={1}
            aria-label="Related Words"
            title="Related Words"
          >
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {word.related_words ? (
                word.related_words.map((word, index) => (
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
        </Accordion>
      </CardFooter>
    </Card>
  );
}
