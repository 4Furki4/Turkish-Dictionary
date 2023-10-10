"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
} from "@nextui-org/react";
import type * as Prisma from "@prisma/client";
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
              <>
                <p className="text-fs-1" key={meaning.id}>
                  {meaning.partOfSpeech ? `${meaning.partOfSpeech}` : null}
                  {meaning.attributes.length > 0 && ", "}
                  {meaning.attributes ? `${meaning.attributes}` : null}
                  {": "}
                  {meaning.definition.definition}
                </p>
                {meaning.definition.example ? (
                  <p className="italic px-2 text-fs--1">
                    {meaning.definition.example.sentence}{" "}
                    {"- " + meaning.definition.example.author}
                  </p>
                ) : null}
                <Divider />
              </>
            ))}
          </div>
        </>
      </CardBody>
    </Card>
  );
}
