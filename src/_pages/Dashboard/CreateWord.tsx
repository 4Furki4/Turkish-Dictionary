"use client";
import { MeaningInputs, WordForm, WordFormSubmit } from "@/types";
import {
  Button,
  Card,
  CardBody,
} from "@nextui-org/react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import WordNameInput from "./CreateWordForm/Inputs/Word/NameInput";
import WordPhoneticInput from "./CreateWordForm/Inputs/Word/PhoneticInput";
import WordRootLanguageInput from "./CreateWordForm/Inputs/Word/RootLanguageInput";
import WordRootOriginInput from "./CreateWordForm/Inputs/Word/RootOriginInput";
import WordPrefixInput from "./CreateWordForm/Inputs/Word/PrefixInput";
import WordSuffixInput from "./CreateWordForm/Inputs/Word/SuffixInput";
import WordMeaningInput from "./CreateWordForm/Inputs/Meaning/WordMeaningInput";
import MeaningPartOfSpeechInput from "./CreateWordForm/Inputs/Meaning/PartOfSpeechInput";
import MeaningAttributesInput from "./CreateWordForm/Inputs/Meaning/AttributesInput";
import MeaningExampleSentenceInput from "./CreateWordForm/Inputs/Meaning/ExampleSentenceInput";
import MeaningExampleAuthorInput from "./CreateWordForm/Inputs/Meaning/ExampleAuthorInput";
import MeaningImageInput from "./CreateWordForm/Inputs/Meaning/ImageInput";
import MeaningFieldArrayButtons from "./CreateWordForm/MeaningFieldArrayButtons";
import { uploadFiles } from "@/src/lib/uploadthing";
import { toast } from "sonner";
import { api } from "@/src/trpc/react";
import { PartOfSpeech } from "@/db/schema/part_of_speechs";
import WordAttributesInput from "./CreateWordForm/Inputs/Word/WordAttributes";

