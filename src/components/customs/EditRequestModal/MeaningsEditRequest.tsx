"use client"
import { Button } from "@heroui/button"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/src/trpc/react"
import { toast } from "sonner"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { PencilIcon, TrashIcon } from "lucide-react"
import { Select, SelectItem } from "@heroui/select"
import { Textarea } from "@heroui/input"
import React from "react"
import MeaningAttributesInput from "./Meanings/meaning-attributes-input"
import MeaningAuthorInput from "./Meanings/meaning-author-input"
const meaningSchema = z.object({
  meaning_id: z.number(),
  meaning: z.string().min(1, "Meaning is required"),
  part_of_speech_id: z.string().min(1, "Part of speech is required"),
  attributes: z.array(z.string()).optional(),
  sentence: z.string().optional(),
  author_id: z.string().optional(),
  reason: z.string().min(1, "Reason is required"),
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
  part_of_speech: string;
  part_of_speech_id: number;
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

  const requestEditMeaning = api.request.requestEditMeaning.useMutation({
    onSuccess: () => {
      toast.success("Edit request submitted successfully")
      setEditingIndex(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit edit request")
    },
  })

  const handleEdit = (index: number) => {
    setEditingIndex(index)
  }

  const handleDelete = async (meaningId: number) => {
    try {
      // TODO: Implement request creation for deletion
      toast.success("Delete request submitted successfully")
    } catch (error) {
      toast.error("Failed to submit delete request")
    }
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
          onDelete={() => handleDelete(meaning.meaning_id)}
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
  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    watch
  } = useForm<MeaningEditRequestForm>({
    resolver: zodResolver(meaningSchema),
    defaultValues: {
      meaning_id: meaning.meaning_id,
      meaning: meaning.meaning,
      part_of_speech_id: meaning.part_of_speech_id.toString(),
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
      toast.error("No changes found")
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
              if (Array.isArray(data[key])) {
                value = data[key].map(attr => parseInt(attr));
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
        <span className="font-semibold">Meaning {index + 1}</span>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <Button
                isIconOnly
                variant="light"
                onPress={onEdit}
              >
                <PencilIcon className="h-4 w-4" />
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
                  label="Meaning"
                  placeholder="Enter meaning"
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
                  label="Example Sentence"
                  placeholder="Enter example sentence"
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
                  label="Reason for Change"
                  placeholder="Please explain why you want to make these changes"
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
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p>{meaning.meaning}</p>
            <p className="text-sm text-gray-500">
              Part of Speech: {meaning.part_of_speech}
            </p>
            {meaning.sentence && (
              <p className="text-sm italic">
                Example: {meaning.sentence}
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
