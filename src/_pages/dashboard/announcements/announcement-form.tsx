"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Tabs,
  Tab,
  Divider,
  DatePicker,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/src/components/markdown-renderer";

// Schema for form validation
const announcementFormSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(["draft", "published", "archived"]),
  imageUrl: z.string().url().optional().nullable(),
  actionUrl: z.string().url().optional().nullable(),
  actionTextKey: z.string().optional().nullable(),
  publishedAt: z.date().optional().nullable(),
  translations: z.object({
    en: z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().optional().nullable(),
      excerpt: z.string().optional().nullable(),
    }),
    tr: z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().optional().nullable(),
      excerpt: z.string().optional().nullable(),
    }),
  }),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

interface AnnouncementFormProps {
  initialData?: {
    id: number;
    slug: string;
    status: string;
    imageUrl: string | null;
    actionUrl: string | null;
    actionTextKey: string | null;
    publishedAt: Date | null;
    translations: {
      en: {
        title: string;
        content: string | null;
        excerpt: string | null;
      } | null;
      tr: {
        title: string;
        content: string | null;
        excerpt: string | null;
      } | null;
    };
  };
}

export default function AnnouncementForm({ initialData }: AnnouncementFormProps) {
  const t = useTranslations("Dashboard.Announcements");
  const router = useRouter();
  const [previewTab, setPreviewTab] = React.useState<"en" | "tr">("en");
  
  // Default values for the form
  const defaultValues: AnnouncementFormValues = {
    slug: initialData?.slug || "",
    status: (initialData?.status as "draft" | "published" | "archived") || "draft",
    imageUrl: initialData?.imageUrl || null,
    actionUrl: initialData?.actionUrl || null,
    actionTextKey: initialData?.actionTextKey || null,
    publishedAt: initialData?.publishedAt || null,
    translations: {
      en: {
        title: initialData?.translations?.en?.title || "",
        content: initialData?.translations?.en?.content || null,
        excerpt: initialData?.translations?.en?.excerpt || null,
      },
      tr: {
        title: initialData?.translations?.tr?.title || "",
        content: initialData?.translations?.tr?.content || null,
        excerpt: initialData?.translations?.tr?.excerpt || null,
      },
    },
  };

  // Initialize form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues,
  });

  // Watch content for preview
  const enContent = watch("translations.en.content");
  const trContent = watch("translations.tr.content");

  // Create mutation
  const { mutate: createAnnouncement } = api.admin.announcements.createAnnouncement.useMutation({
    onSuccess: () => {
      toast.success(t("createSuccess"));
      router.push("/dashboard/announcements");
    },
    onError: (error) => {
      toast.error(t("createError", { error: error.message }));
    },
  });

  // Update mutation
  const { mutate: updateAnnouncement } = api.admin.announcements.updateAnnouncement.useMutation({
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      router.push("/dashboard/announcements");
    },
    onError: (error) => {
      toast.error(t("updateError", { error: error.message }));
    },
  });

  // Form submission handler
  const onSubmit = (data: AnnouncementFormValues) => {
    if (initialData) {
      // Update existing announcement
      updateAnnouncement({
        id: initialData.id,
        ...data,
      });
    } else {
      // Create new announcement
      createAnnouncement(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">{t("generalInfo")}</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label={t("form.slug")}
                placeholder={t("form.slugPlaceholder")}
                errorMessage={errors.slug?.message}
                isInvalid={!!errors.slug}
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label={t("form.status")}
                errorMessage={errors.status?.message}
                isInvalid={!!errors.status}
              >
                <SelectItem key="draft" value="draft">
                  {t("status.draft")}
                </SelectItem>
                <SelectItem key="published" value="published">
                  {t("status.published")}
                </SelectItem>
                <SelectItem key="archived" value="archived">
                  {t("status.archived")}
                </SelectItem>
              </Select>
            )}
          />

          <Controller
            name="imageUrl"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                label={t("form.imageUrl")}
                placeholder={t("form.imageUrlPlaceholder")}
                errorMessage={errors.imageUrl?.message}
                isInvalid={!!errors.imageUrl}
              />
            )}
          />

          <Controller
            name="actionUrl"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                label={t("form.actionUrl")}
                placeholder={t("form.actionUrlPlaceholder")}
                errorMessage={errors.actionUrl?.message}
                isInvalid={!!errors.actionUrl}
              />
            )}
          />

          <Controller
            name="actionTextKey"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                label={t("form.actionTextKey")}
                placeholder={t("form.actionTextKeyPlaceholder")}
                errorMessage={errors.actionTextKey?.message}
                isInvalid={!!errors.actionTextKey}
              />
            )}
          />

          <Controller
            name="publishedAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                label={t("form.publishedAt")}
                placeholder={t("form.publishedAtPlaceholder")}
                value={field.value}
                onChange={field.onChange}
                errorMessage={errors.publishedAt?.message}
                isInvalid={!!errors.publishedAt}
              />
            )}
          />
        </CardBody>
      </Card>

      <Tabs aria-label="Announcement Content Tabs">
        <Tab key="content" title={t("form.contentTab")}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">{t("form.englishContent")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Controller
                name="translations.en.title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("form.title")}
                    placeholder={t("form.titlePlaceholder")}
                    errorMessage={errors.translations?.en?.title?.message}
                    isInvalid={!!errors.translations?.en?.title}
                  />
                )}
              />

              <Controller
                name="translations.en.excerpt"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.excerpt")}
                    placeholder={t("form.excerptPlaceholder")}
                    errorMessage={errors.translations?.en?.excerpt?.message}
                    isInvalid={!!errors.translations?.en?.excerpt}
                  />
                )}
              />

              <Controller
                name="translations.en.content"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.content")}
                    placeholder={t("form.contentPlaceholder")}
                    errorMessage={errors.translations?.en?.content?.message}
                    isInvalid={!!errors.translations?.en?.content}
                    minRows={10}
                  />
                )}
              />
            </CardBody>

            <Divider />

            <CardHeader>
              <h2 className="text-xl font-bold">{t("form.turkishContent")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Controller
                name="translations.tr.title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t("form.title")}
                    placeholder={t("form.titlePlaceholder")}
                    errorMessage={errors.translations?.tr?.title?.message}
                    isInvalid={!!errors.translations?.tr?.title}
                  />
                )}
              />

              <Controller
                name="translations.tr.excerpt"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.excerpt")}
                    placeholder={t("form.excerptPlaceholder")}
                    errorMessage={errors.translations?.tr?.excerpt?.message}
                    isInvalid={!!errors.translations?.tr?.excerpt}
                  />
                )}
              />

              <Controller
                name="translations.tr.content"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    label={t("form.content")}
                    placeholder={t("form.contentPlaceholder")}
                    errorMessage={errors.translations?.tr?.content?.message}
                    isInvalid={!!errors.translations?.tr?.content}
                    minRows={10}
                  />
                )}
              />
            </CardBody>
          </Card>
        </Tab>

        <Tab key="preview" title={t("form.previewTab")}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{t("form.preview")}</h2>
                <Tabs 
                  aria-label="Preview Language" 
                  selectedKey={previewTab}
                  onSelectionChange={(key) => setPreviewTab(key as "en" | "tr")}
                  size="sm"
                >
                  <Tab key="en" title={t("languages.en")} />
                  <Tab key="tr" title={t("languages.tr")} />
                </Tabs>
              </div>
            </CardHeader>
            <CardBody>
              {previewTab === "en" ? (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">{watch("translations.en.title") || t("form.noTitle")}</h1>
                  {watch("translations.en.excerpt") && (
                    <p className="text-gray-600 dark:text-gray-400 italic">{watch("translations.en.excerpt")}</p>
                  )}
                  {enContent ? (
                    <MarkdownRenderer content={enContent} />
                  ) : (
                    <p className="text-gray-500">{t("form.noContent")}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold">{watch("translations.tr.title") || t("form.noTitle")}</h1>
                  {watch("translations.tr.excerpt") && (
                    <p className="text-gray-600 dark:text-gray-400 italic">{watch("translations.tr.excerpt")}</p>
                  )}
                  {trContent ? (
                    <MarkdownRenderer content={trContent} />
                  ) : (
                    <p className="text-gray-500">{t("form.noContent")}</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          variant="flat"
          onPress={() => router.push("/dashboard/announcements")}
          disabled={isSubmitting}
        >
          {t("cancel")}
        </Button>
        <Button
          color="primary"
          type="submit"
          isLoading={isSubmitting}
        >
          {initialData ? t("update") : t("create")}
        </Button>
      </div>
    </form>
  );
}
