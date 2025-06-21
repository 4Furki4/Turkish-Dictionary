"use client";

import React from "react";
import { Card, CardBody, Button, useDisclosure } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Link as NextIntlLink } from "@/src/i18n/routing";
import { Plus, Search, BookOpen } from "lucide-react";
import SimpleWordRequestModal from "./modals/simple-word-request-modal";
import { Session } from "next-auth";

interface WordNotFoundCardProps {
  wordName: string;
  locale: "en" | "tr";
  session: Session | null;
}

export default function WordNotFoundCard({ wordName, locale, session }: WordNotFoundCardProps) {
  const t = useTranslations("WordNotFound");
  const tCommon = useTranslations("Common");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Card className="border-2 border-dashed border-default-300 bg-default-50/50 p-0" classNames={{
        base: "p-0",
      }}>
        <CardBody className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-default-100">
              <Search className="w-8 h-8 text-default-400" />
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-default-700">
              {t("title")}
            </h2>
            <p className="text-lg text-default-600">
              {t("searchedWord")}: <span className="font-medium text-primary">&ldquo;{wordName}&rdquo;</span>
            </p>
            <p className="text-default-500">
              {t("description")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              color="primary"
              variant="solid"
              onPress={onOpen}
              startContent={<Plus className="w-4 h-4" />}
              size="lg"
              className="min-w-48"
            >
              {t("requestWord")}
            </Button>

            <NextIntlLink
              href={`/contribute-word?word=${encodeURIComponent(wordName)}` as any}
              locale={locale}
            >
              <Button
                color="secondary"
                variant="bordered"
                startContent={<BookOpen className="w-4 h-4" />}
                size="lg"
                className="min-w-48"
              >
                {t("addDetailedEntry")}
              </Button>
            </NextIntlLink>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-default-200">
            <p className="text-sm text-default-400">
              {t("helpText")}
            </p>
          </div>

          {/* Back to Search Link */}
          <div className="text-center">
            <NextIntlLink
              href="/"
              locale={locale}
              className="text-default-500 hover:text-primary text-sm inline-flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              {t("backToSearch")}
            </NextIntlLink>
          </div>
        </CardBody>
      </Card>

      {/* Simple Word Request Modal */}
      <SimpleWordRequestModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        wordName={wordName}
        locale={locale}
      />
    </>
  );
}
