"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button, Modal, ModalContent, useDisclosure } from "@heroui/react";
import Loading from "@/app/[locale]/(search)/search/_loading";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import WordCard from "./word-card";
import { Session } from "next-auth";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
interface SavedWordCardProps {
  wordData: {
    word_id: number;
    word_name: string;
    saved_at: string;
    attributes?: unknown;
    root: { root: string; language: string };
  };
  onUnsave: () => void;
  session: Session | null;
  locale: "en" | "tr";
}

export default function SavedWordCard({ wordData, onUnsave, session, locale }: SavedWordCardProps) {
  const t = useTranslations("SavedWords.Card");
  const { isOpen, onOpenChange } = useDisclosure();

  const { data: details, isLoading: loadingDetails } = api.word.getWord.useQuery(
    wordData.word_name,
    { enabled: isOpen }
  );

  const fullData = details?.[0];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <h3 className="text-lg font-medium">{wordData.word_name}</h3>
        {wordData.root?.root && (
          <p className="text-sm text-gray-500">
            {wordData.root.root} ({wordData.root.language})
          </p>
        )}
      </CardHeader>
      <CardBody>
        <p className="text-sm">
          {t("savedAt")}:{" "}
          {formatDistanceToNow(new Date(wordData.saved_at), {
            addSuffix: true,
            locale: locale === 'tr' ? tr : undefined
          })}
        </p>
      </CardBody>
      <CardFooter className="flex justify-between">
        <Button onPress={onOpenChange} size="sm">
          {t("view")}
        </Button>
        <Button onPress={onUnsave} color="danger" size="sm">
          {t("unsave")}
        </Button>
      </CardFooter>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" backdrop="blur">
        <ModalContent>
          {loadingDetails ? (
            <Loading />
          ) : fullData ? (
            <WordCard word={fullData} session={session} locale={locale} isSavedWord />
          ) : null}
        </ModalContent>
      </Modal>
    </Card>
  );
}
