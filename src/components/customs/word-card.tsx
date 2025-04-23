"use client"
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { WordSearchResult } from "@/types";
import SaveWord from "./save-word";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, Popover, PopoverTrigger, PopoverContent, Tabs, Tab } from "@heroui/react";
import { Link as NextUILink } from "@heroui/react"

import WordEditRequest from "./edit-request-modal/word-edit-request";
import MeaningsEditRequest from "./edit-request-modal/meanings-edit-request";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { Camera, Share2, Volume1, Volume2 } from "lucide-react";

export default function WordCard({ word: { word_data }, isSavedWord, locale, session }: { word: WordSearchResult, isSavedWord?: boolean, locale: "en" | "tr", session: Session | null }) {
  const { isOpen, onOpenChange } = useDisclosure()
  const t = useTranslations("WordCard");
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
      <CardHeader className="w-full block">
        <div className="w-full flex items-center justify-between">

          <div className="w-full flex items-center gap-2">
            <h2 className="text-fs-3 text-center sm:text-start break-words hyphens-auto">
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
            <Button className="bg-transparent" isIconOnly>
              <Volume2 className="w-6 h-6" />
            </Button>

            {word_data.root.root && (
              <div className="hidden md:flex items-center text-sm text-muted-foreground ml-4">
                <span className="px-2">•</span>
                <span>
                  <span className="text-fs--2">{word_data.root.root}</span>
                  {word_data.root.language_tr && ` (${word_data.root.language_tr})`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <SaveWord word_data={word_data} isSavedWord={isSavedWord} />
            <Button disabled disableRipple isIconOnly className="bg-transparent"
              onPress={(e) => {
                // TODO: generate image of word card
              }}
            >
              <Camera className="w-6 h-6" />
            </Button>
            <Button disableRipple isIconOnly className="bg-transparent" onPress={(e) => {
              // TODO: copy page url
            }}>
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div>
          {word_data.attributes?.map((attribute) => (
            <Chip key={attribute.attribute_id} size="sm" variant="solid" className="flex rounded-lg dark:text-primary-50 bg-primary-100 dark:bg-primary/50">
              {attribute.attribute}
            </Chip>
          ))}
        </div>

        {/* {word_data.root.root && word_data.root[`language_${locale}`] ? (
          <Chip color="primary" size="sm" className="rounded-sm text-primary-50 dark:bg-primary-600 ">
            <div className="flex h-6 items-center space-x-1">
              <span className="sr-only">Root:</span>
              <h3 aria-label="the root of the word">{word_data.root.root}</h3>
              {word_data.root.root && word_data.root[`language_${locale}`] ? <Divider className="" orientation="vertical"></Divider> : null}
              <span className="sr-only">Root Language:</span>
              <h3 aria-label="the root language">{word_data.root[`language_${locale}`]}</h3>
            </div>
          </Chip>
        ) : null} */}
      </CardHeader>
      <CardBody>
        <>
          <Tabs disableAnimation classNames={{
            tabList: "w-full dark:bg-card",
            tabContent: "text-primary"
          }}>
            <Tab value={"meaning"} title={t("Meanings")} >
              <ul className="grid gap-2">
                {word_data.meanings.map((meaning, index) => (
                  <li key={meaning.meaning_id} className="grid gap-1">
                    <div className="flex gap-2" >
                      <Divider orientation="vertical" className="w-[2px] bg-primary" />
                      <p>
                        {meaning.part_of_speech}
                        {meaning.attributes && meaning.attributes.length > 0 && (
                          <>
                            {meaning.part_of_speech ? ", " : ""}
                            {meaning.attributes.map(attr => attr.attribute).join(", ")}
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-fs-1 break-words hyphens-auto">
                      {meaning.meaning}
                    </p>
                    {meaning.sentence ? (
                      <div className="w-full italic px-2 text-fs--1 text-left bg-muted/50 p-2">
                        <p>
                          <q>{meaning.sentence}</q>
                        </p>
                        {meaning.author && <p>-{meaning.author}</p>}
                      </div>
                    ) : null}
                    {/* do not render a divider after the last meaning. */}
                    {index === word_data.meanings.length - 1 ? null : <Divider />}
                  </li>
                ))}
              </ul>
            </Tab>
            <Tab value={"related_words"} title={t("RelatedWords")}>
              <ul className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-2">
                {word_data.relatedWords?.map((related_word) => (
                  <li key={related_word.related_word_id}>
                    <Card>
                      <CardBody>
                        <NextUILink target="_blank" as={Link} href={`/search/${related_word.related_word_name}`}>
                          {related_word.related_word_name}
                        </NextUILink>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            </Tab>
            <Tab value={"related_phrases"} title={t("RelatedPhrases")}>
              <ul className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5  gap-2">
                {word_data.relatedPhrases?.map((related_phrase) => (
                  <li key={related_phrase.related_phrase_id}>
                    <Card>
                      <CardBody>
                        <NextUILink target="_blank" as={Link} href={`/search/${related_phrase.related_phrase}`}>
                          {related_phrase.related_phrase}
                        </NextUILink>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            </Tab>
          </Tabs>
        </>
      </CardBody>
      <CardFooter className="flex justify-between">
        <>
          {
            session ?
              (<Button onPress={onOpenChange} color="primary" variant="solid">
                {t("RequestEdit")}
              </Button>)
              : (
                <Popover showArrow placement="bottom">
                  <PopoverTrigger>
                    <Button color="primary" variant="faded">
                      {t("RequestEdit")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col items-center">
                      <div>
                        <p>
                          {t("You can request an edit if you are signed in")}
                        </p>
                        <button onClick={() => signIn()} className="text-primary underline underline-offset-2">
                          {t("SignIn")}
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )
          }
        </>
        <Modal size="3xl" scrollBehavior="inside" backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  {t("EditWord")}
                </ModalHeader>
                <ModalBody>
                  <Tabs>
                    <Tab value={"words"} title={t("Words")}>
                      <WordEditRequest data={{ word_data }} />
                    </Tab>
                    <Tab value={"meanings"} title={t("Meanings")}>
                      <MeaningsEditRequest meanings={word_data.meanings} />
                    </Tab>
                  </Tabs>
                </ModalBody>
                <ModalFooter>
                  <Button onPress={onClose}>
                    {t("Close")}
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
