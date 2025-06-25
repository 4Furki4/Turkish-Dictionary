"use client";

import React, { useState, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Button,
  Input,
  SelectItem,
  Tab,
  CardBody,
  CardHeader,
  AutocompleteItem,
  Divider,
  Link,
  Tooltip,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { uploadFiles } from "@/src/utils/uploadthing";
import type { Session } from "next-auth";

import { api } from "@/src/trpc/react";
import NewWordAttributeRequestModal from "@/src/components/customs/edit-request-modal/word/new-word-attribute-request-modal";
import NewMeaningAttributeRequestModal from "@/src/components/customs/edit-request-modal/meanings/new-meaning-attribute-request-modal";
import NewAuthorRequestModal from "@/src/components/customs/edit-request-modal/meanings/new-author-request-modal";
import { AlertCircle, Plus, Trash2, Upload, X, FileClock } from "lucide-react";
import { CustomTabs } from "@/src/components/customs/heroui/custom-tabs";
import CustomCard from "@/src/components/customs/heroui/custom-card";
import { CustomInput } from "@/src/components/customs/heroui/custom-input";
import { CustomSelect } from "@/src/components/customs/heroui/custom-flexable-select";
import { CustomTextarea } from "@/src/components/customs/heroui/custom-textarea";
import { CustomAutocomplete } from "@/src/components/customs/heroui/custom-autocomplete";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/src/server/api/root";
import type { ClientUploadedFileData } from "uploadthing/types";

// Schema for detailed form
const detailedFormSchema = z.object({
  name: z.string().min(1, "Word name is required"),
  phonetic: z.string().optional(),
  prefix: z.string().optional(),
  root: z.string().optional(),
  suffix: z.string().optional(),
  languageCode: z.string().optional(),
  attributes: z.array(z.string()).optional(),
  meanings: z.array(z.object({
    partOfSpeechId: z.string().optional(),
    meaning: z.string().min(1, "Meaning is required"),
    attributes: z.array(z.string()).optional(),
    example: z.object({
      sentence: z.string().optional(),
      author: z.string().optional(),
    }).optional(),
    image: z.any().optional(), // Changed to handle File objects
  })).min(1, "At least one meaning is required"),
});

// Schema for simple form
const simpleFormSchema = z.object({
  name: z.string().min(1, "Word name is required"),
});

type DetailedFormData = z.infer<typeof detailedFormSchema>;
type SimpleFormData = z.infer<typeof simpleFormSchema>;

interface UserContributeWordPageProps {
  session: Session | null;
  locale: "en" | "tr";
  prefillWord?: string;
}

export default function UserContributeWordPage({ session, locale, prefillWord }: UserContributeWordPageProps) {
  const t = useTranslations("ContributeWord");
  const tRequests = useTranslations("Requests");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [activeTab, setActiveTab] = useState("detailed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [isMeaningAttributeModalOpen, setIsMeaningAttributeModalOpen] = useState(false);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [requestedAttributes, setRequestedAttributes] = useState<string[]>([]);
  const [requestedMeaningAttributes, setRequestedMeaningAttributes] = useState<string[]>([]);
  const [requestedAuthors, setRequestedAuthors] = useState<string[]>([]);

  // API queries for existing data
  const { data: languages, isLoading: languagesIsLoading } = api.params.getLanguages.useQuery();
  const { data: partsOfSpeech, isLoading: partsOfSpeechIsLoading } = api.params.getPartOfSpeeches.useQuery();
  const { data: wordAttributesWithRequested, isLoading: wordAttributesWithRequestedIsLoading } = api.request.getWordAttributesWithRequested.useQuery();
  const { data: meaningAttributesWithRequested, isLoading: meaningAttributesWithRequestedIsLoading } = api.request.getMeaningAttributesWithRequested.useQuery();
  const { data: authorsWithRequested, isLoading: authorsWithRequestedIsLoading } = api.request.getAuthorsWithRequested.useQuery();

  // API mutations
  const createFullWordRequest = api.request.createFullWordRequest.useMutation({
    onSuccess: () => {
      toast.success(t("requestSubmitted"));
      detailedForm.reset();
      setIsSubmitting(false);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error("Submission error:", error);
      if (error.message?.includes("already requested")) {
        toast.error(t("wordAlreadyRequested"));
      } else if (error.message?.includes("reCAPTCHA")) {
        toast.error(t("captchaFailed"));
      } else {
        toast.error(t("requestFailed"));
      }
    },
  });

  const createSimpleWordRequest = api.request.createSimpleWordRequest.useMutation({
    onSuccess: () => {
      toast.success(t("requestSubmitted"));
      simpleForm.reset();
      setIsSubmitting(false);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error("Submission error:", error);
      if (error.message?.includes("already requested")) {
        toast.error(t("wordAlreadyRequested"));
      } else if (error.message?.includes("reCAPTCHA")) {
        toast.error(t("captchaFailed"));
      } else {
        toast.error(t("requestFailed"));
      }
    }
  });

  // Detailed form setup
  const detailedForm = useForm<DetailedFormData>({
    resolver: zodResolver(detailedFormSchema),
    defaultValues: {
      name: prefillWord || "",
      phonetic: "",
      prefix: "",
      root: "",
      suffix: "",
      languageCode: "",
      attributes: [],
      meanings: [{
        partOfSpeechId: "",
        meaning: "",
        attributes: [],
        example: { sentence: "", author: "" },
        image: null,
      }],
    },
  });

  // Simple form setup
  const simpleForm = useForm<SimpleFormData>({
    resolver: zodResolver(simpleFormSchema),
    defaultValues: {
      name: prefillWord || "",
    },
  });

  const { fields: meaningFields, append: appendMeaning, remove: removeMeaning } = useFieldArray({
    control: detailedForm.control,
    name: "meanings",
  });
  console.log('detailedForm values', detailedForm.getValues())

  // Handle image selection for preview
  const handleImageSelect = useCallback((file: File, meaningIndex: number) => {
    try {
      // Validate file size (4MB limit)
      const ONE_MB = 1 * 1024 * 1024;
      if (file.size > ONE_MB) {
        toast(
          (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-primary h-5 w-5" />
                <h1>{t("imageTooLarge", { size: 1 })}</h1>
              </div>
              <p>{t("imageTooLargeDescription")}</p>
              <Link color="foreground" underline="always" href="https://www.iloveimg.com/compress-image" target="_blank" rel="noopener noreferrer">
                ILoveImg
              </Link>
            </div>
          ),
          {
            duration: 4000, // 4 seconds
            dismissible: true,
            style: {
              background: "hsl(var(--destructive)/0.3)",
            },
          }
        );
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviewUrls(prev => {
          const newPreviews = [...prev];
          newPreviews[meaningIndex] = reader.result as string;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);

      // Store file in form
      detailedForm.setValue(`meanings.${meaningIndex}.image`, [file]);
    } catch (error) {
      console.error("Image selection error:", error);
      toast.error(t("imageSelectionFailed"));
    }
  }, [detailedForm, t]);

  // Remove image
  const removeImage = useCallback((meaningIndex: number) => {
    detailedForm.setValue(`meanings.${meaningIndex}.image`, null);
    setImagePreviewUrls(prev => {
      const newPreviews = [...prev];
      newPreviews[meaningIndex] = "";
      return newPreviews;
    });
  }, [detailedForm]);

  // Submit detailed form
  const onSubmitDetailed = async (data: DetailedFormData) => {
    if (!executeRecaptcha) {
      toast.error(t("recaptchaError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const captchaToken = await executeRecaptcha("submit_detailed_word_request");

      // Upload images first if any exist
      const meaningImages = data.meanings.map(meaning => meaning.image?.[0]).filter(Boolean) as File[];
      let uploadedImageUrls: string[] = [];
      let uploadResults: ClientUploadedFileData<{
        uploadedBy: string;
      }>[] = [];
      if (meaningImages.length > 0) {
        try {
          const uploadFilesPromise = uploadFiles("imageUploader", {
            files: meaningImages,
            onUploadBegin: () => {
              toast.info(t("uploadBegin"));
            },
          });
          toast.promise(uploadFilesPromise, {
            success: (data) => {
              uploadResults = data;
              return toast.success(t("imagesUploaded"));
            },
            error: t("imageUploadFailed"),
          });
          uploadedImageUrls = uploadResults.map(result => result.ufsUrl);
        } catch (uploadError) {
          throw new Error(t("imageUploadFailed"));
        }
      }

      // Format the data for the API
      let imageIndex = 0;
      const formattedData = {
        name: data.name.trim(),
        phonetic: data.phonetic?.trim() || undefined,
        prefix: data.prefix?.trim() || undefined,
        root: data.root?.trim() || undefined,
        suffix: data.suffix?.trim() || undefined,
        language: data.languageCode || undefined,
        attributes: data.attributes?.map(attr => parseInt(attr)).filter(Boolean) || [],
        meanings: data.meanings.map((meaning) => ({
          partOfSpeechId: meaning.partOfSpeechId ? parseInt(meaning.partOfSpeechId) : undefined,
          meaning: meaning.meaning.trim(),
          attributes: meaning.attributes?.map(attr => parseInt(attr)).filter(Boolean) || [],
          example: meaning.example?.sentence?.trim() ? {
            sentence: meaning.example.sentence.trim(),
            author: meaning.example.author?.trim() ? parseInt(meaning.example.author.trim()) : undefined,
          } : undefined,
          imageUrl: meaning.image?.[0] ? uploadedImageUrls[imageIndex++] : undefined,
        })),
        captchaToken,
      };

      await createFullWordRequest.mutateAsync(formattedData);
      toast.success(t("requestSubmitted"));
      detailedForm.reset();
      setImagePreviewUrls([]);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || t("submissionError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit simple form
  const onSubmitSimple = async (data: SimpleFormData) => {
    if (!executeRecaptcha) {
      toast.error(t("captchaFailed"));
      return;
    }

    setIsSubmitting(true);
    try {
      const captchaToken = await executeRecaptcha("submit_simple_word_request");

      await createSimpleWordRequest.mutateAsync({
        wordName: data.name.trim(),
        captchaToken,
      });

      toast.success(t("requestSubmitted"));
      simpleForm.reset();
    } catch (error: any) {
      console.error("Submission error:", error);
      if (error.message?.includes("already requested")) {
        toast.error(t("wordAlreadyRequested"));
      } else if (error.message?.includes("reCAPTCHA")) {
        toast.error(t("captchaFailed"));
      } else {
        toast.error(t("requestFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t("description")}</p>
      </div>

      <CustomTabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
      >
        <Tab key="detailed" title={t("detailedTab")}>
          <CustomCard className="p-6">
            <CardHeader>
              <h2 className="text-lg font-bold">{t("detailedTab")}</h2>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("detailedTabDescription")}
                </p>
              </div>

              <form onSubmit={detailedForm.handleSubmit(onSubmitDetailed)} className="space-y-6">
                {/* Word Name */}
                <Controller
                  name="name"
                  control={detailedForm.control}
                  render={({ field, fieldState: { error } }) => (
                    <CustomInput
                      {...field}
                      label={t("wordName")}
                      placeholder={t("wordNamePlaceholder")}
                      isRequired
                      isInvalid={!!error}
                      errorMessage={error?.message}
                    />
                  )}
                />



                {/* Prefix, Root, Suffix Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Phonetic */}
                  <Controller
                    name="phonetic"
                    control={detailedForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomInput
                        {...field}
                        label={t("phonetic")}
                        placeholder={t("phoneticPlaceholder")}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name="prefix"
                    control={detailedForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomInput
                        {...field}
                        label={t("prefix")}
                        placeholder={t("prefixPlaceholder")}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />



                  <Controller
                    name="suffix"
                    control={detailedForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomInput
                        {...field}
                        label={t("suffix")}
                        placeholder={t("suffixPlaceholder")}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />
                  {/* Word Attributes */}
                  <Controller
                    name="attributes"
                    control={detailedForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomSelect
                        isLoading={wordAttributesWithRequestedIsLoading}
                        listboxProps={{
                          emptyContent: t("noAttributesFound"),
                        }}
                        as={'div'}
                        size="lg"
                        classNames={{
                          base: "w-full",
                        }}
                        label={t("attributes")}
                        placeholder={t("selectAttributes")}
                        selectionMode="multiple"
                        selectedKeys={field.value || []}
                        onSelectionChange={(keys) => {
                          field.onChange(Array.from(keys));
                        }}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                        endContent={
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="mb-5"
                            onPress={() => setIsAttributeModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        }
                      >
                        {wordAttributesWithRequested?.map((attr: any) => (
                          <SelectItem
                            key={attr.id.toString()}
                            endContent={Number(attr.id) < 0 ? (
                              <Tooltip content={tRequests("RequestedAttributeByYou")}>
                                <FileClock className="text-warning" />
                              </Tooltip>
                            ) : ""}
                          >
                            {attr.attribute}
                          </SelectItem>
                        )) || []}
                      </CustomSelect>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Language */}
                  <Controller
                    name="languageCode"
                    control={detailedForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomAutocomplete

                        classNames={{
                          base: "w-full",
                        }}
                        isLoading={languagesIsLoading}
                        listboxProps={{
                          emptyContent: t("noLanguagesFound"),
                        }}
                        size="lg"
                        label={t("language")}
                        placeholder={t("selectLanguage")}
                        defaultItems={languages || []}
                        onSelectionChange={(item) => {
                          field.onChange(item);
                        }}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      >
                        {(item: any) => (
                          <AutocompleteItem key={item.language_code}>
                            {locale === "en" ? item.language_en : item.language_tr}
                          </AutocompleteItem>
                        )}
                      </CustomAutocomplete>
                    )}
                  />
                  <Controller
                    name="root"
                    control={detailedForm.control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomInput
                        {...field}
                        label={t("root")}
                        placeholder={t("rootPlaceholder")}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                      />
                    )}
                  />
                </div>
                <Divider />
                {/* Meanings Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("meanings")}</h3>
                  </div>

                  {meaningFields.map((field, meaningIndex) => (
                    <CustomCard key={field.id} className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{t("meaning")} {meaningIndex + 1}</h4>
                        {meaningFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onPress={() => removeMeaning(meaningIndex)}
                            className="text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Part of Speech */}
                        <Controller
                          name={`meanings.${meaningIndex}.partOfSpeechId`}
                          control={detailedForm.control}
                          render={({ field, fieldState: { error } }) => (
                            <CustomSelect
                              isLoading={partsOfSpeechIsLoading}
                              listboxProps={{
                                emptyContent: t("noPartsOfSpeechFound"),
                              }}
                              as={'div'}
                              size="lg"
                              classNames={{
                                base: "w-full",
                              }}
                              label={t("partOfSpeech")}
                              placeholder={t("selectPartOfSpeech")}
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0] as string;
                                field.onChange(selectedKey);
                              }}
                              isInvalid={!!error}
                              errorMessage={error?.message}
                            >
                              {partsOfSpeech?.map((pos: any) => (
                                <SelectItem key={pos.id.toString()}>
                                  {pos.partOfSpeech}
                                </SelectItem>
                              )) || []}
                            </CustomSelect>
                          )}
                        />

                        {/* Meaning Attributes */}
                        <Controller
                          name={`meanings.${meaningIndex}.attributes`}
                          control={detailedForm.control}
                          render={({ field, fieldState: { error } }) => (
                            <CustomSelect
                              isLoading={meaningAttributesWithRequestedIsLoading}
                              listboxProps={{
                                emptyContent: t("noMeaningAttributesFound"),

                              }}
                              as={'div'}
                              size="lg"
                              classNames={{
                                base: "w-full",
                              }}
                              label={t("meaningAttributes")}
                              placeholder={t("selectMeaningAttributes")}
                              selectionMode="multiple"
                              selectedKeys={field.value || []}
                              onSelectionChange={(keys) => {
                                field.onChange(Array.from(keys));
                              }}
                              isInvalid={!!error}
                              errorMessage={error?.message}
                              endContent={
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  className="mb-5"
                                  onPress={() => setIsMeaningAttributeModalOpen(true)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              }
                            >
                              {meaningAttributesWithRequested?.map((attr: any) => (
                                <SelectItem
                                  key={attr.id.toString()}
                                  endContent={Number(attr.id) < 0 ? (
                                    <Tooltip content={tRequests("RequestedAttributeByYou")}>
                                      <FileClock className="text-warning" />
                                    </Tooltip>
                                  ) : ""}
                                >
                                  {attr.attribute}
                                </SelectItem>
                              )) || []}
                            </CustomSelect>
                          )}
                        />
                      </div>

                      {/* Meaning Text */}
                      <Controller
                        name={`meanings.${meaningIndex}.meaning`}
                        control={detailedForm.control}
                        render={({ field, fieldState: { error } }) => (
                          <CustomTextarea
                            {...field}
                            label={t("meaningText")}
                            placeholder={t("meaningTextPlaceholder")}
                            isRequired
                            isInvalid={!!error}
                            errorMessage={error?.message}
                          />
                        )}
                      />

                      {/* Example Section */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">{t("example")}</h5>

                        <Controller
                          name={`meanings.${meaningIndex}.example.sentence`}
                          control={detailedForm.control}
                          render={({ field, fieldState: { error } }) => (
                            <CustomTextarea
                              {...field}
                              label={t("exampleSentence")}
                              placeholder={t("exampleSentencePlaceholder")}
                              isInvalid={!!error}
                              errorMessage={error?.message}
                            />
                          )}
                        />

                        <div className="flex items-end gap-2">
                          <Controller
                            name={`meanings.${meaningIndex}.example.author`}
                            control={detailedForm.control}
                            render={({ field, fieldState: { error } }) => (
                              <CustomAutocomplete
                                {...field}
                                isLoading={authorsWithRequestedIsLoading}
                                as={'div'}
                                size="lg"
                                classNames={{
                                  base: "w-full",
                                }}
                                label={t("exampleAuthor")}
                                placeholder={t("exampleAuthorPlaceholder")}
                                isInvalid={!!error}
                                errorMessage={error?.message}
                                items={authorsWithRequested?.map((author) => ({
                                  key: author.id.toString(),
                                  label: author.name
                                }))}
                                endContent={
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => setIsAuthorModalOpen(true)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                }
                              >
                                {authorsWithRequested?.map((author) => (
                                  <AutocompleteItem
                                    key={author.id.toString()}
                                    endContent={Number(author.id) < 0 ? (
                                      <Tooltip content={tRequests("RequestedAttributeByYou")}>
                                        <FileClock className="text-warning" />
                                      </Tooltip>
                                    ) : ""}
                                  >
                                    {author.name}
                                  </AutocompleteItem>
                                )) || []}
                              </CustomAutocomplete>
                            )}
                          />
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-sm">{t("image")}</h5>


                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageSelect(file, meaningIndex);
                            }
                          }}
                          className="hidden"
                          id={`image-upload-${meaningIndex}`}
                        />
                        <Button
                          type="button"
                          variant="bordered"
                          size="sm"
                          onPress={() => {
                            document.getElementById(`image-upload-${meaningIndex}`)?.click();
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t("uploadImage")}
                        </Button>

                        {imagePreviewUrls[meaningIndex] && (
                          <div className="flex flex-col gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreviewUrls[meaningIndex]}
                              alt="Uploaded Image"
                              className="rounded object-cover"
                            />
                            <Button
                              type="button"
                              color="danger"
                              onPress={() => {
                                removeImage(meaningIndex);
                              }}
                              endContent={<X className="h-4 w-4" />}
                            >
                              {t("removeImage")}
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onPress={() => appendMeaning({
                          partOfSpeechId: "",
                          meaning: "",
                          attributes: [],
                          example: { sentence: "", author: "" },
                          image: null,
                        })}
                        className="text-primary"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("addMeaning")}
                      </Button>
                    </CustomCard>
                  ))}
                </div>

                {/* Submit Note */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-secondary-600 dark:text-secondary-200">
                    {t("submitNote")}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("submitting") : t("submitContribution")}
                </Button>
              </form>
            </CardBody>
          </CustomCard>
        </Tab>

        <Tab key="simple" title={t("simpleTab")}>
          <CustomCard className="p-6">
            <CardHeader>
              <h2 className="text-lg font-bold">{t("simpleTab")}</h2>
            </CardHeader>
            <CardBody>
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("simpleTabDescription")}
                </p>
              </div>

              <form onSubmit={simpleForm.handleSubmit(onSubmitSimple)} className="space-y-6">
                {/* Word Name */}
                <Controller
                  name="name"
                  control={simpleForm.control}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      {...field}
                      label={t("wordName")}
                      placeholder={t("wordNamePlaceholder")}
                      isRequired
                      isInvalid={!!error}
                      errorMessage={error?.message}
                      size="lg"
                    />
                  )}
                />

                {/* Submit Note */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t("submitNote")}
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("submitting") : t("submitContribution")}
                </Button>
              </form>
            </CardBody>
          </CustomCard>
        </Tab>
      </CustomTabs>

      {/* New Word Attribute Request Modal */}
      <NewWordAttributeRequestModal
        isOpen={isAttributeModalOpen}
        onClose={() => setIsAttributeModalOpen(false)}
        onOpenChange={() => setIsAttributeModalOpen(!isAttributeModalOpen)}
      />
      {/* New Meaning Attribute Request Modal */}
      <NewMeaningAttributeRequestModal
        isOpen={isMeaningAttributeModalOpen}
        onClose={() => setIsMeaningAttributeModalOpen(false)}
        onOpenChange={() => setIsMeaningAttributeModalOpen(!isMeaningAttributeModalOpen)}
        onAttributeRequested={(attribute) => {
          // Optionally add to temporary list for immediate UI feedback
          setRequestedMeaningAttributes(prev => [...prev, attribute]);
        }}
      />
      {/* New Author Request Modal */}
      <NewAuthorRequestModal
        isOpen={isAuthorModalOpen}
        onClose={() => setIsAuthorModalOpen(false)}
        onOpenChange={() => setIsAuthorModalOpen(!isAuthorModalOpen)}
        onAuthorRequested={(author) => {
          // Optionally add to temporary list for immediate UI feedback
          setRequestedAuthors(prev => [...prev, author]);
        }}
      />
    </div>
  );
}
