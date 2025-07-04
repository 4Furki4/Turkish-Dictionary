import { useTranslations } from "next-intl";
import OfflineDictionaryClient from "./offline-dictionary-client";
import CustomCard from "@/src/components/customs/heroui/custom-card";
import { CardHeader } from "@heroui/react";

export default function OfflineDictionaryPage() {
    const t = useTranslations("OfflineDictionary");

    return (
        <div className="container flex flex-col justify-center max-w-3xl">

            <CustomCard >
                <CardHeader>
                    {t("title")}
                </CardHeader>
                <OfflineDictionaryClient />
            </CustomCard>
        </div>
    );
}
