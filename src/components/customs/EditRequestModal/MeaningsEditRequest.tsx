"use client"
import { Button } from "@heroui/button"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/src/trpc/react"
import { toast } from "sonner"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { PencilIcon, TrashIcon } from "lucide-react"
import { Select, SelectItem } from "@heroui/select"
import { Chip } from "@heroui/chip"
import { Textarea } from "@heroui/input"
import React from "react"
import { WordSearchResult } from "@/types"
import MeaningAttributesInput from "./Meanings/meaning-attributes-input"

const meaningSchema = z.object({
  meaning_id: z.number(),
  meaning: z.string().min(1, "Meaning is required"),
  part_of_speech_id: z.string().min(1, "Part of speech is required"),
  attributes: z.array(z.string()).optional(),
  sentence: z.string().optional(),
  author_id: z.string().optional(),
})

const meaningEditRequestSchema = z.object({
  meanings: z.array(meaningSchema)
})

export type MeaningEditRequestForm = z.infer<typeof meaningEditRequestSchema>
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

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<MeaningEditRequestForm>({
    resolver: zodResolver(meaningEditRequestSchema),
    defaultValues: {
      meanings: meanings.map(meaning => ({
        meaning_id: meaning.meaning_id,
        meaning: meaning.meaning,
        part_of_speech_id: meaning.part_of_speech_id.toString(),
        attributes: meaning.attributes?.map(at => at.attribute_id.toString()) ?? [],
        sentence: meaning.sentence ?? "",
        author_id: meaning.author_id?.toString() ?? "",
      }))
    }
  })

  const { fields } = useFieldArray({
    control,
    name: "meanings"
  })

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

  const onSubmit = async (data: MeaningEditRequestForm) => {
    if (editingIndex === null) return

    const meaningData = data.meanings[editingIndex]
    const dirtyFieldsForMeaning = (dirtyFields.meanings?.[editingIndex] ?? {}) as Record<string, boolean>

    const fieldMapping: Record<string, string> = {
      meaning: 'meaning',
      part_of_speech_id: 'part_of_speech_id',
      sentence: 'sentence',
      attributes: 'attributes',
      author_id: 'author_id'
    }

    const preparedData = {
      meaning_id: meaningData.meaning_id,
      ...Object.keys(dirtyFieldsForMeaning).reduce<Record<string, unknown>>((acc, key) => {
        if (dirtyFieldsForMeaning[key]) {
          const mappedKey = fieldMapping[key] || key
          const value = key === 'part_of_speech_id' ? parseInt(meaningData[key])
            : key === 'attributes' ? (meaningData.attributes?.map(attr => parseInt(attr)) ?? [])
              : meaningData[key as keyof typeof meaningData]
          acc[mappedKey] = value
        }
        return acc
      }, {})
    }

    if (Object.keys(dirtyFieldsForMeaning).length === 0) {
      toast.error("No changes found")
      return
    }

    try {
      await requestEditMeaning.mutateAsync(preparedData)
    } catch (error) {
      // Error is handled by the mutation error callback
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="w-full">
            <CardHeader className="flex flex-row justify-between items-center">
              <span className="font-semibold">Meaning {index + 1}</span>
              <div className="flex space-x-2">
                <Button
                  isIconOnly
                  color="primary"
                  variant="light"
                  onPress={() => handleEdit(index)}
                >
                  <PencilIcon size={18} />
                </Button>
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  onPress={() => handleDelete(field.meaning_id)}
                >
                  <TrashIcon size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {editingIndex === index ? (
                <div className="space-y-4">
                  <Controller
                    name={`meanings.${index}.meaning`}
                    control={control}
                    render={({ field: meaningField, fieldState: { error } }) => (
                      <Textarea
                        {...meaningField}
                        label="Meaning"
                        placeholder="Enter meaning"
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />

                  <Controller
                    name={`meanings.${index}.part_of_speech_id`}
                    control={control}
                    render={({ field: posField, fieldState: { error } }) => (
                      <Select
                        items={partOfSpeeches || []}
                        isLoading={partOfSpeechesIsLoading}
                        label="Part of Speech"
                        placeholder="Select part of speech"
                        selectedKeys={posField.value ? [posField.value] : []}
                        onChange={(e) => posField.onChange(e.target.value)}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                        className="w-full"
                      >
                        {(pos) => (
                          <SelectItem key={pos.id.toString()} value={pos.id.toString()}>
                            {pos.partOfSpeech}
                          </SelectItem>
                        )}
                      </Select>
                    )}
                  />

                  {/* <Controller
                    name={`meanings.${index}.attributes`}
                    control={control}
                    render={({ field: attrField }) => (
                      <Select
                        items={meaningAttributes || []}
                        isLoading={meaningAttributesIsLoading}
                        label="Attributes"
                        placeholder="Select attributes"
                        selectionMode="multiple"
                        selectedKeys={attrField.value || []}
                        onChange={(e) => attrField.onChange(Array.from(e.target.selectedKeys))}
                        className="w-full"
                      >
                        {(attr) => (
                          <SelectItem key={attr.id.toString()} value={attr.id.toString()}>
                            {attr.attribute}
                          </SelectItem>
                        )}
                      </Select>
                    )}
                  /> */}
                  <MeaningAttributesInput
                    control={control}
                    meaningAttributes={meaningAttributes || []}
                    meaningAttributesIsLoading={meaningAttributesIsLoading}
                    setFieldValue={setValue}
                    selectedAttributes={field.attributes || []}
                    index={index}

                  />

                  <Controller
                    name={`meanings.${index}.sentence`}
                    control={control}
                    render={({ field: sentenceField, fieldState: { error } }) => (
                      <Textarea
                        {...sentenceField}
                        label="Example Sentence"
                        placeholder="Enter example sentence"
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      color="danger"
                      variant="light"
                      onPress={() => setEditingIndex(null)}
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
                </div>
              ) : (
                <>
                  <p>{field.meaning}</p>
                  <p className="text-sm text-gray-500">
                    Part of Speech: {meanings[index].part_of_speech}
                  </p>
                  {field.sentence && (
                    <p className="text-sm italic">
                      Example: {field.sentence}
                    </p>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        ))}
      </form>
    </div>
  )
}
