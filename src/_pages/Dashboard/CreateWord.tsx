"use client";
import { MeaningInputs, WordForm, WordFormSubmit } from "@/types";
import {
  Button,
  Card,
  CardBody,
} from "@heroui/react";
import React, { useCallback, useMemo } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import MeaningFieldArray from "./MeaningFieldArray";


const meaningDefaultValues: MeaningInputs = {
  attributes: [],
  partOfSpeechId: undefined,
  meaning: undefined,
  image: undefined,
  example: {
    author: undefined,
    sentence: undefined,
  },
};
export default function CreateWord({ locale, meaningAttributes, authors, partOfSpeeches }: {
  locale: string;
  meaningAttributes: {
    id: number;
    attribute: string;
  }[]
  authors: {
    id: string;
    name: string;
  }[]
  partOfSpeeches: {
    id: number;
    partOfSpeech: PartOfSpeech;
  }[]
}) {
  const {
    handleSubmit,
    control,
    formState,
    clearErrors,
    watch,
    setError,
    getFieldState,
    setValue
  } = useForm<WordForm>({
    defaultValues: {
      name: '',
      language: '',
      phonetic: '',
      root: '',
      prefix: '',
      suffix: '',
      attributes: [],
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
  const onSubmit = useCallback(async (data: WordForm) => {
    let { meanings } = data;
    const meaningsFormatted = meanings.map((meaning) => {
      return {
        ...meaning,
        partOfSpeechId: meaning.partOfSpeechId,
        example: meaning.example?.sentence && meaning.example?.sentence ? {
          sentence: meaning.example.sentence,
          author: meaning.example.author ? parseInt(meaning.example.author) : null,
        } : undefined,
        attributes: meaning.attributes?.map(attribute => parseInt(attribute))
      }
    })
    const uploadedPictures = meaningsFormatted.map(async (meaning) => {
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
    if (meaningsFormatted.every((meaning) => typeof meaning.image === typeof FileList)) {
      const loadingToaster = toast.loading("Uploading images...");

      uploadedPicturesUrls = await Promise.all(uploadedPictures);
      setIsUploading(false);
      toast.dismiss(loadingToaster);
      toast.success("Images uploaded!");
    }
    const meaningsWithImages = meaningsFormatted.map((meaning, index) => {
      return {
        ...meaning,
        image: uploadedPicturesUrls[index],
      };
    });
    console.log('attributes', data.attributes)
    const word = {
      ...data,
      attributes: data.attributes?.map((val) => parseInt(val)),
      meanings: meaningsWithImages,
    }
    wordMutation.mutate(word as WordFormSubmit)
    // reset();
  }, [wordMutation, setIsUploading, setImagePreviewUrls]);

  return (
    <section className="max-w-7xl w-full mx-auto">
      <h1 className="text-center text-fs-2">Create Word</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <div className="flex flex-col max-w-full sm:grid sm:grid-cols-2 gap-2">
          <WordNameInput control={control} watch={watch} setError={setError} />
          <WordPhoneticInput control={control} />
          <WordRootLanguageInput control={control} watch={watch} setError={setError} clearErrors={clearErrors} getFieldState={getFieldState} locale={locale} />
          <WordRootOriginInput control={control} watch={watch} setError={setError} clearErrors={clearErrors} getFieldState={getFieldState} />
          <WordPrefixInput control={control} />
          <WordSuffixInput control={control} />
          <WordAttributesInput setValue={setValue} control={control} />
        </div>
        {fields.length > 0 ? (
          <MeaningFieldArray
            fields={fields}
            control={control}
            partOfSpeeches={partOfSpeeches}
            meaningAttributes={meaningAttributes}
            authors={authors}
            clearErrors={clearErrors}
            watch={watch}
            setValue={setValue}
            remove={remove}
            formState={formState}
            setImagePreviewUrls={setImagePreviewUrls}
            imagePreviewUrls={imagePreviewUrls}
          />
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              You must add a meaning!
            </AlertDescription>
          </Alert>
        )}
        <MeaningFieldArrayButtons append={append} prepend={prepend} meaningDefaultValues={meaningDefaultValues} />
        <Button
          // isLoading={wordMutation.isLoading || isUploading}
          type="submit"
          variant="ghost"
          className="w-full"
          radius="sm"
        >
          Submit
        </Button>
      </form>
    </section>
  );
}
