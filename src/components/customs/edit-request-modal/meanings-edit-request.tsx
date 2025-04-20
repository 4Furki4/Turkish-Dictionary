"use client"
import { Button } from "@heroui/button"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/src/trpc/react"
import { toast } from "sonner"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { PencilIcon, TrashIcon } from "lucide-react"
import { Textarea } from "@heroui/input"
import React from "react"
import MeaningAttributesInput from "./meanings/meaning-attributes-input"
import MeaningAuthorInput from "./meanings/meaning-author-input"
import PartOfSpeechInput from "./meanings/part-of-speech-input"
import DeleteMeaningModal from "./delete-meaning-modal"
import { useTranslations } from "next-intl"
const meaningSchema = z.object({
  meaning_id: z.number(),
  meaning: z.string().min(1, "Meaning is required"),
  part_of_speech_id: z.string().min(1, "Part of speech is required"),
  attributes: z.array(z.string()).optional(),
  sentence: z.string().optional(),
  author_id: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
})

const getMeaningIntlSchema = (meaningRequired: string, partOfSpeechRequired: string, reasonRequired: string) => z.object({
  meaning_id: z.number(),
  meaning: z.string().min(1, meaningRequired),
  part_of_speech_id: z.string().min(1, partOfSpeechRequired),
  attributes: z.array(z.string()).optional(),
  sentence: z.string().optional(),
  author_id: z.string().optional(),
  reason: z.string().min(1, reasonRequired),
})

export type MeaningEditRequestForm = z.infer<typeof meaningSchema>

// Type for the submitted data which makes all fields optional except meaning_id and reason
type MeaningEditSubmitData = {
  meaning_id: number;
  reason: string;
  meaning?: string;
  part_of_speech_id?: number;
  attributes?: number[];
  sentence?: string;
  author_id?: number;
}

type Meaning = {
  meaning_id: number;
  meaning: string;
  part_of_speech?: string;
  part_of_speech_id?: number;
  sentence: string | undefined;
  author: string | undefined;
  author_id: number | undefined;
  attributes?: [{
    attribute_id: number;
    attribute: string;
  }];
}
export default function MeaningsEditRequest({
  meanings,
}: {
  meanings: Meaning[]
}) {
  const { data: meaningAttributes, isLoading: meaningAttributesIsLoading } = api.params.getMeaningAttributes.useQuery()
  const { data: partOfSpeeches, isLoading: partOfSpeechesIsLoading } = api.params.getPartOfSpeeches.useQuery()
  const { data: authors, isLoading: authorsIsLoading } = api.params.getExampleSentenceAuthors.useQuery()
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [deletingMeaning, setDeletingMeaning] = React.useState<Meaning | null>(null)
  const t = useTranslations()
  const requestEditMeaning = api.request.requestEditMeaning.useMutation({
    onSuccess: () => {
      toast.success(t("Requests.EditRequestSubmittedSuccessfully"))
      setEditingIndex(null)
    },
    onError: (error) => {
      toast.error(error.message || t("Requests.FailedToSubmitEditRequest"))
    },
  })

  const requestDeleteMeaning = api.request.requestDeleteMeaning.useMutation({
    onSuccess: () => {
      toast.success(t("Requests.DeleteRequestSubmittedSuccessfully"))
      setDeletingMeaning(null)
    },
    onError: (error) => {
      toast.error(error.message || t("Requests.FailedToSubmitDeleteRequest"))
    },
  })

  const handleDelete = async (meaning: Meaning) => {
    setDeletingMeaning(meaning)
  }

  const handleDeleteConfirm = async (reason: string) => {
    try {
      await requestDeleteMeaning.mutateAsync({
        meaning_id: deletingMeaning!.meaning_id,
        reason
      })
    } catch (error) {
      // Error handling is done in the mutation configuration
    }
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
  }

  return (
    <div className="space-y-4">
      {meanings.map((meaning, index) => (
        <MeaningEditRequestForm
          key={meaning.meaning_id}
          meaning={meaning}
          index={index}
          isEditing={editingIndex === index}
          onEdit={() => handleEdit(index)}
          onDelete={() => handleDelete(meaning)}
          onCancel={() => setEditingIndex(null)}
          meaningAttributes={meaningAttributes}
          meaningAttributesIsLoading={meaningAttributesIsLoading}
          partOfSpeeches={partOfSpeeches}
          partOfSpeechesIsLoading={partOfSpeechesIsLoading}
          authors={authors}
          authorsIsLoading={authorsIsLoading}
          onSubmit={async (data) => {
            const { meaning_id, reason, ...rest } = data;
            const preparedData: MeaningEditSubmitData = {
              meaning_id,
              reason,
              ...Object.entries(rest).reduce<Record<string, unknown>>((acc, [key, value]) => {
                if (value !== undefined && value !== "") {
                  switch (key) {
                    case 'part_of_speech_id':
                      acc[key] = parseInt(value as string);
                      break;
                    case 'attributes':
                      if (Array.isArray(value)) {
                        acc[key] = value.map(attr => parseInt(attr as unknown as string));
                      }
                      break;
                    case 'author_id':
                      acc[key] = value ? parseInt(value as string) : undefined;
                      break;
                    default:
                      acc[key] = value;
                  }
                }
                return acc;
              }, {})
            };
            await requestEditMeaning.mutateAsync(preparedData);
          }}
        />
      ))}
      <DeleteMeaningModal
        key={deletingMeaning?.meaning_id}
        isOpen={deletingMeaning !== null}
        onClose={() => setDeletingMeaning(null)}
        onConfirm={handleDeleteConfirm}
        meaning={deletingMeaning?.meaning || ""}
      />
    </div>
  )
}

