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

interface RelatedWordItemType {
  related_word_id: number;
  related_word_name: string;
  relation_type?: string;
}

const deleteRequestSchema = z.object({
  reason: z.string().optional(),
});

type DeleteRequestForm = z.infer<typeof deleteRequestSchema>;

interface RelatedWordDeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordId: number; // ID of the main word
  relatedWord: RelatedWordItemType;
  session: Session | null; // To ensure user is logged in, though WordCard handles visibility
}

export default function RelatedWordDeleteRequestModal({
  isOpen,
  onClose,
  wordId,
  relatedWord,
  session,
}: RelatedWordDeleteRequestModalProps) {
  const t = useTranslations(); // Using generic t for now, can scope to 'WordCard' or a new 'Requests' scope
  const commonT = useTranslations("Common");

  const { mutate, isPending } = api.request.requestDeleteRelatedWord.useMutation({
    onSuccess: () => {
      toast.success(t("Requests.DeleteRequestSubmittedSuccessfully"));
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || t("Requests.ErrorSubmittingRequest"));
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
      toast.error(t("Errors.MustBeLoggedIn"));
      return;
    }
    mutate({
      wordId: wordId,
      relatedWordId: relatedWord.related_word_id,
      reason: data.reason,
    });
  };

  // Reset form when modal is closed or relatedWord changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  // biome-ignore lint/correctness/useEffectHookFormReset: <explanation>
  React.useEffect(() => {
    if (isOpen) {
      reset({ reason: "" });
    }
  }, [isOpen, reset]);

  if (!relatedWord) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="xl">
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            {t("WordCard.SuggestDeletionForRelatedWordHeader", { relatedWordName: relatedWord.related_word_name })}
          </ModalHeader>
          <ModalBody>
            <p>
              {t("Requests.ConfirmDeleteRelatedWord", { 
                relatedWordName: relatedWord.related_word_name, 
                relationType: relatedWord.relation_type || commonT("unknownRelation") 
              })}
            </p>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  label={t("Requests.ReasonOptional")}
                  placeholder={t("Requests.ReasonPlaceholderDeleteRelated")}
                  minRows={3}
                />
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} type="button">
              {t("Dashboard.Announcements.cancel")}
            </Button>
            <Button color="danger" type="submit" isLoading={isPending}>
              {t("WordCard.RequestDeletion")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
