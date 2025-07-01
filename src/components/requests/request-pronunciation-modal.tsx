"use client";

import { FC, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import {
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { AudioRecorder } from "@/src/components/customs/audio-recorder";
import { toast } from "sonner";
import { CustomModal } from "../customs/heroui/custom-modal";

interface RequestPronunciationModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchTerm: string;
}

export const RequestPronunciationModal: FC<RequestPronunciationModalProps> = ({ isOpen, onClose, searchTerm }) => {
    const t = useTranslations("PronunciationVoting");
    const [wordId, setWordId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { refetch } = api.search.getWordId.useQuery(
        { name: searchTerm },
        { enabled: false } // Initially disable this query
    );

    useEffect(() => {
        if (isOpen && searchTerm) {
            const findWord = async () => {
                const { data, error } = await refetch();
                if (data) {
                    setWordId(data.wordId);
                    setError(null);
                } else {
                    setError(t("wordNotFound", { searchTerm }));
                    toast.error(t("wordNotFound", { searchTerm }));
                }
            };
            findWord();
        }
    }, [isOpen, searchTerm, refetch, t]);

    const handleUploadComplete = () => {
        toast.success(t("uploadComplete"));
        onClose();
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>{t("requestPronunciationFor", { searchTerm: searchTerm })}</ModalHeader>
                <ModalBody className="flex items-center justify-center flex-wrap">
                    {error && <p className="text-danger">{error}</p>}
                    {wordId !== null && (
                        <AudioRecorder
                            wrapperClassName="flex flex-col gap-4"
                            wordId={wordId}
                            onUploadComplete={handleUploadComplete}
                        />
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        {t("cancel")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </CustomModal>
    );
};