function MeaningEditRequestForm({
  meaning,
  index,
  isEditing,
  onEdit,
  onDelete,
  onCancel,
  meaningAttributes,
  meaningAttributesIsLoading,
  partOfSpeeches,
  partOfSpeechesIsLoading,
  authors,
  authorsIsLoading,
  onSubmit,
}: {
  meaning: Meaning;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  meaningAttributes: {
    id: number;
    attribute: string;
  }[] | undefined;
  meaningAttributesIsLoading: boolean;
  partOfSpeeches: {
    id: number;
    partOfSpeech: string;
  }[] | undefined;
  partOfSpeechesIsLoading: boolean;
  authors: {
    id: string;
    name: string;
  }[] | undefined;
  authorsIsLoading: boolean;
  onSubmit: (data: MeaningEditSubmitData) => Promise<void>;
}) {
  const t = useTranslations()
  const {
    control,
    handleSubmit,
    formState: { dirtyFields, errors },
    watch
  } = useForm<MeaningEditRequestForm>({
    resolver: zodResolver(getMeaningIntlSchema(t("Forms.Meanings.Required"), t("Forms.PartOfSpeech.Required"), t("Requests.ReasonRequired"))),
    defaultValues: {
      meaning_id: meaning.meaning_id,
      meaning: meaning.meaning,
      part_of_speech_id: meaning.part_of_speech_id?.toString(),
      attributes: meaning.attributes?.map(at => at.attribute_id.toString()) ?? [],
      sentence: meaning.sentence ?? "",
      author_id: meaning.author_id?.toString() ?? "",
      reason: "",
    },
  })
  const onFormSubmit = handleSubmit((data) => {
    const fieldMapping: Record<string, string> = {
      meaning: 'meaning',
      part_of_speech_id: 'part_of_speech_id',
      sentence: 'sentence',
      attributes: 'attributes',
      author_id: 'author_id',
    }

    if (Object.keys(dirtyFields).length === 1 && dirtyFields.reason) {
      toast.error(t("Requests.NoChanges"))
      return
    }

    const preparedData: MeaningEditSubmitData = {
      meaning_id: data.meaning_id,
      reason: data.reason,
      ...Object.keys(dirtyFields).reduce<Record<string, unknown>>((acc, key) => {
        if (dirtyFields[key as keyof typeof dirtyFields] && key !== 'reason' && key !== 'meaning_id') {
          let value;
          switch (key) {
            case 'part_of_speech_id':
              value = parseInt(data[key]);
              break;
            case 'attributes':
              const attrValue = data[key];
              if (Array.isArray(attrValue)) {
                value = attrValue.map(attr => parseInt(attr));
              }
              break;
            case 'author_id':
              value = data.author_id ? parseInt(data.author_id) : undefined;
              break;
            default:
              value = data[key as keyof typeof data];
          }
          acc[fieldMapping[key] || key] = value;
        }
        return acc;
      }, {})
    }

    onSubmit(preparedData);
  })

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <span className="font-semibold">{t("Meaning")} {index + 1}</span>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <Button
                isIconOnly
                variant="light"
                onPress={onEdit}
              >
                <PencilIcon className="h-4 w-4 text-warning" />
              </Button>
              <Button
                isIconOnly
                color="danger"
                variant="light"
                onPress={onDelete}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {isEditing ? (
          <form onSubmit={onFormSubmit} className="space-y-4">
            <Controller
              name="meaning"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Textarea
                  {...field}
                  label={t("Meaning")}
                  placeholder={t("EnterMeaning")}
                  isInvalid={!!error}
                  errorMessage={error?.message}
                />
              )}
            />

            <PartOfSpeechInput
              control={control}
              partOfSpeeches={partOfSpeeches?.map(pos => ({ id: pos.id.toString(), partOfSpeech: pos.partOfSpeech })) || []}
              meaningPartOfSpeechIsLoading={partOfSpeechesIsLoading}
            />

            <MeaningAuthorInput
              control={control}
              meaningAuthors={authors?.map(author => ({ id: author.id.toString(), name: author.name })) || []}
              meaningAuthorsIsLoading={authorsIsLoading}
            />

            <MeaningAttributesInput
              control={control}
              meaningAttributes={meaningAttributes?.map(attr => ({ id: attr.id.toString(), attribute: attr.attribute })) || []}
              meaningAttributesIsLoading={meaningAttributesIsLoading}
            />

            <Controller
              name="sentence"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Textarea
                  {...field}
                  label={t("ExampleSentence")}
                  placeholder={t("EnterExampleSentence")}
                  isInvalid={!!error}
                  errorMessage={error?.message}
                />
              )}
            />

            <MeaningAuthorInput
              control={control}
              meaningAuthors={authors?.map(author => ({ id: author.id.toString(), name: author.name })) || []}
              meaningAuthorsIsLoading={authorsIsLoading}
            />

            <Controller
              name="reason"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Textarea
                  {...field}
                  label={t("Requests.Reason")}
                  placeholder={t("Requests.EnterReason")}
                  isInvalid={!!error}
                  errorMessage={error?.message}
                />
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                color="danger"
                variant="light"
                onPress={onCancel}
              >
                {t("Cancel")}
              </Button>
              <Button
                color="secondary"
                variant="flat"
                type="submit"
              >
                {t("Requests.SubmitRequest")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p>{meaning.meaning}</p>
            {meaning.part_of_speech ? <p className="text-sm text-gray-500">
              {t("PartOfSpeech")}: {meaning.part_of_speech}
            </p> : null
            }
            {meaning.sentence && (
              <p className="text-sm">
                {t("ExampleSentence")}: {meaning.sentence}
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
