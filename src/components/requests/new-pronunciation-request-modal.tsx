"use client";

import { FC, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import {
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    AutocompleteItem,
} from "@heroui/react";
import { AudioRecorder } from "@/src/components/customs/audio-recorder";
import { CustomAutocomplete } from "../customs/heroui/custom-autocomplete";
import { CustomModal } from "../customs/heroui/custom-modal";
import { useDebounce } from "@uidotdev/usehooks";
import { toast } from "sonner";

interface NewPronunciationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewPronunciationRequestModal: FC<NewPronunciationRequestModalProps> = ({ isOpen, onClose }) => {
    const t = useTranslations("Pronunciation");

    const [selectedWord, setSelectedWord] = useState<{ id: number; name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const utils = api.useUtils()
    const { data: searchResults, isLoading: isLoadingWords } = api.word.getRecommendations.useQuery(
        { query: debouncedSearchTerm },
        { enabled: debouncedSearchTerm.length > 1 }
    );

    const handleSelectionChange = (key: React.Key | null) => {
        if (key === null) {
            setSelectedWord(null);
            return;
        }
        const selected = searchResults?.find(word => word.word_id === Number(key));
        if (selected) {
            setSelectedWord({ id: selected.word_id, name: selected.name });
        }
    };

    const handleClose = () => {
        setSelectedWord(null);
        setSearchTerm("");
        onClose();
    }

    const onSuccess = () => {
        utils.request.getVotablePronunciationRequests.refetch({
            search: searchTerm,
        })
        toast.success(t("submitSuccess"));
        handleClose()
    }

    return (
        <CustomModal isOpen={isOpen} onClose={handleClose}>
            <ModalContent>
                <ModalHeader>{t("new.title")}</ModalHeader>
                <ModalBody>
                    <p>{t("new.description")}</p>
                    <CustomAutocomplete
                        classNames={{
                            base: "w-full"
                        }}
                        listboxProps={{
                            emptyContent: t("new.noResults")
                        }}
                        label={t("new.searchLabel")}
                        placeholder={t("new.searchPlaceholder")}
                        onInputChange={setSearchTerm}
                        onSelectionChange={handleSelectionChange}
                        isLoading={isLoadingWords}
                    >
                        {(searchResults || []).map((word) => (
                            <AutocompleteItem key={word.word_id}>
                                {word.name}
                            </AutocompleteItem>
                        ))}
                    </CustomAutocomplete>

                    {selectedWord && (
                        <AudioRecorder
                            wrapperClassName="w-full flex flex-wrap justify-center items-center"
                            wordId={selectedWord.id}
                            onUploadComplete={onSuccess}
                        />
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={handleClose}>
                        {t("new.cancel")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </CustomModal>
    );
};
