import { Button, Select, SelectItem, Tooltip, useDisclosure } from "@heroui/react";
import { Control, Controller } from "react-hook-form";
import { WordEditRequestForm } from "../word-edit-request";
import { FileClock, Plus } from "lucide-react";
import NewWordAttributeRequestModal from "./new-word-attribute-request-modal";
import { useTranslations } from "next-intl";
export default function WordAttributesRequestInput({
    control,
    wordAttributes,
    wordAttributesIsLoading,
}: {
    control: Control<WordEditRequestForm>,
    wordAttributes: ({
        id: number;
        attribute: string;
    } | {
        id: number;
        attribute: string;
    })[] | undefined
    wordAttributesIsLoading: boolean
}) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
    const t = useTranslations();
    return (
        <>
            <NewWordAttributeRequestModal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} />
            <Controller
                name="attributes"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Select
                        items={wordAttributes || []}
                        label={t("WordAttribute")}
                        placeholder={t("SelectAttributes")}
                        labelPlacement="outside"
                        selectionMode="multiple"
                        selectedKeys={new Set(value)}
                        onSelectionChange={(keys) => onChange(Array.from(keys))}
                        isLoading={wordAttributesIsLoading}
                        isInvalid={!!error}
                        errorMessage={error?.message}
                        className="w-full"
                        as={"div"}
                        endContent={
                            <Button
                                isIconOnly
                                onPress={onOpen}
                                variant='light'
                            // color='primary'
                            >
                                <div className='sr-only'>
                                    {t("NewWordAttribute")}
                                </div>
                                <Plus></Plus>
                            </Button>
                        }
                    >
                        {(attr) => (
                            <SelectItem endContent={attr.id < 0 ? (
                                <Tooltip content={t("RequestedAttributeByYou")}>
                                    <FileClock className="text-warning" />
                                </Tooltip>) : ""} key={attr.id.toString()}>
                                {attr.attribute}
                            </SelectItem>
                        )}
                    </Select>
                )}
            />
        </>
    )
}
