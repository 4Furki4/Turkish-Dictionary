"use client";
import { MeaningInputs, WordForm, WordInput } from "@/types";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import React, { ChangeEvent } from "react";
import { Controller, set, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/src/trpc/react";
import { uploadFiles } from "@/src/lib/uploadthing";
import { toast } from "react-toastify";
import { partOfSpeechEnum } from "@/db/schema/part_of_speechs";
import langs from "@/db/static/langs.json";
import WordName from "./CreateWordForm/Inputs/WordNameInput";
import WordNameInput from "./CreateWordForm/Inputs/WordNameInput";
import WordPhoneticInput from "./CreateWordForm/Inputs/WordPhoneticInput";
import WordRootLanguageInput from "./CreateWordForm/Inputs/WordRootLanguageInput";
import WordRootOrigin from "./CreateWordForm/Inputs/WordRootOriginInput";
import WordRootOriginInput from "./CreateWordForm/Inputs/WordRootOriginInput";
import WordPrefixInput from "./CreateWordForm/Inputs/WordPrefixInput";
import WordSuffixInput from "./CreateWordForm/Inputs/WordSuffixInput";

const meaningDefaultValues: MeaningInputs = {
  attributes: undefined,
  partOfSpeech: undefined,
  meaning: undefined,
  image: undefined,
  example: {
    author: undefined,
    sentence: undefined,
  },
};
const seperationValidate = (value: string | undefined, symbol: string) => {
  if (value && value.includes(symbol)) {
    const attributes = value.split(symbol).map((attribute) => {
      return z.string().min(2).safeParse(attribute.trim());
    });
    return (
      attributes.every((attribute) => attribute.success) ||
      "Attributes must be separated by a comma, and be at least 2 character long."
    );
  }
  return true;
};

export default function CreateWord({ locale, meaningAttributes }: {
  locale: string;
  meaningAttributes: {
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
      name: undefined,
      language: undefined,
      phonetic: undefined,
      root: undefined,
      prefix: undefined,
      suffix: undefined,
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
  // const wordMutation = api.admin.createWord.useMutation({});
  const [isUploading, setIsUploading] = React.useState(false);
  const onSubmit = async (data: WordForm) => {
    const { meanings } = data;
    // const uploadedPictures = meanings.map(async (meaning) => {
    //   if (meaning.image?.[0]) {
    //     const files = [meaning.image[0]];
    //     const response = await uploadFiles({
    //       endpoint: "imageUploader",
    //       files,
    //       onUploadProgress({ file, progress }) {
    //         console.log(`Uploaded ${progress}% of ${file}`);
    //       },
    //       onUploadBegin({ file }) {
    //         console.log(`Started uploading ${file}`);
    //         setIsUploading(true);
    //       },
    //     });
    //     return response[0].url;
    //   }
    //   return undefined;
    // });
    let uploadedPicturesUrls: (string | undefined)[] = [];
    // if (meanings.every((meaning) => typeof meaning.image === typeof FileList)) {
    //   const loadingToaster = toast.loading("Uploading images...");

    //   uploadedPicturesUrls = await Promise.all(uploadedPictures);
    //   setIsUploading(false);
    //   toast.dismiss(loadingToaster);
    //   toast.success("Images uploaded!");
    // }
    // TODO: handle object creation required in the backend
    reset();
  };

  // const meaningAttributesQuery = api.admin.getMeaningAttributes.useQuery()
  return (
    <section className="max-w-5xl mx-auto max-sm:px-4 py-4">
      <h1 className="text-center text-fs-2">Create Word</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
        <div className="grid sm:grid-cols-2 gap-2">
          {/* TODO: CHECK IF THE WORD EXISTS BY NAME ONCE FOCUS OUT */}
          <WordNameInput control={control} watch={watch} setError={setError} />
          <WordPhoneticInput control={control} />
          <WordRootLanguageInput control={control} watch={watch} setError={setError} clearErrors={clearErrors} getFieldState={getFieldState} locale={locale} langs={langs} />
          <WordRootOriginInput control={control} watch={watch} setError={setError} clearErrors={clearErrors} getFieldState={getFieldState} />
          <WordPrefixInput control={control} />
          <WordSuffixInput control={control} />
        </div>

        <div className="w-full mt-2">
          <h2 className="text-center text-fs-1">Meanings</h2>
          {fields.map((field, index) => (
            <Card key={field.id} className="mb-4">
              <CardBody className="flex flex-col gap-2">
                <Controller
                  name={`meanings.${index}.meaning`}
                  control={control}
                  rules={{
                    required: {
                      value: true,
                      message: "Meaning is required",
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label="Meaning"
                      color="primary"
                      variant="underlined"
                      description="Meaning is required."
                      isRequired
                      errorMessage={error?.message}
                      isInvalid={error !== undefined}
                    />
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  <Controller
                    name={`meanings.${index}.partOfSpeech`}
                    control={control}
                    rules={{
                      required: {
                        value: true,
                        message: "Part of Speech is required",
                      },
                    }}
                    render={({ field, fieldState: { error, isDirty } }) => (
                      <Select
                        label="Part of Speech"
                        color="primary"
                        variant="underlined"
                        isRequired
                        isInvalid={error !== undefined && isDirty}
                        errorMessage={isDirty && error?.message}
                        {...field}
                      >
                        {partOfSpeechEnum.enumValues.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  {/* TODO: LET THEM SELECT THE ADDED ATTRIBUTES OR ADD NEW ONE */}

                  <Controller
                    name={`meanings.${index}.attributes`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Autocomplete label={'Attribute'} defaultItems={meaningAttributes ?? []}>
                        {(item) => (
                          <AutocompleteItem key={item.attribute} className="capitalize">
                            {item && item.attribute}
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    )}
                  />
                  <Controller
                    name={`meanings.${index}.example.sentence`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Example Sentence"
                        color="primary"
                        variant="underlined"
                        description="Example sentence is optional but required when example author is specified."
                      />
                    )}
                  />
                  {/* TODO: LET THEM SELECT ADDED AUTHORS OR CREATE NEW ONE */}
                  <Controller
                    name={`meanings.${index}.example.author`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Example Author"
                        color="primary"
                        variant="underlined"
                        description="Example Author is optional."
                      />
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <input
                    className="w-full"
                    placeholder="Browse Image"
                    accept="image/*"
                    type="file"
                    multiple={false}
                    {...control.register(`meanings.${index}.image`, {
                      validate: (file) => {
                        const FOUR_MB = 4 * 1024 * 1024;
                        if (file && file[0]?.size > FOUR_MB) {
                          return "Image must be smaller than 4MB";
                        }
                        return true;
                      },
                    })}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreviewUrls((prev) => {
                            prev[index] = reader.result as string;
                            return [...prev];
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {formState.errors?.meanings?.[index]?.image && (
                    <p>{formState.errors?.meanings?.[index]?.image?.message}</p>
                  )}
                  {imagePreviewUrls[0] ? (
                    <img
                      src={imagePreviewUrls[index] ?? ""}
                      alt="selected image"
                    />
                  ) : (
                    <p>
                      Image is optional. If you want to add an image, please
                      select one.
                    </p>
                  )}
                  {imagePreviewUrls[index] && (
                    <Button
                      className="w-full"
                      onPress={() => {
                        field.image = undefined;
                        clearErrors(`meanings.${index}.image`);
                        setImagePreviewUrls((prev) => {
                          prev[index] = "";
                          return [...prev];
                        });
                      }}
                    >
                      Unselect Image
                    </Button>
                  )}
                </div>
                <Button onClick={() => remove(index)}>Remove Meaning</Button>
              </CardBody>
            </Card>
          ))}
          <ButtonGroup className="w-full">
            <Button
              className="w-full"
              type="button"
              variant="ghost"
              onClick={() => {
                append(meaningDefaultValues);
              }}
            >
              Append <span className="max-sm:hidden">Meaning</span>
            </Button>
            <Button
              className="w-full"
              type="button"
              variant="ghost"
              onClick={() => {
                prepend(meaningDefaultValues);
              }}
            >
              Prepend <span className="max-sm:hidden">Meaning</span>
            </Button>
          </ButtonGroup>
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
          className="w-full"
        >
          Submit
        </Button>
      </form>
    </section>
  );
}
