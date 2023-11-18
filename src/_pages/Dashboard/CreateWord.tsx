"use client";
import * as Prisma from "@prisma/client";
import { MeaningInputs, WordForm } from "@/types";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Divider,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import React, { ChangeEvent } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const meaningDefaultValues: MeaningInputs = {
  attributes: "",
  partOfSpeech: undefined,
  definition: {
    definition: "",
    image: undefined,
    example: {
      author: "",
      sentence: "",
    },
  },
};
const attributeValidate = (value: string | undefined) => {
  if (value && value.includes(",")) {
    const attributes = value.split(",").map((attribute) => {
      return z.string().min(2).safeParse(attribute.trim());
    });
    return (
      attributes.every((attribute) => attribute.success) ||
      "Attributes must be separated by a comma, and be at least 2 character long."
    );
  }
  return true;
};

export default function CreateWord() {
  const { handleSubmit, control, formState, clearErrors, watch } =
    useForm<WordForm>({
      defaultValues: {
        name: "",
        attributes: "",
        root: "",
        phonetics: "",
        prefix: "",
        suffix: "",
        relatedWords: "",
        relatedPhrases: "",
        audio: undefined,
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
  console.log(formState.errors?.attributes);
  const [imagePreviewUrls, setImagePreviewUrls] = React.useState<string[]>([]);
  const onSubmit = (data: WordForm) => {
    /*
    todo:
    converting values into correct types
    uploading images and audio
    sending the whole form to the backend
    */
    try {
      const attributes =
        data.attributes?.split(",").map((attribute) => {
          return z.string().min(2).parse(attribute.trim());
        }) ?? [];
      console.log(attributes);
    } catch (error) {
      control.setError("attributes", {
        type: "value",
        message:
          "Attributes must be separated by a comma, and be at least 2 character long.",
      });
    }
  };
  return (
    <section className="max-w-5xl mx-auto max-sm:px-4 py-4">
      <h1 className="text-center text-fs-2">Create Word</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
        <div className="grid sm:grid-cols-2 gap-2">
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
              />
            )}
          />
          <Controller
            control={control}
            name="attributes"
            rules={{
              required: false,
              validate: attributeValidate,
              pattern: {
                // allow only letters and comma between them, also allow UTF-8 characters
                value: /^[\p{L}\s,]+$/u,
                message: "Attributes must be separated by a comma!",
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                isRequired={false}
                label="Attributes"
                color="primary"
                variant="underlined"
                errorMessage={error?.message}
                isInvalid={error !== undefined}
                description="Attributes are optional, please separate them with a comma."
              />
            )}
          />
          <Controller
            control={control}
            name="root"
            render={({ field }) => (
              <Input
                {...field}
                label="Root"
                color="primary"
                variant="underlined"
                description="Root is optional"
              />
            )}
          />
          <Controller
            control={control}
            name="phonetics"
            render={({ field }) => (
              <Input
                {...field}
                label="Phonetics"
                color="primary"
                variant="underlined"
                description="Phonetics is optional"
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
          <Controller
            control={control}
            name="relatedWords"
            render={({ field }) => (
              <Input
                {...field}
                label="Related Words"
                color="primary"
                variant="underlined"
                description="Related Words is optional."
              />
            )}
          />
          <Controller
            control={control}
            name="relatedPhrases"
            render={({ field }) => (
              <Input
                {...field}
                label="Related Phrases"
                color="primary"
                variant="underlined"
                description="Related Phrases is optional."
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
                  name={`meanings.${index}.definition.definition`}
                  control={control}
                  rules={{
                    required: {
                      value: true,
                      message: "Definition is required",
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label="Definition"
                      color="primary"
                      variant="underlined"
                      description="Definition is required."
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
                        {Object.keys(Prisma.$Enums.PartOfSpeech).map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Controller
                    name={`meanings.${index}.attributes`}
                    control={control}
                    rules={{
                      validate: attributeValidate,
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
                  />
                  <Controller
                    name={`meanings.${index}.definition.example.sentence`}
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
                  <Controller
                    name={`meanings.${index}.definition.example.author`}
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
                    {...control.register(`meanings.${index}.definition.image`, {
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
                  {formState.errors?.meanings?.[index]?.definition?.image && (
                    <p>
                      {
                        formState.errors?.meanings?.[index]?.definition?.image
                          ?.message
                      }
                    </p>
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
                        field.definition.image = undefined;
                        clearErrors(`meanings.${index}.definition.image`);
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
        <Button type="submit" variant="ghost" className="w-full">
          Submit
        </Button>
      </form>
    </section>
  );
}
