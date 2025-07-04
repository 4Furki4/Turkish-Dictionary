import { useTranslations } from "next-intl";
import OfflineDictionaryClient from "./offline-dictionary-client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OfflineDictionaryPage() {
    const t = useTranslations("OfflineDictionary");

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <OfflineDictionaryClient />
            </Card>
        </div>
    );
}