const meaningDefaultValues: MeaningInputs = {
  attributes: undefined,
  partOfSpeechId: undefined,
  meaning: undefined,
  image: undefined,
  example: {
    author: undefined,
    sentence: undefined,
  },
};
export default function CreateWord({ locale, meaningAttributes, authors, partOfSpeeches, wordAttributes }: {
  locale: string;
  meaningAttributes: {
    id: number;
    attribute: string;
  }[]
  authors: {
    id: number;
    name: string;
  }[]
  partOfSpeeches: {
    id: number;
    partOfSpeech: PartOfSpeech;
  }[]
  wordAttributes: {
    id: number;
    attribute: string;
  }[]
}) {
  const {
    handleSubmit,
    control,
    formState,
    clearErrors,
    watch,
    reset,
    setError,
    getFieldState,

  } = useForm<WordForm>({
    defaultValues: {
      name: '',
      language: '',
      phonetic: '',
      root: '',
      prefix: '',
      suffix: '',
      attributes: '',
      meanings: [meaningDefaultValues],
    },
    mode: "all",
  });
  const { fields, append, prepend, remove } = useFieldArray({
    name: "meanings",
    control,
    rules: {
      required: {
        value: true,
        message: "You must have a meaning",
      },
      minLength: 1,
    },
  });
  const [imagePreviewUrls, setImagePreviewUrls] = React.useState<string[]>([]);
  const wordMutation = api.admin.addWord.useMutation({
    onSuccess: () => {
      toast.success("Word created!")
    }
  });
  const [isUploading, setIsUploading] = React.useState(false);
  const onSubmit = async (data: WordForm) => {
    let { meanings } = data;
    meanings = meanings.map((meaning) => {
      return {
        ...meaning,
        partOfSpeechId: meaning.partOfSpeechId,
        example: meaning.example?.sentence && meaning.example?.sentence ? {
          sentence: meaning.example.sentence,
          author: meaning.example.author,
        } : undefined,
      }
    })
    const uploadedPictures = meanings.map(async (meaning) => {
      if (meaning.image?.[0]) {
        const files = [meaning.image[0]];
        const response = await uploadFiles(
          "imageUploader",
          {
            files,
            onUploadProgress({ file, progress }) {
              console.log(`Uploaded ${progress}% of ${file}`);
            },
            onUploadBegin({ file }) {
              console.log(`Started uploading ${file}`);
              setIsUploading(true);
            },
          }
        );
        return response[0].url;
      }
      return undefined;
    });
    let uploadedPicturesUrls: (string | undefined)[] = [];
    if (meanings.every((meaning) => typeof meaning.image === typeof FileList)) {
      const loadingToaster = toast.loading("Uploading images...");

      uploadedPicturesUrls = await Promise.all(uploadedPictures);
      setIsUploading(false);
      toast.dismiss(loadingToaster);
      toast.success("Images uploaded!");
    }
    const meaningsWithImages = meanings.map((meaning, index) => {
      return {
        ...meaning,
        image: uploadedPicturesUrls[index],
      };
    });
    const word = {
      ...data,
      meanings: meaningsWithImages,
    }
    wordMutation.mutate(word as WordFormSubmit)
    // reset();
  };

  // const meaningAttributesQuery = api.admin.getMeaningAttributes.useQuery()
  return (
    <section className="max-w-5xl mx-auto max-sm:px-4 py-4">
      <h1 className="text-center text-fs-2">Create Word</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
        <div className="grid sm:grid-cols-2 gap-2">
          <WordNameInput control={control} watch={watch} setError={setError} />
          <WordPhoneticInput control={control} />
          <WordRootLanguageInput control={control} watch={watch} setError={setError} clearErrors={clearErrors} getFieldState={getFieldState} locale={locale} />
          <WordRootOriginInput control={control} watch={watch} setError={setError} clearErrors={clearErrors} getFieldState={getFieldState} />
          <WordPrefixInput control={control} />
          <WordSuffixInput control={control} />
          <WordAttributesInput wordAttributues={wordAttributes} control={control} />
        </div>

        <div className="w-full mt-2">
          <h2 className="text-center text-fs-1">Meanings</h2>

          {fields.map((field, index) => (
            <Card key={field.id} className="mb-4 rounded-sm">
              <CardBody className="flex flex-col gap-2">
                <WordMeaningInput index={index} control={control} />
                <div className="grid sm:grid-cols-2 gap-2">
                  <MeaningPartOfSpeechInput index={index} control={control} partOfSpeeches={partOfSpeeches} />
                  <MeaningAttributesInput index={index} control={control} meaningAttributes={meaningAttributes} />
                  <MeaningExampleSentenceInput index={index} control={control} errors={formState.errors} clearErrors={clearErrors} getFieldState={getFieldState} setError={setError} watch={watch} />
                  <MeaningExampleAuthorInput index={index} control={control} defaultExampleSentenceAuthors={authors} clearErrors={clearErrors} getFieldState={getFieldState} setError={setError} watch={watch} errors={formState.errors} />
                </div>
                <div className="grid gap-2">
                  <MeaningImageInput index={index} control={control} formState={formState} clearErrors={clearErrors} field={field} setImagePreviewUrls={setImagePreviewUrls} imagePreviewUrls={imagePreviewUrls} />
                </div>
                <Button className="rounded-sm" onClick={() => remove(index)}>Remove Meaning</Button>
              </CardBody>
            </Card>
          ))}

          <MeaningFieldArrayButtons append={append} prepend={prepend} meaningDefaultValues={meaningDefaultValues} />

          {formState.errors.meanings && (
            <p className="text-red-500">
              {formState.errors.meanings.root?.message}
            </p>
          )}
        </div>
        <Button
          // isLoading={wordMutation.isLoading || isUploading}
          type="submit"
          variant="ghost"
          className="w-full rounded-sm"
        >
          Submit
        </Button>
      </form>
    </section>
  );
}
