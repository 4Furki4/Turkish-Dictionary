"use client";

import React from 'react';
import { Card, CardBody, Button } from "@heroui/react";
import { useTranslations } from 'next-intl';
import { CustomMultiSelect } from '../../../components/customs/heroui/custom-multi-select';
import { CustomSelect } from '../../../components/customs/heroui/custom-select';
import { CustomInput } from '../../../components/customs/heroui/custom-input';
import { CustomDateRangePicker } from '../../../components/customs/heroui/custom-date-range-picker';
import { feedbackTypeEnum, feedbackStatusEnum } from '@/db/schema/feedbacks';
import { SearchIcon, FilterX } from 'lucide-react';

export interface FeedbackFilters {
    types: string[];
    statuses: string[];
    searchTerm: string;
    sortBy: "votes" | "createdAt";
    sortOrder: "asc" | "desc";
    startDate: Date | null;
    endDate: Date | null;
}

export interface FeedbackFilterBarProps {
    filters: FeedbackFilters;
    onFiltersChange: (filters: FeedbackFilters) => void;
    onClearFilters: () => void;
}

export function FeedbackFilterBar({
    filters,
    onFiltersChange,
    onClearFilters,
}: FeedbackFilterBarProps) {
    const t = useTranslations("Dashboard.feedback");
    const tCommon = useTranslations("Common");

    // Create options maps for the selects
    const typeOptions = feedbackTypeEnum.enumValues.reduce((acc, type) => {
        acc[type] = t(`types.${type}`);
        return acc;
    }, {} as Record<string, string>);

    const statusOptions = feedbackStatusEnum.enumValues.reduce((acc, status) => {
        acc[status] = t(`statuses.${status}`);
        return acc;
    }, {} as Record<string, string>);

    const sortOptions = {
        votes: t("sort.votes"),
        createdAt: t("sort.createdAt"),
    };

    const sortOrderOptions = {
        desc: tCommon("desc"),
        asc: tCommon("asc"),
    };

    const updateFilters = (updates: Partial<FeedbackFilters>) => {
        onFiltersChange({ ...filters, ...updates });
    };

    const hasActiveFilters =
        filters.types.length > 0 ||
        filters.statuses.length > 0 ||
        filters.searchTerm.trim() !== "" ||
        filters.startDate !== null ||
        filters.endDate !== null;

    return (
        <Card isBlurred className="mb-6">
            <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("filter.title")}</h3>
                    {hasActiveFilters && (
                        <Button
                            size="sm"
                            variant="ghost"
                            color="danger"
                            startContent={<FilterX size={16} />}
                            onPress={onClearFilters}
                        >
                            {t("filter.clear")}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div className="col-span-1 lg:col-span-2 grid lg:grid-cols-2 gap-4">
                        <CustomInput
                            placeholder={t("filter.searchPlaceholder")}
                            value={filters.searchTerm}
                            onValueChange={(value) => updateFilters({ searchTerm: value })}
                            startContent={<SearchIcon size={16} />}
                            isClearable
                            classNames={{
                                base: "w-full"
                            }}
                        />

                        {/* Type Filter */}
                        <CustomMultiSelect
                            options={typeOptions}
                            selectedKeys={filters.types}
                            onSelectionChange={(types) => updateFilters({ types })}
                            placeholder={t("filter.typePlaceholder")}
                            label={t("filter.typeLabel")}
                            classNames={{
                                base: "w-full"
                            }}
                        />

                        {/* Status Filter */}
                        <CustomMultiSelect
                            options={statusOptions}
                            selectedKeys={filters.statuses}
                            onSelectionChange={(statuses) => updateFilters({ statuses })}
                            placeholder={t("filter.statusPlaceholder")}
                            label={t("filter.statusLabel")}
                            classNames={{
                                base: "w-full"
                            }}
                        />

                        {/* Date Range Filter */}
                        <CustomDateRangePicker
                            label={t("filter.dateRangeLabel")}
                            onDateRangeChange={(startDate, endDate) =>
                                updateFilters({ startDate, endDate })
                            }
                            classNames={{
                                base: "w-full"
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Sort By */}
                        <CustomSelect
                            options={sortOptions}
                            selectedKeys={[filters.sortBy]}
                            onSelectionChange={(keys) => {
                                const sortBy = Array.from(keys)[0] as "votes" | "createdAt";
                                updateFilters({ sortBy });
                            }}
                            label={t("filter.sortByLabel")}
                            classNames={{
                                base: "w-full"
                            }}
                        />

                        {/* Sort Order */}
                        <CustomSelect
                            options={sortOrderOptions}
                            selectedKeys={[filters.sortOrder]}
                            onSelectionChange={(keys) => {
                                const sortOrder = Array.from(keys)[0] as "asc" | "desc";
                                updateFilters({ sortOrder });
                            }}
                            label={t("filter.sortOrderLabel")}
                            classNames={{
                                base: "w-full"
                            }}
                        />
                    </div>
                </div>


            </CardBody>
        </Card>
    );
}
