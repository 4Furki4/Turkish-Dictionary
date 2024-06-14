"use client"
import { api } from '@/src/trpc/react';
import { Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react'
import { toast } from 'sonner';

export default function SaveWord({
    word_data,
    isSavedWord
}: {
    word_data: any, isSavedWord?: boolean
}) {
    const savedWordsQuery = api.user.getWordSaveStatus.useQuery(word_data.word_id, {
        initialData: isSavedWord
    })
    const t = useTranslations("WordCard");
    const utils = api.useUtils()
    const saveWordMutation = api.user.saveWord.useMutation({
        onMutate: async ({ wordId }) => {
            await utils.user.getWordSaveStatus.cancel(wordId)
            const previousValue = utils.user.getWordSaveStatus.getData(wordId);
            utils.user.getWordSaveStatus.setData(wordId, !previousValue);
            return { previousValue };
        },
        onError: (error, { wordId }, context) => {
            switch (error.message) {
                case "UNAUTHORIZED":
                    toast.error(t("UnauthSave"), {
                        position: "bottom-center",
                    });
                    utils.user.getWordSaveStatus.setData(wordId, context?.previousValue)
                    break;
            }
        },
        // Always refetch after error or success:
        onSettled: (newValue, error, { wordId }) => {
            void utils.user.getWordSaveStatus.invalidate(wordId)
        },
    });
    return (
        <button
            className="absolute top-4 right-6 cursor-pointer z-50 sm:hover:scale-125 transition-all"
            onClick={async () => {
                await saveWordMutation.mutateAsync({ wordId: word_data.word_id });
            }}
            disabled={saveWordMutation.isPending}
        >
            <Bookmark
                aria-label="bookmark icon"
                size={32}
                fill={savedWordsQuery.data ? "#F59E0B" : "#fff"}
            />
        </button>
    )
}
