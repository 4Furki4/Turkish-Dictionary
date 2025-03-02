"use client"
import { Button } from "@heroui/button"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/src/trpc/react"
import { toast } from "sonner"
import { Input } from "@heroui/input"
import { Autocomplete, AutocompleteItem } from "@heroui/react"
import { Textarea } from "@heroui/input"
import { WordSearchResult } from "@/types"
import WordAttributesRequestInput from "./word/word-attributes-request-input"

const wordEditRequestSchema = z.object({
  language: z.string().optional(),
  name: z.string().min(1, "Word name is required"),
  phonetic: z.string().optional(),
  prefix: z.string().optional(),
  root: z.string().optional(),
  suffix: z.string().optional(),
  attributes: z.array(z.string()).optional(),
  reason: z.string().min(1, "Reason is required"),
})

export type WordEditRequestForm = z.infer<typeof wordEditRequestSchema>

export default function WordEditRequest({
  data: { word_data },
}: {
  data: WordSearchResult
}) {
  const { data: languages, isLoading: languagesIsLoading } = api.params.getLanguages.useQuery()
  const { data: wordAttributesWithRequested, isLoading: wordAttributesWithRequestedIsLoading } = api.request.getWordAttributesWithRequested.useQuery()
  const { mutate, isPending } = api.request.requestEditWord.useMutation({
    onSuccess: () => {
      toast.success("Edit request submitted successfully")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },

  } = useForm<WordEditRequestForm>({
    resolver: zodResolver(wordEditRequestSchema),
    defaultValues: {
      name: word_data.word_name,
      phonetic: word_data.phonetic ?? "",
      prefix: word_data.prefix ?? "",
      suffix: word_data.suffix ?? "",
      root: word_data.root.root ?? "",
      attributes: word_data.attributes?.map((at) => at.attribute_id.toString()) ?? [],
      language: word_data.root.language_code ?? "",
      reason: "",
    },
  })

  const onSubmit = async (data: WordEditRequestForm) => {
    console.log("data", data)
    const preparedData = {
      word_id: word_data.word_id,
      reason: data.reason,
      ...Object.keys(dirtyFields).reduce<Record<string, unknown>>((acc, key) => {
        if (dirtyFields[key as keyof typeof dirtyFields] && key !== 'reason') {
          acc[key] = data[key as keyof typeof data];
        }
        return acc;
      }, {})
    }
    if (Object.keys(dirtyFields).length === 0) {
      toast.error("No changes found")
      return
    }
    mutate(preparedData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label="Word Name"
            labelPlacement="outside"
            placeholder="Enter word name"
            isInvalid={!!error}
            errorMessage={error?.message}
          />
        )}
      />



      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="prefix"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Prefix"
              labelPlacement="outside"
              placeholder="Enter prefix"
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />
        <Controller
          name="suffix"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Suffix"
              labelPlacement="outside"
              placeholder="Enter suffix"
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <Controller
          name="language"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              radius='sm'
              {...field}
              label="Language"
              isLoading={languagesIsLoading}
              labelPlacement='outside'
              defaultItems={languages || []}
              placeholder="Select Language"
              defaultSelectedKey={word_data.root.language_code}
              onSelectionChange={(item) => {
                field.onChange(item);
                setValue("language", item as string)
              }}
              isInvalid={error !== undefined}
              errorMessage={error?.message}
            >
              {(language) => (
                <AutocompleteItem key={language.language_code} value={language.language_code}>
                  {language.language_en}
                  {/* TODO: i18n needed */}
                </AutocompleteItem>
              )}
            </Autocomplete>
          )}
        />

        <Controller
          name="root"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Root"
              labelPlacement="outside"
              placeholder="Enter root"
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <WordAttributesRequestInput
          wordAttributes={wordAttributesWithRequested}
          wordAttributesIsLoading={wordAttributesWithRequestedIsLoading}
          control={control}
        />
        <Controller
          name="phonetic"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Phonetic"
              labelPlacement="outside"
              placeholder="Enter phonetic"
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />
      </div>

      <Controller
        name="reason"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Textarea
            {...field}
            label="Reason for Change"
            placeholder="Please explain why you want to make these changes"
            labelPlacement="outside"
            isInvalid={!!error}
            errorMessage={error?.message}
            className="w-full"
          />
        )}
      />

      <div className="flex justify-end space-x-2">
        <Button color="secondary" variant="flat" type="submit">
          Submit Request
        </Button>
      </div>
    </form>
  )
}
