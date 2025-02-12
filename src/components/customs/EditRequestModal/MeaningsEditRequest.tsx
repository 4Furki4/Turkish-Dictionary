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
import { Chip } from "@heroui/chip"
import { Textarea } from "@heroui/input"
import React from "react"
import { WordSearchResult } from "@/types"

const meaningEditRequestSchema = z.object({
  meaning: z.string().min(1, "Meaning is required"),
  partOfSpeechId: z.string().min(1, "Part of speech is required"),
  attributes: z.array(z.string()).optional(),
  exampleSentence: z.string().optional(),
  authorId: z.string().optional(),
})

type MeaningEditRequestForm = z.infer<typeof meaningEditRequestSchema>
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
  const [selectedMeaning, setSelectedMeaning] = React.useState<any | null>(null)
  const [showForm, setShowForm] = React.useState(false)
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MeaningEditRequestForm>({
    resolver: zodResolver(meaningEditRequestSchema),
  })

  const handleEdit = (meaning: Meaning) => {
    setSelectedMeaning(meaning)
    setShowForm(true)
    reset({
      meaning: meaning.meaning,
      partOfSpeechId: meaning.part_of_speech_id.toString(),
      attributes: meaning.attributes?.map((at) => at.attribute_id.toString()) ?? [],
      exampleSentence: meaning.sentence ?? "",
      authorId: meaning.author_id?.toString() ?? "",
    })
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
    try {
      // TODO: Implement request creation for edit
      toast.success("Edit request submitted successfully")
      setShowForm(false)
      setSelectedMeaning(null)
    } catch (error) {
      toast.error("Failed to submit edit request")
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        meanings.map((meaning, index) => (
          <Card key={meaning.meaning_id} className="w-full">
            <CardHeader className="flex flex-row justify-between items-center">
              <span className="font-semibold">Meaning {index + 1}</span>
              <div className="flex space-x-2">
                <Button
                  isIconOnly
                  color="primary"
                  variant="light"
                  onPress={() => handleEdit(meaning)}
                >
                  <PencilIcon size={18} />
                </Button>
                <Button
                  isIconOnly
                  color="danger"
                  variant="light"
                  onPress={() => handleDelete(meaning.meaning_id)}
                >
                  <TrashIcon size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <p>{meaning.meaning}</p>
              <p className="text-sm text-gray-500">
                Part of Speech: {meaning.part_of_speech}
              </p>
              {meaning.sentence && (
                <p className="text-sm italic">
                  Example: {meaning.sentence}
                </p>
              )}
            </CardBody>
          </Card>
        ))
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <Controller
            name="partOfSpeechId"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                items={partOfSpeeches || []}
                isLoading={partOfSpeechesIsLoading}
                label="Part of Speech"
                placeholder="Select part of speech"
                selectedKeys={field.value ? [field.value] : []}
                onChange={(e) => field.onChange(e.target.value)}
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

          <Controller
            name="attributes"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                items={meaningAttributes || []}
                label="Attributes"
                placeholder="Select attributes"
                selectionMode="multiple"
                isLoading={meaningAttributesIsLoading}
                selectedKeys={field.value}
                onChange={(e) => field.onChange(Array.from(e.target.value))}
                isInvalid={!!error}
                errorMessage={error?.message}
                className="w-full"
              >
                {(attr) => (
                  <SelectItem key={attr.id.toString()} value={attr.id.toString()}>
                    {attr.attribute}
                  </SelectItem>
                )}
              </Select>
            )}
          />

          <Controller
            name="exampleSentence"
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

          <Controller
            name="authorId"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                isLoading={authorsIsLoading}
                items={authors || []}
                label="Author"
                placeholder="Select author"
                selectedKeys={field.value ? [field.value] : []}
                onChange={(e) => field.onChange(e.target.value)}
                isInvalid={!!error}
                errorMessage={error?.message}
                className="w-full"
              >
                {(author) => (
                  <SelectItem key={author.id.toString()} value={author.id.toString()}>
                    {author.name}
                  </SelectItem>
                )}
              </Select>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button
              color="danger"
              variant="light"
              onPress={() => {
                setShowForm(false)
                setSelectedMeaning(null)
              }}
            >
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
