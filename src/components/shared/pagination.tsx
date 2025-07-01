"use client";

import { FC } from "react";
import { Button, ButtonGroup } from "@heroui/react";
import { useTranslations } from "next-intl";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const t = useTranslations("Requests.messages");

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-between items-center">
            <Button onPress={handlePrevious} disabled={currentPage === 1}>
                {t("previous")}
            </Button>
            <ButtonGroup>
                {getPageNumbers().map((page, index) =>
                    typeof page === "number" ? (
                        <Button
                            key={index}
                            variant={currentPage === page ? "solid" : "bordered"}
                            onPress={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    ) : (
                        <Button key={index} disabled>
                            {page}
                        </Button>
                    )
                )}
            </ButtonGroup>
            <Button onPress={handleNext} disabled={currentPage === totalPages}>
                {t("next")}
            </Button>
        </div>
    );
};
