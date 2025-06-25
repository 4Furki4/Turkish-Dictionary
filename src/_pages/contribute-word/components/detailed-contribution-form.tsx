"use client";

import React, { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, CardBody, CardHeader } from "@heroui/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { uploadFiles } from "@/src/utils/uploadthing";
import type { Session } from "next-auth";

import { api } from "@/src/trpc/react";
import CustomCard from "@/src/components/customs/heroui/custom-card";
import WordBasicInfoSection from "./word-basic-info-section";
import WordLanguageAndAttributesSection, { type Language, type WordAttribute } from "./word-language-and-attributes-section";
import MeaningFormSection from "./meaning-form-section";
import RelatedItemsSection from "./related-items-section";
import NewWordAttributeRequestModal from "@/src/components/customs/edit-request-modal/word/new-word-attribute-request-modal";
import NewMeaningAttributeRequestModal from "@/src/components/customs/edit-request-modal/meanings/new-meaning-attribute-request-modal";
import NewAuthorRequestModal from "@/src/components/customs/edit-request-modal/meanings/new-author-request-modal";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/src/server/api/root";

interface RelatedItem {
    id: number;
    name: string;
    relationType: string;
}

// Schema for detailed form
const getDetailedFormSchema = (
    wordNameRequiredIntl: string,
    wordNameMinLengthIntl: string,
    meaningRequiredIntl: string,
    meaningMinLengthIntl: string
) => z.object({
    name: z.string().min(1, wordNameRequiredIntl).min(2, wordNameMinLengthIntl),
    phonetic: z.string().optional(),
    prefix: z.string().optional(),
    root: z.string().optional(),
    suffix: z.string().optional(),
    languageCode: z.string().optional(),
    attributes: z.array(z.string()).optional(),
    meanings: z.array(z.object({
        partOfSpeechId: z.string().optional(),
        meaning: z.string().min(1, meaningRequiredIntl).min(1, meaningMinLengthIntl),
        attributes: z.array(z.string()).optional(),
        example: z.object({
            sentence: z.string().optional(),
            author: z.string().optional(),
        }).optional(),
        image: z.array(z.instanceof(File)).optional(),
    })).min(1, "At least one meaning is required"),
});

type DetailedFormData = z.infer<ReturnType<typeof getDetailedFormSchema>>;

export interface PartOfSpeech {
    id: number;
    name: string;
}

export interface MeaningAttribute {
    id: number;
    attribute: string;
}

export interface Author {
    id: number;
    name: string;
}

export interface DetailedContributionFormProps {
    session: Session | null;
    locale: "en" | "tr";
    prefillWord?: string;
    isSubmitting: boolean;
    setIsSubmitting: (submitting: boolean) => void;
}

