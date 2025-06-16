"use client";
import React from 'react';

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Textarea } from "@heroui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/src/trpc/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Session } from "next-auth";
import { RelatedPhraseItemType } from './related-phrases-edit-tab-content';

const deleteRequestSchema = z.object({
  reason: z.string().min(1, 'ReasonRequired').min(15, 'ReasonMinLength15')
});

type DeleteRequestForm = z.infer<typeof deleteRequestSchema>;

interface RelatedPhraseDeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordId: number; // ID of the main word
  relatedPhrase: RelatedPhraseItemType;
  session: Session | null;
}

export default function RelatedPhraseDeleteRequestModal({
  isOpen,
  onClose,
  wordId,
  relatedPhrase,
  session,
}: RelatedPhraseDeleteRequestModalProps) {
  const t = useTranslations("Requests");
  const tWordCard = useTranslations("WordCard");
  const commonT = useTranslations("Common");

  const { mutate, isPending } = api.request.requestDeleteRelatedPhrase.useMutation({
    onSuccess: () => {
      toast.success(t("DeleteRequestSubmittedSuccessfully"));
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || t("ErrorSubmittingRequest"));
    },
  });

  const { control, handleSubmit, reset } = useForm<DeleteRequestForm>({
    resolver: zodResolver(deleteRequestSchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit = (data: DeleteRequestForm) => {
    if (!session?.user) {
      toast.error(commonT("Errors.MustBeLoggedIn"));
      return;
    }
    mutate({
      wordId: wordId,
      relatedPhraseId: relatedPhrase.related_phrase_id,
      reason: data.reason,
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      reset({ reason: "" });
    }
  }, [isOpen, reset]);

  if (!relatedPhrase) return null;

  return (
    <Modal motionProps={{
      variants: {
        enter: {
          opacity: 1,
          transition: {
            duration: 0.1,
            ease: 'easeInOut',
          }
        },
        exit: {
          opacity: 0,
          transition: {
            duration: 0.1,
            ease: 'easeInOut',
          }
        },
      }
    }} classNames={{
      base: "shadow-medium bg-background/40 backdrop-blur-md backdrop-saturate-150 transition-transform-background motion-reduce:transition-none border-2 border-border rounded-sm p-2 w-full",
    }} isOpen={isOpen} onOpenChange={onClose} size="xl">
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            {t("SuggestDeletionForRelatedPhraseHeader", { relatedPhraseName: relatedPhrase.related_phrase })}
          </ModalHeader>
          <ModalBody>
            <p>
              {t("ConfirmDeleteRelatedPhrase")}
            </p>
            <Controller
              name="reason"
              control={control}
              render={({ field, formState: { errors } }) => (
                <Textarea
                  {...field}
                  label={t("Reason")}
                  required
                  isRequired
                  placeholder={t("ReasonPlaceholderDeleteRelated")}
                  minRows={3}
                  errorMessage={t(errors.reason?.message as string)}
                  isInvalid={!!errors.reason}
                />
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} type="button">
              {t("buttons.cancel")}
            </Button>
            <Button color="danger" type="submit" isLoading={isPending}>
              {tWordCard("RequestDeletion")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
