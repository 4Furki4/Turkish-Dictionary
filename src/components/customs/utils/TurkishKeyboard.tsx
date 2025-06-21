import { Button, ButtonProps } from "@heroui/react";

type TurkishKeyboardProps = {
    onCharClick: (char: string) => void;
};

export function TurkishKeyboard({ onCharClick, ...props }: TurkishKeyboardProps & ButtonProps) {
    const specialChars = ["â", "î", "û", "ç", "ğ", "ı", "ö", "ş", "ü"];

    return (

        specialChars.map((char) => (
            <Button
                key={char}
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => onCharClick(char)}
                className="font-bold"
                {...props}
            >
                {char}
            </Button>
        ))
    );
}