export default function DetailedContributionForm({
    session,
    locale,
    prefillWord,
    isSubmitting,
    setIsSubmitting,
}: DetailedContributionFormProps) {
    const t = useTranslations("ContributeWord");
    const tRequests = useTranslations("Requests");
    const tForms = useTranslations("Forms");
    const { executeRecaptcha } = useGoogleReCaptcha();

    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [isMeaningAttributeModalOpen, setIsMeaningAttributeModalOpen] = useState(false);
    const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
    const [requestedAttributes, setRequestedAttributes] = useState<string[]>([]);
    const [requestedMeaningAttributes, setRequestedMeaningAttributes] = useState<string[]>([]);
    const [requestedAuthors, setRequestedAuthors] = useState<string[]>([]);

    // Related items state
    const [relatedWords, setRelatedWords] = useState<RelatedItem[]>([]);
    const [relatedPhrases, setRelatedPhrases] = useState<RelatedItem[]>([]);

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
            setIsSubmitting(false);
        },
    });

    // Detailed form setup
    const detailedForm = useForm<DetailedFormData>({
        resolver: zodResolver(getDetailedFormSchema(tForms("Word.Required"), tForms("Word.MinLength2"), tForms("Meanings.Required"), tForms("Meanings.MinLength1"))),
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
                image: undefined,
            }],
        },
    });

    const { fields: meaningFields, append: appendMeaning, remove: removeMeaning } = useFieldArray({
        control: detailedForm.control,
        name: "meanings",
    });

    // Handle image selection for preview
    const handleImageSelect = useCallback((file: File, meaningIndex: number) => {
        try {
            // Validate file size (4MB limit)
            const ONE_MB = 1 * 1024 * 1024;
            if (file.size > ONE_MB) {
                toast.error(t("imageTooLarge"));
                return;
            }

            // Update form data
            const currentMeanings = detailedForm.getValues("meanings");
            currentMeanings[meaningIndex] = {
                ...currentMeanings[meaningIndex],
                image: [file],
            };
            detailedForm.setValue("meanings", currentMeanings);

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setImagePreviewUrls(prev => {
                const newUrls = [...prev];
                newUrls[meaningIndex] = previewUrl;
                return newUrls;
            });
        } catch (error) {
            console.error("Error selecting image:", error);
            toast.error(t("imageSelectError"));
        }
    }, [detailedForm, t]);

    // Remove image
    const removeImage = useCallback((meaningIndex: number) => {
        const currentMeanings = detailedForm.getValues("meanings");
        currentMeanings[meaningIndex] = {
            ...currentMeanings[meaningIndex],
            image: undefined,
        };
        detailedForm.setValue("meanings", currentMeanings);

        setImagePreviewUrls(prev => {
            const newUrls = [...prev];
            if (newUrls[meaningIndex]) {
                URL.revokeObjectURL(newUrls[meaningIndex]);
                newUrls[meaningIndex] = "";
            }
            return newUrls;
        });
    }, [detailedForm]);

    // Related items handlers
    const handleAddRelatedWord = useCallback((item: RelatedItem) => {
        setRelatedWords(prev => {
            // Check if item already exists
            if (prev.some(word => word.id === item.id && word.relationType === item.relationType)) {
                toast.error(t("itemAlreadyAdded"));
                return prev;
            }
            return [...prev, item];
        });
    }, [t]);

    const handleRemoveRelatedWord = useCallback((id: number) => {
        setRelatedWords(prev => prev.filter(word => word.id !== id));
    }, []);

    const handleAddRelatedPhrase = useCallback((item: RelatedItem) => {
        setRelatedPhrases(prev => {
            // Check if item already exists
            if (prev.some(phrase => phrase.id === item.id && phrase.relationType === item.relationType)) {
                toast.error(t("itemAlreadyAdded"));
                return prev;
            }
            return [...prev, item];
        });
    }, [t]);

    const handleRemoveRelatedPhrase = useCallback((id: number) => {
        setRelatedPhrases(prev => prev.filter(phrase => phrase.id !== id));
    }, []);

    // Submit detailed form
    const onSubmitDetailed = async (data: DetailedFormData) => {
        if (!executeRecaptcha) {
            toast.error(t("captchaFailed"));
            return;
        }

        setIsSubmitting(true);
        try {
            const captchaToken = await executeRecaptcha("submit_full_word_request");

            // Upload images first
            const uploadedImageUrls: string[] = [];
            let imageIndex = 0;

            for (const meaning of data.meanings) {
                if (meaning.image?.[0]) {
                    const uploadResult = await uploadFiles("imageUploader", {
                        files: [meaning.image[0]],
                    });

                    if (uploadResult && uploadResult.length > 0) {
                        uploadedImageUrls[imageIndex] = uploadResult[0]!.url;
                    }
                    imageIndex++;
                }
            }

            // Reset imageIndex for the actual submission
            imageIndex = 0;

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
                relatedWords: relatedWords.map(word => ({
                    relatedWordId: word.id,
                    relationType: word.relationType,
                })),
                relatedPhrases: relatedPhrases.map(phrase => ({
                    relatedWordId: phrase.id,
                    relationType: phrase.relationType,
                })),
            };

            await createFullWordRequest.mutateAsync(formattedData);
            detailedForm.reset();
            setImagePreviewUrls([]);
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || t("submissionError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
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
                        {/* Word Basic Info */}
                        <WordBasicInfoSection
                            control={detailedForm.control}
                            errors={detailedForm.formState.errors}
                        />

                        {/* Language and Attributes */}
                        <WordLanguageAndAttributesSection
                            control={detailedForm.control}
                            errors={detailedForm.formState.errors}
                            languages={languages as Language[]}
                            languagesIsLoading={languagesIsLoading}
                            wordAttributesWithRequested={wordAttributesWithRequested as WordAttribute[]}
                            wordAttributesWithRequestedIsLoading={wordAttributesWithRequestedIsLoading}
                            requestedAttributes={requestedAttributes}
                            locale={locale}
                            onOpenAttributeModal={() => setIsAttributeModalOpen(true)}
                        />

                        {/* Related Words and Phrases */}
                        <RelatedItemsSection
                            relatedWords={relatedWords}
                            relatedPhrases={relatedPhrases}
                            onAddRelatedWord={handleAddRelatedWord}
                            onRemoveRelatedWord={handleRemoveRelatedWord}
                            onAddRelatedPhrase={handleAddRelatedPhrase}
                            onRemoveRelatedPhrase={handleRemoveRelatedPhrase}
                        />
                        {/* Meanings Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t("meanings")}</h3>
                            {meaningFields.map((field, meaningIndex) => (
                                <MeaningFormSection
                                    key={field.id}
                                    meaningIndex={meaningIndex}
                                    control={detailedForm.control}
                                    errors={detailedForm.formState.errors}
                                    partsOfSpeech={partsOfSpeech?.map(pos => ({
                                        id: pos.id,
                                        name: (pos as any).partOfSpeech || (pos as any).name
                                    })) as PartOfSpeech[]}
                                    partsOfSpeechIsLoading={partsOfSpeechIsLoading}
                                    meaningAttributesWithRequested={meaningAttributesWithRequested as MeaningAttribute[]}
                                    meaningAttributesWithRequestedIsLoading={meaningAttributesWithRequestedIsLoading}
                                    authorsWithRequested={authorsWithRequested as Author[]}
                                    authorsWithRequestedIsLoading={authorsWithRequestedIsLoading}
                                    requestedMeaningAttributes={requestedMeaningAttributes}
                                    requestedAuthors={requestedAuthors}
                                    imagePreviewUrl={imagePreviewUrls[meaningIndex]}
                                    onOpenMeaningAttributeModal={() => setIsMeaningAttributeModalOpen(true)}
                                    onOpenAuthorModal={() => setIsAuthorModalOpen(true)}
                                    onImageSelect={handleImageSelect}
                                    onRemoveImage={removeImage}
                                    onAddMeaning={() => appendMeaning({
                                        partOfSpeechId: "",
                                        meaning: "",
                                        attributes: [],
                                        example: { sentence: "", author: "" },
                                        image: undefined,
                                    })}
                                    onRemoveMeaning={removeMeaning}
                                    isLastMeaning={meaningIndex === meaningFields.length - 1}
                                    isFirstMeaning={meaningIndex === 0}
                                    totalMeanings={meaningFields.length}
                                />
                            ))}
                        </div>
                        <Button
                            type="submit"
                            color="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isSubmitting}
                            isDisabled={isSubmitting}
                        >
                            {tForms("Submit")}
                        </Button>
                    </form>
                </CardBody>
            </CustomCard>

            {/* Request Modals */}
            <NewWordAttributeRequestModal
                isOpen={isAttributeModalOpen}
                onClose={() => setIsAttributeModalOpen(false)}
                onOpenChange={() => setIsAttributeModalOpen(false)}
            />

            <NewMeaningAttributeRequestModal
                isOpen={isMeaningAttributeModalOpen}
                onClose={() => setIsMeaningAttributeModalOpen(false)}
                onOpenChange={() => setIsMeaningAttributeModalOpen(false)}
            />

            <NewAuthorRequestModal
                isOpen={isAuthorModalOpen}
                onClose={() => setIsAuthorModalOpen(false)}
                onOpenChange={() => setIsAuthorModalOpen(false)}
            />
        </>
    );
}
