"use client";
import * as Prisma from "@prisma/client";
import { MeaningInputs, WordForm } from "@/types";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
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

export default function CreateWord() {
  const { handleSubmit, control, watch, register } = useForm<WordForm>({
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
  });
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      name: "meanings",
      control,
      rules: {
        required: {
          value: true,
          message: "You must have a meaning",
        },
        minLength: 1,
      },
    }
  );
  const [imagePreviewUrls, setImagePreviewUrls] = React.useState<string[]>([]);
  console.log(watch());
  console.log(imagePreviewUrls);
  const onSubmit = (data: WordForm) => {
    /*
    todo:
    converting values into correct types
    uploading images and audio
    sending the whole form to the backend
    */
    console.log(data.meanings[0].definition.image);
    try {
      const attributes =
        data.attributes?.split(",").map((attribute) => {
          return z.string().min(1).parse(attribute.trim());
        }) ?? [];
      console.log(attributes);
    } catch (error) {
      control.setError("attributes", {
        type: "value",
        message: "Attributes must be separated by a comma",
      });
    }
  };
  return (
    <section className="max-w-5xl mx-auto">
      <h1 className="text-center text-fs-2">Create Word</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
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
          render={({ field, fieldState: { error } }) => (
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
          render={({ field, fieldState: { error } }) => (
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
          render={({ field, fieldState: { error } }) => (
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
          render={({ field, fieldState: { error } }) => (
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
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Related Words"
              color="primary"
              variant="underlined"
              description="Related Words is optional, please separate them with a comma."
            />
          )}
        />
        <Controller
          control={control}
          name="relatedPhrases"
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Related Phrases"
              color="primary"
              variant="underlined"
              description="Related Phrases is optional, please separate them with a comma."
            />
          )}
        />
        <div className="flex flex-col gap-4 w-full mt-2">
          <h2 className="m-0 p-0">Meanings</h2>
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardBody>
                <Controller
                  name={`meanings.${index}.partOfSpeech`}
                  control={control}
                  rules={{
                    required: {
                      value: true,
                      message: "Part of Speech is required",
                    },
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <Select isRequired label="Part of Speech" color="primary">
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
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label="Attributes"
                      color="primary"
                      variant="underlined"
                      description="Attributes are optional, please separate them with a comma."
                    />
                  )}
                />
                <Controller
                  name={`meanings.${index}.definition.definition`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label="Definition"
                      color="primary"
                      variant="underlined"
                      description="Attributes are optional, please separate them with a comma."
                    />
                  )}
                />
                <div>
                  <input
                    placeholder="Browse Image"
                    accept="image/*"
                    type="file"
                    {...control.register(`meanings.${index}.definition.image`)}
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
                  <Button
                    onPress={() => {
                      field.definition.image = undefined;
                      setImagePreviewUrls((prev) => {
                        prev[index] = "";
                        return [...prev];
                      });
                    }}
                  >
                    Unselect Image
                  </Button>
                  {imagePreviewUrls[0] && (
                    <img
                      src={imagePreviewUrls[index] ?? ""}
                      alt="selected image"
                      // alt={field.definition.image?.[0].name ?? "selected image"}
                    />
                  )}
                </div>
                <Controller
                  name={`meanings.${index}.definition.example.author`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label="Example Author"
                      color="primary"
                      variant="underlined"
                      description="Attributes are optional, please separate them with a comma."
                    />
                  )}
                />
                <Button>asdfasdfsa</Button>
                <Controller
                  name={`meanings.${index}.definition.example.sentence`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label="Example Sentence"
                      color="primary"
                      variant="underlined"
                      description="Attributes are optional, please separate them with a comma."
                    />
                  )}
                />
                <Button onClick={() => remove(index)}>Remove</Button>
              </CardBody>
            </Card>
          ))}
          <ButtonGroup>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                append(meaningDefaultValues);
              }}
            >
              Append
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                prepend(meaningDefaultValues);
              }}
            >
              Prepend
            </Button>
          </ButtonGroup>
        </div>
        <button>Submit</button>
      </form>
    </section>
  );
}
