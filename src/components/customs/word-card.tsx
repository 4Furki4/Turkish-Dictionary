"use client"
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { WordSearchResult } from "@/types";
import SaveWord from "./save-word";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tooltip, useDisclosure, Link as HeroUILink, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import WordEditRequest from "./edit-request-modal/word-edit-request";
import MeaningsEditRequest from "./edit-request-modal/meanings-edit-request";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";

export default function WordCard({ word: { word_data }, isSavedWord, locale, session }: { word: WordSearchResult, isSavedWord?: boolean, locale: "en" | "tr", session: Session | null }) {
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
      <CardHeader className="block sm:flex justify-center ">
        <h2 className="text-fs-3 w-full text-center sm:text-start break-words hyphens-auto">
          {word_data.prefix && (
            <span className="text-fs-0">
              <span aria-label="word prefix">{word_data.prefix}</span>
              <span aria-hidden>- </span>
            </span>
          )}
          {word_data.word_name}
          {word_data.suffix && (
            <span className="text-fs-0">
              <span aria-hidden> -</span>
              <span aria-label="word-suffix">{word_data.suffix}</span>
            </span>
          )}
        </h2>
        {word_data.root.root && word_data.root[`language_${locale}`] ? (
          <Chip color="primary" size="sm" className="rounded-sm text-primary-50 dark:bg-primary-600 ">
            <div className="flex h-6 items-center space-x-1">
              <span className="sr-only">Root:</span>
              <h3 aria-label="the root of the word">{word_data.root.root}</h3>
              {word_data.root.root && word_data.root[`language_${locale}`] ? <Divider className="" orientation="vertical"></Divider> : null}
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
                  <Divider orientation="vertical" className="w-[2px] bg-primary" />
                  <p>
                    {meaning.part_of_speech}
                    {meaning.attributes && meaning.attributes.length > 0
                      ? `, ${meaning.attributes.map((attr) => attr.attribute).join(", ")}`
                      : null}
                  </p>
                </div>
                <p className="text-fs-1 break-words hyphens-auto">
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
      <CardFooter className="flex justify-between">
        <>
          {
            session ?
              (<Button onPress={onOpenChange} color="primary" variant="solid">
                Request Edit
              </Button>)
              : (
                <Popover showArrow placement="bottom">
                  <PopoverTrigger>
                    <Button color="primary" variant="faded">
                      Request Edit
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col items-center">
                      <div>
                        <p>
                          You can request an edit if you are
                        </p>
                        <button onClick={() => signIn()} className="text-primary underline underline-offset-2">
                          signed in
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
          }
          <SaveWord word_data={word_data} isSavedWord={isSavedWord} />
        </>
        <Modal size="3xl" scrollBehavior="inside" backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
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
