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

export default function CreateWord({ locale }: { locale: string }) {
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
  const wordCheckQuery = api.admin.checkWord.useQuery(watch("name")!, {
    enabled: false,
  });
  return (
    <section className="max-w-5xl mx-auto max-sm:px-4 py-4">
      <h1 className="text-center text-fs-2">Create Word</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
        <div className="grid sm:grid-cols-2 gap-2">
          {/* TODO: CHECK IF THE WORD EXISTS BY NAME ONCE FOCUS OUT */}
          <Controller
            control={control}
            name="name"
            rules={{
              required: {
                value: true,
                message: "Name is required",
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                label="Name"
                color="primary"
                variant="underlined"
                errorMessage={error?.message}
                isInvalid={error !== undefined}
                isRequired={true}
                onFocusChange={async (isFocused) => {
                  // Check if the word exists, if it does, show a error message
                  const wordInput = watch("name");
                  if (!isFocused && wordInput) {
                    const data = (await wordCheckQuery.refetch()).data;
                    if (data?.wordAlreadyExists) {
                      setError("name", {
                        message: "Word already exists",
                      });
                    }
                  }
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="phonetic"
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                label="Phonetic"
                color="primary"
                variant="underlined"
                description="Phonetics is optional"
              />
            )}
          />
          <Controller
            control={control}
            name="language"
            rules={{
              validate: (value) => {
                if (
                  !value &&
                  !!watch("root") &&
                  getFieldState("language").isTouched
                ) {
                  return "Language is required when root specified";
                } else if (!watch("root") && value) {
                  setError("root", {
                    message: "Root is required when language is selected",
                  });
                  return true;
                } else {
                  clearErrors("root");
                  return true;
                }
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Autocomplete
                placeholder="You can search for a language"
                defaultItems={langs}
                label="Select an language"
                {...field}
                onSelectionChange={(item) => {
                  field.onChange(item);
                  clearErrors("language");
                }}
                errorMessage={error?.message}
              >
                {(item) => (
                  <AutocompleteItem key={item.name}>
                    {locale === "en" ? item.name : item.turkishName}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            )}
          />
          <Controller
            control={control}
            name="root"
            rules={{
              validate: (value) => {
                if (
                  watch("language") &&
                  !value &&
                  getFieldState("root").isTouched
                ) {
                  return "Root is required when language is selected";
                } else if (!watch("language") && value) {
                  setError("language", {
                    message: "Language is required when root specified",
                  });
                  return true;
                } else {
                  clearErrors("language");
                  return true;
                }
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                placeholder="Type the root word"
                label="Root"
                color="primary"
                variant="underlined"
                errorMessage={error?.message}
                isInvalid={error !== undefined}
                {...field}
              />
            )}
          />
          <Controller
            control={control}
            name="prefix"
            render={({ field }) => (
              <Input
                {...field}
                label="Prefix"
                color="primary"
                variant="underlined"
                description="Prefix is optional"
              />
            )}
          />
          <Controller
            control={control}
            name="suffix"
            render={({ field }) => (
              <Input
                {...field}
                label="Suffix"
                color="primary"
                variant="underlined"
                description="Suffix is optional"
              />
            )}
          />
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

                  {/* <Controller
                    name={`meanings.${index}.attributes`}
                    control={control}
                    rules={{
                      validate: (value) => seperationValidate(value, ","),
                      pattern: {
                        // allow only letters and comma between them, also allow UTF-8 characters
                        value: /^[\p{L}\s,]+$/u,
                        message: "Attributes must be separated by a comma!",
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <Input
                        {...field}
                        label="Attributes"
                        color="primary"
                        variant="underlined"
                        errorMessage={error?.message}
                        isInvalid={error !== undefined}
                        description="Attributes are optional, please separate them with a comma."
                      />
                    )}
                  /> */}
                  <Controller
                    name={`meanings.${index}.example.sentence`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Example Sentence"
                        color="primary"
                        variant="underlined"
                        description="Example sentence is optional."
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
