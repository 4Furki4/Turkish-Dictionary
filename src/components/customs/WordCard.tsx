"use client"
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { WordSearchResult } from "@/types";
import SaveWord from "./SaveWord";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import WordEditRequest from "./EditRequestModal/WordEditRequest";
import MeaningsEditRequest from "./EditRequestModal/MeaningsEditRequest";

export default function WordCard({ word: { word_data }, isSavedWord, locale }: { word: WordSearchResult, isSavedWord?: boolean, locale: "en" | "tr" }) {
  const { isOpen, onOpenChange } = useDisclosure()
  return (
    <Card
      as={"article"}
      aria-label="word card"
      role="article"
      isBlurred
      className="border border-border rounded-sm p-4 w-full"
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
        <Button onPress={onOpenChange}>
          Request Edit
        </Button>
        <Modal size="3xl" isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  Edit Word
                </ModalHeader>
                <ModalBody>
                  <Tabs defaultValue="words">
                    <TabsList>
                      <TabsTrigger value="words">Words</TabsTrigger>
                      <TabsTrigger value="meanings">Meanings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="words">
                      <WordEditRequest data={{ word_data }} />
                    </TabsContent>
                    <TabsContent value="meanings">
                      <MeaningsEditRequest meanings={word_data.meanings} />
                    </TabsContent>
                  </Tabs>
                </ModalBody>
                <ModalFooter>
                  <Button onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </CardFooter>
    </Card>
  );
}
