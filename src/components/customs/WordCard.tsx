"use client";
import React, { Fragment } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
} from "@nextui-org/react";
import { Word } from "../../../types";
export default function WordCard({ word }: { word: Word }) {
  return (
    <Card isBlurred className="bg-content1 text-primary-foreground">
      <CardHeader className="justify-center">
        <h2 className="text-fs-6 text-center w-full self-start">{word.name}</h2>
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
        <p className="text-fs--1">Related Words</p>
      </CardFooter>
    </Card>
  );
}
