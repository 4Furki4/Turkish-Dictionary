"use client";

import React from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@heroui/react";
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

// Placeholder relation types - these should ideally come from a shared source or API
const RELATION_TYPES = [
  { key: "synonym", labelKey: "synonym" },
  { key: "antonym", labelKey: "antonym" },
  { key: "relatedWord", labelKey: "relatedWord" }, // General related
  { key: "seeAlso", labelKey: "seeAlso" },
  { key: "compoundWord", labelKey: "compoundWord" },
  { key: "turkishEquivalent", labelKey: "turkishEquivalent" },
];

const editRequestSchema = z.object({
  newRelationType: z.string().min(1, "New relation type is required"),
  reason: z.string().optional(),
});

type EditRequestForm = z.infer<typeof editRequestSchema>;

interface RelatedWordEditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordId: number; // ID of the main word
  relatedWord: RelatedWordItemType;
  session: Session | null;
}

export default function RelatedWordEditRequestModal({
  isOpen,
  onClose,
  wordId,
  relatedWord,
  session,
}: RelatedWordEditRequestModalProps) {
  const t = useTranslations(); // Generic for now
  const tRequests = useTranslations("Requests");
  const tRelationTypes = useTranslations("RelationTypes");

  const { mutate, isPending } = api.request.requestEditRelatedWord.useMutation({
    onSuccess: () => {
      toast.success(tRequests("EditRequestSubmittedSuccessfully"));
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || tRequests("FailedToSubmitEditRequest"));
    },
  });

  const { control, handleSubmit, reset, setValue } = useForm<EditRequestForm>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      newRelationType: relatedWord?.relation_type || "",
      reason: "",
    },
  });

  const onSubmit = (data: EditRequestForm) => {
    if (!session?.user) {
      toast.error(t("Errors.MustBeLoggedIn"));
      return;
    }
    if (!relatedWord?.relation_type) {
      toast.error(t("Errors.OriginalRelationTypeMissing")); // New error key
      return;
    }
    mutate({
      wordId: wordId,
      relatedWordId: relatedWord.related_word_id,
      newRelationType: data.newRelationType,
      originalRelationType: relatedWord.relation_type, // Pass original for the backend handler
      reason: data.reason,
    });
  };

  React.useEffect(() => {
    if (isOpen && relatedWord) {
      reset({
        newRelationType: relatedWord.relation_type || "",
        reason: "",
      });
    } else if (!isOpen) {
      reset({ newRelationType: "", reason: "" }); // Clear form when closed
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  }, [isOpen, relatedWord, reset]);

  if (!relatedWord) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="xl">
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            {t("WordCard.SuggestEditForRelatedWordHeader", { relatedWordName: relatedWord.related_word_name })}
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                {tRequests("CurrentRelationTypeIs", { relationType: tRelationTypes(relatedWord.relation_type || "unknown") })}
              </p>
            </div>
            <Controller
              name="newRelationType"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  {...field}
                  label={tRequests("EditRelationTypeLabel")}
                  placeholder={tRequests("SelectRelationTypePlaceholder")}
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(key) => setValue("newRelationType", key as string)} // Assuming key is string for single select
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  aria-label={tRequests("EditRelationTypeLabel")}
                >
                  {RELATION_TYPES.map((type) => (
                    <SelectItem key={type.key}>
                      {tRelationTypes(type.labelKey)}
                    </SelectItem>
                  ))}
                </Select>
              )}
            />
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  label={tRequests("ReasonOptional")}
                  placeholder={tRequests("ReasonPlaceholderEditRelated")}
                  minRows={3}
                />
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} type="button">
              {t("Dashboard.Announcements.cancel")}
            </Button>
            <Button color="primary" type="submit" isLoading={isPending}>
              {t("WordCard.SubmitRequest")}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
