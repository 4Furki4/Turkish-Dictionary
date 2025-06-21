"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "sonner";
import { Link as NextIntlLink } from "@/src/i18n/routing";
import { Plus, ExternalLink } from "lucide-react";

interface SimpleWordRequestModalProps {
  wordName: string;
  locale: "en" | "tr";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SimpleWordRequestModal({
  wordName,
  locale,
  isOpen,
  onOpenChange,
}: SimpleWordRequestModalProps) {
  const t = useTranslations("SimpleWordRequest");
  const tCommon = useTranslations("Common");
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createSimpleRequestMutation = api.request.createSimpleWordRequest.useMutation({
    onSuccess: () => {
      toast.success(t("requestSubmitted"));
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.message === "captchaFailed") {
        toast.error(t("captchaFailed"));
      } else if (error.message === "wordAlreadyRequested") {
        toast.error(t("wordAlreadyRequested"));
      } else {
        toast.error(t("requestFailed"));
      }
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmitRequest = async () => {
    if (!executeRecaptcha) {
      toast.error(t("captchaNotReady"));
      return;
    }

    setIsSubmitting(true);

    try {
      const captchaToken = await executeRecaptcha("simple_word_request");
      
      await createSimpleRequestMutation.mutateAsync({
        wordName: wordName.trim(),
        locale,
        captchaToken,
      });
    } catch (error) {
      // Error handling is done in the mutation callbacks
      console.error("Simple word request error:", error);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="md"
      backdrop="opaque"
      classNames={{
        base: "bg-background/95 backdrop-blur-md",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>{t("title")}</span>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                &ldquo;{wordName}&rdquo;
              </p>
              <p className="text-default-600">
                {t("description")}
              </p>
            </div>
            
            <div className="bg-default-100 rounded-lg p-4">
              <p className="text-sm text-default-700 mb-3">
                {t("whatHappensNext")}
              </p>
              <ul className="text-sm text-default-600 space-y-1">
                <li>• {t("step1")}</li>
                <li>• {t("step2")}</li>
                <li>• {t("step3")}</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-default-600 mb-3">
                {t("wantToAddMore")}
              </p>
              <NextIntlLink 
                href={`/contribute-word?word=${encodeURIComponent(wordName)}` as any}
                locale={locale}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-600 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {t("addDetailedEntry")}
              </NextIntlLink>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            variant="light" 
            onPress={() => onOpenChange(false)}
            isDisabled={isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmitRequest}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submitRequest")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
