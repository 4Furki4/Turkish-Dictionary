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
import RelatedWordsEditTabContent from "./edit-request-modal/related-words-edit-tab-content";
import RelatedPhrasesEditTabContent from "./edit-request-modal/related-phrases-edit-tab-content";
import RelatedWordEditRequestModal from "./edit-request-modal/related-word-edit-request-modal";
import RelatedWordDeleteRequestModal from "./edit-request-modal/related-word-delete-request-modal";
import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { Camera, Share2, Volume2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useRef, useState } from "react";
import { captureElementScreenshot } from "../../utils/screenshot";
import { copyPageUrl } from "../../utils/clipboard";
import clsx from "clsx";

type RelatedWordItemType = NonNullable<WordSearchResult['word_data']['relatedWords']>[number];

export default function WordCard({ word: { word_data }, locale, session }: { word: WordSearchResult, locale: "en" | "tr", session: Session | null }) {
  const { isOpen: isEditRelOpen, onOpen: onEditRelOpen, onClose: onEditRelClose, onOpenChange: onEditRelOpenChange } = useDisclosure();
  const { isOpen: isCreateRelOpen, onOpen: onCreateRelOpen, onClose: onCreateRelClose, onOpenChange: onCreateRelOpenChange } = useDisclosure();
  const { isOpen: isDeleteRelOpen, onOpen: onDeleteRelOpen, onClose: onDeleteRelClose, onOpenChange: onDeleteRelOpenChange } = useDisclosure();
  const [selectedRelatedWord, setSelectedRelatedWord] = useState<{ id: number; related_word_id: number; related_word_name: string; relation_type?: string | undefined; } | null>(null);

  const handleEditRelatedWord = (relatedWord: RelatedWordItemType) => {
    setSelectedRelatedWord({ id: relatedWord.related_word_id, ...relatedWord });
    onEditRelOpen();
  };

  const handleDeleteRelatedWord = (relatedWord: RelatedWordItemType) => {
    setSelectedRelatedWord({ id: relatedWord.related_word_id, ...relatedWord });
    onDeleteRelOpen();
  };
  const { isOpen, onOpenChange } = useDisclosure()
  const t = useTranslations("WordCard");
  const tRequests = useTranslations("Requests");
  const pathname = usePathname();
  const cardRef = useRef<HTMLDivElement>(null);
  const handleCameraPress = async () => {
    if (cardRef.current) {
      await captureElementScreenshot(cardRef.current, {
        processingMessage: t("screenshotProcessing") || "Creating screenshot...",
        successMessage: t("screenshotCopied") || "Screenshot copied to clipboard!",
        failureMessage: t("screenshotFailed") || "Failed to create screenshot.", // General failure
        clipboardCopyFailureMessage: t("screenshotDownloadFallback") || "Screenshot copy to clipboard failed. Downloading image instead.", // Specific for clipboard fail + download
        fileName: `${word_data.word_name}.png`
      });
    }
  };
  // Handler for the share button to copy the current page URL
  const handleSharePress = () => {
    copyPageUrl({
      successMessage: t("urlCopiedDescription") || "URL copied to clipboard!"
    });
  };
  console.log('word_data.relatedWords', word_data.relatedWords)
  return (
    <Card
      ref={cardRef}
      as={"article"}
      aria-label="word card"
      role="article"
      isBlurred
      className="border border-border rounded-sm p-2 w-full"
      classNames={{
        base: ["p-2"]
      }}
    >
      <CardHeader className="w-full flex flex-col items-start">
        <div className="flex w-full items-center gap-4">
          <Button className="bg-transparent mr-auto" isIconOnly isDisabled> {/* TODO: add voice to word */}
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <SaveWord word_data={word_data} isSavedWord={!session ? false : undefined} />
          <Button disableRipple isIconOnly className="bg-transparent" onPress={(e) => {
            handleCameraPress();
          }}>
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Button disableRipple isIconOnly className="bg-transparent" onPress={() => handleSharePress()}>
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>

        </div>
        <div className="w-full flex items-center justify-between">
          <div className="w-full flex items-center gap-2">
            <div className="flex items-baseline gap-2">
              {word_data.prefix && (
                <span className="text-fs-0">
                  <span aria-label="word prefix">{word_data.prefix}</span>
                  <span aria-hidden>- </span>
                </span>
              )}
              <h2 className="text-fs-2 md:text-fs-3 text-start break-words hyphens-auto">
                {word_data.word_name}
              </h2>
              {word_data.suffix && (
                <span className="text-fs-0">
                  <span aria-hidden> -</span>
                  <span aria-label="word-suffix">{word_data.suffix}</span>
                </span>
              )}

              {/* Phonetic pronunciation inline with word */}
              {word_data.phonetic && (
                <span className="text-muted-foreground text-fs-0 italic">
                  <span aria-label="word-phonetic">[{word_data.phonetic}]</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          {/* Root information section */}
          {word_data.root?.root && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium mr-2">{t("Root")}:</span>
              <span>
                <span className="text-fs--1 font-medium">{word_data.root?.root}</span>
                {word_data.root?.[`language_${locale}`] && (
                  <span className="ml-1 text-fs--2">
                    ({word_data.root?.[`language_${locale}`]})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Word attributes section */}
          {word_data.attributes && word_data.attributes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {word_data.attributes.map((attribute) => (
                <Chip
                  key={attribute.attribute_id}
                  size="sm"
                  variant="solid"
                  className="flex rounded-lg dark:text-primary-50 bg-primary-100 dark:bg-primary/50"
                >
                  {attribute.attribute}
                </Chip>
              ))}
            </div>
          )}
        </div>


      </CardHeader>
      <CardBody>
        <>
          <Tabs disableAnimation classNames={{
            tabList: "w-full dark:bg-card ",
            tabContent: "text-primary md:w-full",
          }}>
            <Tab value={"meaning"} title={t("Meanings")} >
              {word_data.meanings && word_data.meanings.length > 0 ? (
                <ul className="grid gap-2">
                  {word_data.meanings.map((meaning, index) => (
                    <li key={meaning.meaning_id} className="grid gap-1">
                      {(meaning.part_of_speech || (meaning.attributes && meaning.attributes.length > 0)) && (
                        <div className="flex gap-2 items-center">
                          <Divider orientation="vertical" className="w-[2px] bg-primary h-5" />
                          <p className="my-auto">
                            {meaning.part_of_speech}
                            {meaning.attributes && meaning.attributes.length > 0 && (
                              <>
                                {meaning.part_of_speech ? ", " : ""}
                                {meaning.attributes.map(attr => attr.attribute).join(", ")}
                              </>
                            )}
                          </p>
                        </div>
                      )}
                      <></>
                      <div className='flex flex-col md:flex-row gap-4'>
                        <div className={clsx('w-full', {
                          'md:w-2/3': meaning.imageUrl
                        })}>
                          {meaning.meaning.search('Bakınız: ') === -1 ? (
                            <>
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
                            </>
                          ) : (
                            <p>
                              {locale === "en" ? "See Also: " : "Bakınız: "}
                              <NextUILink
                                href={`/search/${meaning.meaning.split('Bakınız: ')[1]}`}
                                as={Link}
                                size="lg"
                                showAnchorIcon
                                underline="always"
                              >
                                {meaning.meaning.split('Bakınız: ')[1]}
                              </NextUILink>
                            </p>
                          )}
                        </div>
                        {meaning.imageUrl && (
                          <div className="md:w-1/3 h-auto rounded-md overflow-hidden">

                            <Image
                              src={meaning.imageUrl}
                              alt={meaning.meaning}
                              width={300}
                              height={200}
                              className="w-full h-auto object-cover rounded-md"
                            />
                          </div>
                        )}
                      </div>

                      {/* do not render a divider after the last meaning. */}
                      {index === word_data.meanings.length - 1 ? null : <Divider />}
                    </li>
                  ))}
                </ul>
              ) : (
                // Handle navigation-only words (words with no meanings but with related words)
                <div className="p-4 border border-primary/20 rounded-md bg-primary/5">
                  {word_data.relatedWords && word_data.relatedWords.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-fs-1">{t("NavigationWord")}</p>
                      <div className="flex flex-wrap gap-2">
                        {word_data.relatedWords.filter((related) => related.relation_type !== "relatedWord" && related.relation_type !== "compoundWord").map((related) => (
                          <NextUILink
                            key={related.related_word_id}
                            as={Link}
                            href={`/search/${related.related_word_name}`}
                            className="px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                          >
                            {related.related_word_name}
                            {related.relation_type && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({t(related.relation_type)})
                              </span>
                            )}
                          </NextUILink>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>{t("NoMeaningsFound")}</p>
                    </div>
                  )}
                </div>
              )}
            </Tab>
            <Tab value={"related_words"} title={t("RelatedWords")}>
              {word_data.relatedWords && word_data.relatedWords.length > 0 ? (
                <div className="p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {word_data.relatedWords.map((related_word) => (
                      <Card key={related_word.related_word_id}>
                        <CardBody className="flex flex-row items-center justify-between">
                          <NextUILink
                            as={Link}
                            href={`/search/${related_word.related_word_name}`}
                          >
                            {related_word.related_word_name}
                            {related_word.relation_type && related_word.relation_type !== 'relatedWord' && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({t(related_word.relation_type) || related_word.relation_type})
                              </span>
                            )}
                          </NextUILink>

                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>{t("NoRelatedWordsFound") || "No related words found"}</p>
                </div>
              )}
            </Tab>
            <Tab value={"related_phrases"} title={t("RelatedPhrases")}>
              {word_data.relatedPhrases && word_data.relatedPhrases.length > 0 ? (
                <div className="p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {word_data.relatedPhrases.map((related_phrase) => (
                      <Card key={related_phrase.related_phrase_id}>
                        <CardBody>
                          <NextUILink
                            as={Link}
                            href={`/search/${related_phrase.related_phrase}`}
                          >
                            {related_phrase.related_phrase}
                          </NextUILink>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>{t("NoRelatedPhrasesFound") || "No related phrases found"}</p>
                </div>
              )}
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
        <Modal size="3xl" scrollBehavior="inside" backdrop="opaque" isOpen={isOpen} onOpenChange={onOpenChange}>
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
                    <Tab value={"related_words"} title={tRequests("RelatedWordsTabTitle")}>
                      <RelatedWordsEditTabContent
                        relatedWords={word_data.relatedWords?.map(rw => ({
                          id: rw.related_word_id,
                          related_word: {
                            id: rw.related_word_id,
                            word: rw.related_word_name,
                          },
                          relation_type: rw.relation_type || '',
                        })) || []}
                        onOpenEditModal={(relatedWordId, relationType) => {
                          const wordToEdit = word_data.relatedWords?.find(rw => rw.related_word_id === relatedWordId);
                          if (wordToEdit) {
                            setSelectedRelatedWord({
                              id: wordToEdit.related_word_id,
                              related_word_id: wordToEdit.related_word_id,
                              related_word_name: wordToEdit.related_word_name,
                              relation_type: relationType,
                            });
                            onEditRelOpen();
                          }
                        }}
                        onOpenDeleteModal={(relationshipId, relatedWordName) => {
                          const wordToDelete = word_data.relatedWords?.find(rw => rw.related_word_id === relationshipId);
                          if (wordToDelete) {
                            setSelectedRelatedWord({
                              id: relationshipId,
                              related_word_id: wordToDelete.related_word_id,
                              related_word_name: relatedWordName,
                              relation_type: wordToDelete.relation_type,
                            });
                            onDeleteRelOpen();
                          }
                        }}
                        currentWordId={word_data.word_id}
                        session={session}
                      />
                    </Tab>
                    <Tab value={"related_phrases"} title={tRequests("RelatedPhrasesTabTitle")}>
                      <RelatedPhrasesEditTabContent
                        currentWordId={word_data.word_id}
                        relatedPhrases={word_data.relatedPhrases || []}
                        session={session}
                      // Pass phrase edit/delete handlers when ready
                      />
                    </Tab>
                  </Tabs>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    {t('Close')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </CardFooter>

      {/* Related Word Edit Modal */}
      {selectedRelatedWord && (
        <RelatedWordEditRequestModal
          isOpen={isEditRelOpen}
          onClose={() => {
            onEditRelClose();
            setSelectedRelatedWord(null);
          }}
          wordId={word_data.word_id}
          relatedWord={selectedRelatedWord}
          session={session}
        />
      )}

      {/* Related Word Delete Modal */}
      {selectedRelatedWord && (
        <RelatedWordDeleteRequestModal
          isOpen={isDeleteRelOpen}
          onClose={() => {
            onDeleteRelClose();
            setSelectedRelatedWord(null);
          }}
          wordId={word_data.word_id}
          relatedWord={selectedRelatedWord}
          session={session}
        />
      )}
    </Card>
  );
}
