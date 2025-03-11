"use client"
import { api } from "@/src/trpc/react";
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  Button,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import { EntityTypes, Actions, Status } from "@/db/schema/requests";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

export interface RequestDetailProps {
  requestId: number;
}

type EntityData = Record<string, unknown>;

export default function RequestDetail({ requestId }: RequestDetailProps) {
  const t = useTranslations("Requests");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, unknown>>({});

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

  // Fetch request data
  const { data, isLoading, isError } = api.request.getUserRequest.useQuery({ requestId });

  // Cancel request mutation
  const cancelRequestMutation = api.request.cancelRequest.useMutation({
    onSuccess: () => {
      router.push("/requests");
    },
  });

  // Update request mutation
  const updateRequestMutation = api.request.updateRequest.useMutation({
    onSuccess: () => {
      router.push("/requests");
    },
  });

  const handleCancelRequest = useCallback(() => {
    cancelRequestMutation.mutate({ requestId });
  }, [cancelRequestMutation, requestId]);

  const handleUpdateRequest = useCallback(() => {
    updateRequestMutation.mutate({
      requestId,
      newData: editedData,
      reason: reason || data?.request.reason || "",
    });
  }, [updateRequestMutation, requestId, editedData, reason, data]);

  const handleEditData = (key: string, value: unknown) => {
    setEditedData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center">
        <p className="text-danger">{t("errors.requestNotFound")}</p>
        <Button
          color="primary"
          variant="flat"
          onPress={() => router.push("/requests")}
          className="mt-4"
        >
          {t("buttons.backToRequests")}
        </Button>
      </div>
    );
  }

  const request = data.request;
  let newData: Record<string, unknown> = {};
  
  // Extract new data from request
  try {
    if (request.newData && typeof request.newData === 'string') {
      newData = JSON.parse(request.newData);
    } else if (request.newData && typeof request.newData === 'object') {
      newData = request.newData as Record<string, unknown>;
    }
  } catch (error) {
    console.error("Failed to parse new data:", error);
  }

  // Get entity data from the API response
  const entityData = data.entityData as EntityData | null;

  const isPending = request.status === "pending";
  const isCreateRequest = request.action === "create";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button
          color="default"
          variant="flat"
          onPress={() => router.push("/requests")}
          startContent={<span className="i-heroicons:arrow-left h-4 w-4" />}
        >
          {t("buttons.back")}
        </Button>
      </div>

      <Card className="border-default shadow-sm">
        {/* Request Header Section */}
        <div className="border-b border-default bg-default-50 px-6 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                {entityTypeLabels[request.entityType]} {t("details.request")}
                {request.entityId ? ` #${request.entityId}` : ""}
              </h2>
              <div className="text-sm text-default-500">
                {request.requestDate
                  ? formatDistanceToNow(new Date(request.requestDate), {
                    addSuffix: true,
                  })
                  : "Unknown"}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Chip
                color={statusColors[request.status]}
                variant="flat"
                classNames={{
                  base: "px-3 py-1",
                  content: "font-medium"
                }}
              >
                {statusLabels[request.status]}
              </Chip>
              <Chip
                color={actionColors[request.action]}
                variant="flat"
                classNames={{
                  base: "px-3 py-1",
                  content: "font-medium"
                }}
              >
                {actionLabels[request.action]}
              </Chip>
            </div>
          </div>
        </div>

        <CardBody className="px-6 py-5">
          {/* Request Reason */}
          {request.reason && (
            <div className="mb-8 rounded-lg border border-default bg-default-50 p-4">
              <h3 className="mb-2 text-sm uppercase text-default-500">{t("details.reason")}</h3>
              <p className="text-foreground">{request.reason}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left Column - Current Data (for update/delete) */}
            {!isCreateRequest && entityData && (
              <div>
                <h3 className="mb-4 border-b border-default pb-2 text-lg font-medium text-foreground">{t("details.currentData")}</h3>
                <div className="space-y-4">
                  {Object.entries(entityData)
                    .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
                    .map(([key, value]) => {
                      const hasChanged = request.action === "update" && newData && newData[key] !== undefined;
                      return (
                        <div
                          key={key}
                          className={`rounded-lg p-4 ${hasChanged
                              ? 'border border-warning bg-warning-50 dark:bg-warning-950 dark:border-warning-800'
                              : 'border border-default bg-content1'
                            }`}
                        >
                          <p className="mb-1 text-sm text-default-500">{key}</p>
                          <div className="font-medium text-foreground">
                            {typeof value === "object"
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </div>
                          {hasChanged && (
                            <div className="mt-3 border-t border-dashed border-warning-400 dark:border-warning-700 pt-2">
                              <div className="flex items-center gap-2">
                                <span className="i-heroicons:arrow-trending-down h-4 w-4 text-warning" />
                                <p className="text-sm font-medium text-warning">{t("details.willChange")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Right Column - New Data (for create/update) */}
            {request.action !== "delete" && (
              <div>
                <h3 className="mb-4 border-b border-default pb-2 text-lg font-medium text-foreground">
                  {isCreateRequest ? t("details.newData") : t("details.changes")}
                </h3>
                <div className="space-y-4">
                  {Object.entries(newData).map(([key, value]) => {
                    const isUpdate = !isCreateRequest && entityData && key in entityData;
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border p-4 ${isCreateRequest
                            ? 'border-primary bg-primary-50 dark:bg-primary-950 dark:border-primary-800'
                            : 'border-success bg-success-50 dark:bg-success-950 dark:border-success-800'
                          }`}
                      >
                        <p className="mb-1 text-sm text-default-500">{key}</p>
                        <div className="font-medium text-foreground">
                          {value ? String(value) : <em className="text-default-500">{t("details.empty")}</em>}
                        </div>
                        {isUpdate && (
                          <div className="mt-2">
                            <span className="flex items-center gap-1 text-xs text-default-500">
                              <span className="i-heroicons:arrow-up h-3 w-3" />
                              {t("details.updateFrom")}: {entityData && key in entityData ? String(entityData[key]) : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deletion Request */}
            {request.action === "delete" && (
              <div>
                <div className="rounded-lg border border-danger p-5 bg-danger-50 dark:bg-danger-950 dark:border-danger-800">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="i-heroicons:exclamation-triangle h-5 w-5 text-danger" />
                    <h3 className="text-lg font-medium text-danger">{t("details.deletionRequest")}</h3>
                  </div>
                  <p className="text-danger">{t("details.deletionWarning")}</p>
                </div>
              </div>
            )}
          </div>
        </CardBody>

        {/* Actions */}
        {isPending && (
          <div className="border-t border-default bg-default-50 px-6 py-4">
            <div className="flex justify-end gap-3">
              {!isEditing ? (
                <>
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => setIsEditing(true)}
                  >
                    {t("buttons.edit")}
                  </Button>
                  <Button
                    color="danger"
                    onPress={onOpen}
                  >
                    {t("buttons.cancelRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="default"
                    variant="flat"
                    onPress={() => setIsEditing(false)}
                  >
                    {t("buttons.cancelEditing")}
                  </Button>
                  <Button
                    color="primary"
                    onPress={onOpen}
                  >
                    {t("buttons.saveChanges")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Modal for cancel confirmation or edit updates */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {isEditing ? t("buttons.updateRequest") : t("buttons.cancelRequest")}
          </ModalHeader>
          <ModalBody>
            {isEditing ? (
              <div className="space-y-4">
                <p>{t("messages.updateRequest")}</p>

                {/* This is a simplified version. In a real app, you'd create 
                    different form fields based on entity type and action */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(newData).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label htmlFor={key} className="block text-sm font-medium">
                        {key}:
                      </label>
                      <input
                        id={key}
                        type="text"
                        className="w-full rounded-md border border-default p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-content1"
                        value={editedData[key] !== undefined
                          ? String(editedData[key])
                          : String(value)}
                        onChange={(e) => handleEditData(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label htmlFor="reason" className="block text-sm font-medium">
                    {t("messages.reasonLabel")}
                  </label>
                  <Textarea
                    id="reason"
                    value={reason || request.reason || ""}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("messages.reasonPlaceholder")}
                    className="w-full rounded-md focus:border-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="border border-danger rounded-lg p-4 bg-danger-50 dark:bg-danger-950 dark:border-danger-800">
                <p className="text-danger">{t("messages.cancelConfirmation")}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={onClose}>
              {isEditing ? t("buttons.cancel") : t("buttons.keepRequest")}
            </Button>
            <Button
              color={isEditing ? "primary" : "danger"}
              onPress={isEditing ? handleUpdateRequest : handleCancelRequest}
            >
              {isEditing ? t("buttons.updateRequest") : t("buttons.confirmCancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
