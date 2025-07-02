import CustomCard from "@/src/components/customs/heroui/custom-card";
import { CardBody, CardHeader } from "@heroui/react";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const generateMetadata = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("Offline");
    return {
        title: t("title"),
        description: t("description"),
        robots: {
            index: false,
            follow: false,
            googleBot: {
                index: false,
                follow: false
            }
        }
    };
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("Offline");
    return (
        <div className="flex items-center justify-center mx-auto">
            <CustomCard className="p-6">
                <CardHeader>
                    <h1>{t("title")}</h1>
                </CardHeader>
                <CardBody>
                    <p>{t("description")}</p>
                </CardBody>
            </CustomCard>
        </div >
    );
}