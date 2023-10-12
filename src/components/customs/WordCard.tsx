"use client";
import React, { Fragment } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Accordion,
  AccordionItem,
} from "@nextui-org/react";
import { Word } from "../../../types";
import Link from "next-intl/link";
const itemClasses = {
  title: "font-normal text-fs-1 text-primary",
  trigger: "px-2 py-0 rounded-lg h-14 flex items-center",
  indicator: "text-fs-0",
  content: "px-2 text-fs--1",
};
export default function WordCard({ word }: { word: Word }) {
  return (
    <Card isBlurred className="bg-content1 text-primary-foreground">
      <CardHeader className="justify-center">
        <h2 className="text-fs-6 text-center w-full self-start">
          {word.prefix && <span className="text-fs-4">{word.prefix}-, </span>}
          {word.name}
          {word.suffix && <span className="text-fs-4">, -{word.suffix}</span>}
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
                  {meaning.attributes.length > 0 && ", "}
                  {meaning.attributes ? `${meaning.attributes}` : null}
                  {": "}
                  {meaning.definition.definition}
                </p>
                {meaning.definition.example ? (
                  <p className="text-center italic px-2 text-fs--1">
                    <q>{meaning.definition.example.sentence}</q>{" "}
                    {"- " + meaning.definition.example.author}
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
              {word.relatedWords.length > 0 ? (
                word.relatedWords.map((word, index) => (
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
              {word.relatedWords.length > 0 ? (
                word.relatedPhrases.map((word, index) => (
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
