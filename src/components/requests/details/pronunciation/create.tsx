import { FC } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { RequestDetailComponentProps } from "../registry";


export const CreatePronunciation: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
    const t = useTranslations("RequestDetails");

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("Pronunciation.title")}</h3>
            {oldData && (
                <div>
                    <p className="text-sm text-gray-500">{t("Pronunciation.relatedWord")}</p>
                    <Link href={`/word/${oldData.name}`} className="text-primary hover:underline">
                        {oldData.name}
                    </Link>
                </div>
            )}
            <div>
                <p className="text-sm text-gray-500">{t("Pronunciation.audioRecording")}</p>
                <audio controls src={newData.audio_url} className="w-full mt-2">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>
    );
};

export default CreatePronunciation;
