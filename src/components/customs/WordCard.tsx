import React, {
  Fragment
} from "react";
// import {
//   Accordion,
//   AccordionItem,
// } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { WordSearchResult } from "@/types";
import SaveWord from "./SaveWord";
const itemClasses = {
  title: "font-normal text-fs-1 text-primary",
  trigger: "px-2 py-0 rounded-lg h-14 flex items-center",
  indicator: "text-fs-0",
  content: "px-2 text-fs--1",
};
export default function WordCard({ word: { word_data }, isSavedWord, locale }: { word: WordSearchResult, isSavedWord?: boolean, locale: "en" | "tr" }) {
  return (
    <Card
      as={"article"}
      aria-label="word card"
      role="article"
      isBlurred
      className="border border-border rounded-sm p-4"
      classNames={{
        base: ["p-6"]
      }}
    >
      <SaveWord word_data={word_data} isSavedWord={isSavedWord} />
      <CardHeader className="block sm:flex justify-center ">
        <h2 className="text-fs-4 w-full text-center sm:text-start">
          {word_data.prefix && (
            <span className="text-fs-2">
              <span aria-label="word prefix">{word_data.prefix}</span>
              <span aria-hidden>-,</span>
            </span>
          )}
          {word_data.word_name}
          {word_data.suffix && (
            <span className="text-fs-2">
              <span aria-hidden></span>
              <span aria-label="word-suffix">{word_data.suffix}</span>
            </span>
          )}
        </h2>
        {word_data.root.root && word_data.root[`language_${locale}`] ? (
          <Chip size="sm" className="rounded-sm">
            <div className="flex h-6 items-center space-x-1">
              <span className="sr-only">Root:</span>
              <h3 aria-label="the root of the word">{word_data.root.root}</h3>
              {word_data.root.root && word_data.root[`language_${locale}`] ? <Divider orientation="vertical"></Divider> : null}
              <span className="sr-only">Root Language:</span>
              <h3 aria-label="the root language">{word_data.root[`language_${locale}`]}</h3>
            </div>
          </Chip>
        ) : null}
      </CardHeader>
      <CardBody>
        <>
          <ul className="grid gap-2">
            {word_data.meanings.map((meaning, index) => (
              <li key={meaning.meaning_id} className="grid gap-1">
                <div className="flex gap-2" >
                  <Divider orientation="vertical" className="w-[2px]" />
                  <p>
                    {meaning.part_of_speech}
                    {meaning.attributes && meaning.attributes.length > 0
                      ? `, ${meaning.attributes.map((attr) => attr.attribute).join(", ")}`
                      : null}
                  </p>
                </div>
                <p className="text-fs-1">
                  {meaning.meaning}
                </p>
                {meaning.sentence ? (
                  <div className="w-full italic px-2 text-fs--1 text-center">
                    <p>
                      <q>{meaning.sentence}</q>
                      {meaning.author ? ` -${meaning.author}` : null}
                    </p>
                  </div>
                ) : null}
                {/* do not render a divider after the last meaning. */}
                {index === word_data.meanings.length - 1 ? null : <Divider />}
              </li>
            ))}
          </ul>
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
