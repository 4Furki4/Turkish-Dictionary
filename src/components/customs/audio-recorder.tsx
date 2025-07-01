"use client";

import { useState, FC } from "react";
import { useAudioRecorder } from "@/src/hooks/use-audio-recorder";
import { useUploadThing } from "@/src/utils/uploadthing";
import { api } from "@/src/trpc/react";
import { Button } from "@heroui/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  wordId: number;
  onUploadComplete: () => void;
  wrapperClassName?: string;
}

export const AudioRecorder: FC<AudioRecorderProps> = ({ wordId, onUploadComplete, wrapperClassName }) => {
  const t = useTranslations("Pronunciation");
  const { isRecording, audioBlob, startRecording, stopRecording, resetRecording } = useAudioRecorder();
  const [isUploading, setIsUploading] = useState(false);

  const createPronunciation = api.request.createPronunciationRequest.useMutation({
    onSuccess: () => {
      resetRecording();
      onUploadComplete();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { startUpload } = useUploadThing("audioUploader", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (res && res[0]) {
        createPronunciation.mutate(
          { word_id: wordId, audio_url: res[0].url },
        );
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false);
      toast.error(t("uploadFailed", { error: error.message }));
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const handleUpload = () => {
    if (audioBlob) {
      const fileExtension = audioBlob.type.split('/')[1];
      const fileName = `pronunciation.${fileExtension}`;
      const file = new File([audioBlob], fileName, { type: audioBlob.type });
      startUpload([file]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {!isRecording && !audioBlob && <Button color="primary" onPress={startRecording}>{t("record")}</Button>}

        {isRecording && (
          <Button onPress={stopRecording} color="danger">
            {t("stop")}
          </Button>
        )}

        {audioBlob && !isRecording && (
          <div className={cn("flex items-center gap-2", wrapperClassName)}>
            <audio src={URL.createObjectURL(audioBlob)} controls />
            <Button onPress={handleUpload} disabled={isUploading} color="primary">
              {isUploading ? t("uploading") : t("submit")}
            </Button>
            <Button onPress={resetRecording} variant="bordered" color="danger">
              {t("recordAgain")}
            </Button>
          </div>
        )}
      </div>
      {isRecording && <div className="text-sm text-danger">{t("recordingInProgress")}</div>}
    </div>
  );
};

