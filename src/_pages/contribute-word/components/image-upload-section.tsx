"use client";

import React from "react";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";

export interface ImageUploadSectionProps {
  meaningIndex: number;
  imagePreviewUrl?: string;
  onImageSelect: (file: File, meaningIndex: number) => void;
  onRemoveImage: (meaningIndex: number) => void;
}

export default function ImageUploadSection({
  meaningIndex,
  imagePreviewUrl,
  onImageSelect,
  onRemoveImage,
}: ImageUploadSectionProps) {
  const t = useTranslations("ContributeWord");

  return (
    <div className="space-y-3">
      <h5 className="font-medium text-sm">{t("image")}</h5>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImageSelect(file, meaningIndex);
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

      {imagePreviewUrl && (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreviewUrl}
            alt="Uploaded Image"
            className="rounded object-cover"
          />
          <Button
            type="button"
            color="danger"
            onPress={() => {
              onRemoveImage(meaningIndex);
            }}
            endContent={<X className="h-4 w-4" />}
          >
            {t("removeImage")}
          </Button>
        </div>
      )}
    </div>
  );
}
