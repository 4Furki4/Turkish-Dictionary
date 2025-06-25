import { useTranslations } from "next-intl";

export interface ContributeWordHeaderProps {}

export default function ContributeWordHeader({}: ContributeWordHeaderProps) {
  const t = useTranslations("ContributeWord");

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
      <p className="text-gray-600 dark:text-gray-400">{t("description")}</p>
    </div>
  );
}
