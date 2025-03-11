"use client"
import { api } from "@/src/trpc/react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Select,
  SelectItem,
  Card,
  CardBody,
  Button
} from "@heroui/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { EntityTypes, Actions, Status, entityTypesEnum, actionsEnum, statusEnum } from "@/db/schema/requests";
import { Link } from "@/src/i18n/routing";
import { Pagination } from "@heroui/pagination";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export default function RequestsList() {
  const t = useTranslations("Requests");

  const entityTypeLabels = useMemo<Record<EntityTypes, string>>(() => ({
    words: t("entityTypes.words"),
    meanings: t("entityTypes.meanings"),
    roots: t("entityTypes.roots"),
    related_words: t("entityTypes.related_words"),
    part_of_speechs: t("entityTypes.part_of_speechs"),
    examples: t("entityTypes.examples"),
    authors: t("entityTypes.authors"),
    word_attributes: t("entityTypes.word_attributes"),
    meaning_attributes: t("entityTypes.meaning_attributes"),
  }), [t]);

  const actionLabels = useMemo<Record<Actions, string>>(() => ({
    create: t("actions.create"),
    update: t("actions.update"),
    delete: t("actions.delete"),
  }), [t]);

  const statusLabels = useMemo<Record<Status, string>>(() => ({
    pending: t("status.pending"),
    approved: t("status.approved"),
    rejected: t("status.rejected"),
  }), [t]);

  const actionColors = useMemo<Record<Actions, "primary" | "warning" | "danger">>(() => ({
    create: "primary",
    update: "warning",
    delete: "danger",
  }), []);

  const statusColors = useMemo<Record<Status, "primary" | "success" | "danger">>(() => ({
    pending: "primary",
    approved: "success",
    rejected: "danger",
  }), []);

  const requestsPerPageOptions = [
    { label: "5", key: "5" },
    { label: "10", key: "10" },
    { label: "20", key: "20" },
    { label: "50", key: "50" }
  ];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialPerPage = Number(searchParams.get('per_page')) || 10;
  const initialEntityType = searchParams.get('entityType') as EntityTypes | "all" || "all";
  const initialAction = searchParams.get('action') as Actions | "all" || "all";
  const initialStatus = searchParams.get('status') as Status | "all" || "all";

  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [requestsPerPage, setRequestsPerPage] = useState<number>(initialPerPage);
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityTypes | "all">(initialEntityType);
  const [actionFilter, setActionFilter] = useState<Actions | "all">(initialAction);
  const [statusFilter, setStatusFilter] = useState<Status | "all">(initialStatus);

  // Update URL when parameters change
  const updateQueryParams = useCallback((params: {
    page?: number;
    per_page?: number;
    entityType?: string;
    action?: string;
    status?: string;
  }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value.toString());
      } else {
        newSearchParams.delete(key);
      }
    });

    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [pathname, router, searchParams]);

  // Handle parameter changes
  useEffect(() => {
    updateQueryParams({
      page: pageNumber,
      per_page: requestsPerPage,
      entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
      action: actionFilter !== "all" ? actionFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined
    });
  }, [pageNumber, requestsPerPage, entityTypeFilter, actionFilter, statusFilter, updateQueryParams]);

  const { data, isLoading, isError } = api.request.getUserRequests.useQuery({
    page: pageNumber,
    limit: requestsPerPage,
    entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }, {
    placeholderData: keepPreviousData,
    // Prevent request when filters are invalid
    enabled: !(
      (entityTypeFilter !== "all" && !entityTypesEnum.enumValues.includes(entityTypeFilter as EntityTypes)) ||
      (actionFilter !== "all" && !actionsEnum.enumValues.includes(actionFilter as Actions)) ||
      (statusFilter !== "all" && !statusEnum.enumValues.includes(statusFilter as Status))
    )
  });

  const renderCell = useCallback((request: Row, columnKey: React.Key) => {
    switch (columnKey) {
      case "entityType":
        return entityTypeLabels[request.entityType] || request.entityType;
      case "action":
        return (
          <Chip color={actionColors[request.action]} variant="flat">
            {actionLabels[request.action] || request.action}
          </Chip>
        );
      case "status":
        return (
          <Chip color={statusColors[request.status]} variant="flat">
            {statusLabels[request.status] || request.status}
          </Chip>
        );
      case "date":
        return request.requestDate
          ? formatDistanceToNow(new Date(request.requestDate), {
            addSuffix: true,
          })
          : "Unknown";
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Link
              className="text-secondary hover:underline"
              href={`/requests/${request.id}` as any}
            >
              {t("buttons.viewDetails")}
            </Link>
            {request.status === "pending" && (
              <Button
                size="sm"
                color="danger"
                variant="light"
                as={Link}
                href={`/requests/${request.id}?action=cancel` as any}
              >
                {t("buttons.cancel")}
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [actionColors, actionLabels, entityTypeLabels, statusColors, statusLabels, t]);

  if (isError) {
    return (
      <Card>
        <CardBody className="flex h-40 items-center justify-center">
          <p className="text-center text-danger">{t("messages.errorLoading")}</p>
        </CardBody>
      </Card>
    );
  }

  const { requests, pagination } = data || { requests: [], pagination: { totalPages: 1, totalCount: 0 } };
  const totalPageNumber = pagination?.totalPages || 1;

  const columns = [
    { key: "entityType", label: t("tableColumns.entityType") },
    { key: "action", label: t("tableColumns.action") },
    { key: "status", label: t("tableColumns.status") },
    { key: "date", label: t("tableColumns.date") },
    { key: "actions", label: t("tableColumns.actions") },
  ];

  type Row = {
    id: number;
    entityType: EntityTypes;
    entityId: number | null;
    action: Actions;
    status: Status;
    requestDate: Date | null;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("myRequests")}</h1>
      <Card>
        <CardBody>
          <Table
            topContent={(
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    size="sm"
                    label={t("entityTypes.title")}
                    selectedKeys={[entityTypeFilter]}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEntityTypeFilter(value === "all" ? "all" : value as EntityTypes);
                    }}
                    className="w-full sm:w-48"
                  >
                    <>
                      <SelectItem key="all" value="all">{t("entityTypes.all")}</SelectItem>
                      {Object.entries(entityTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </>
                  </Select>

                  <Select
                    size="sm"
                    label={t("actions.title")}
                    selectedKeys={[actionFilter]}
                    selectionMode="single"
                    disallowEmptySelection
                    onChange={(e) => {
                      const value = e.target.value;
                      setActionFilter(value === "all" ? "all" : value as Actions);
                    }}
                    className="w-full sm:w-36"
                  >
                    <>
                      <SelectItem key="all" value="all">{t("actions.all")}</SelectItem>
                      {Object.entries(actionLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </>
                  </Select>

                  <Select
                    size="sm"
                    label={t("status.title")}
                    selectedKeys={[statusFilter]}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStatusFilter(value === "all" ? "all" : value as Status);
                    }}
                    className="w-full sm:w-36"
                  >
                    <>
                      <SelectItem key="all" value="all">{t("status.all")}</SelectItem>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </>
                  </Select>

                  <Select
                    label={t("messages.itemsPerPage")}
                    defaultSelectedKeys={[requestsPerPage.toString()]}
                    size="sm"
                    classNames={{
                      base: "ml-auto sm:max-w-64",
                    }}
                    onChange={(e) => {
                      setRequestsPerPage(parseInt(e.target.value));
                      setPageNumber(1); // Reset to first page on requests per page change
                    }}
                  >
                    {requestsPerPageOptions.map((pageCount) => (
                      <SelectItem key={pageCount.key}>
                        {pageCount.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            )}
            aria-label="User requests table"
            classNames={{
              base: ["min-h-[300px]"],
            }}
            isStriped
            bottomContent={
              <Pagination
                isDisabled={totalPageNumber === undefined}
                classNames={{
                  wrapper: ["mx-auto"]
                }}
                isCompact
                showControls
                total={totalPageNumber}
                initialPage={pageNumber}
                page={pageNumber}
                onChange={(page) => {
                  setPageNumber(page);
                }}
              />
            }
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={(requests || [])}
              loadingContent={<Spinner />}
              loadingState={isLoading ? "loading" : "idle"}
              emptyContent={
                <div className="py-8 text-center">
                  <p className="text-center text-gray-500">{t("messages.noRequests")}</p>
                </div>
              }
            >
              {(request) => (
                <TableRow key={request.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(request, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
