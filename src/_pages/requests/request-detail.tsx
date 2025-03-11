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
  useDisclosure,
  Divider,
  Tabs,
  Tab,
  CardHeader,
  CardFooter
} from "@heroui/react";
import { EntityTypes, Actions, Status } from "@/db/schema/requests";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  FileText,
  Plus,
  PenSquare,
  Copy,
  AlertTriangle,
  Clock
} from "lucide-react";

export interface RequestDetailProps {
  requestId: number;
}

type EntityData = Record<string, any>;

export default function RequestDetail({ requestId }: RequestDetailProps) {
  const t = useTranslations("Requests");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string>("current");

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

  const handleEditData = (key: string, value: any) => {
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
  let newData: Record<string, any> = {};

  // Extract new data from request
  try {
    if (request.newData && typeof request.newData === 'string') {
      newData = JSON.parse(request.newData);
    } else if (request.newData && typeof request.newData === 'object') {
      newData = request.newData as Record<string, any>;
    }
  } catch (error) {
    console.error("Failed to parse new data:", error);
  }

  // Get entity data from the API response
  const entityData = data.entityData as EntityData | null;

  const isPending = request.status === "pending";
  const isCreateRequest = request.action === "create";

  // Helper function to render entity data based on entity type
  const renderEntityData = (data: EntityData) => {
    if (!data) return null;

    // Special rendering for word entity type
    if (request.entityType === "words") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-2 mb-4">
            <h3 className="text-2xl font-semibold">
              {data.prefix ? <span className="text-sm">{String(data.prefix)}- </span> : null}
              {data.name ? String(data.name) : ""}
              {data.suffix ? <span className="text-sm"> -{String(data.suffix)}</span> : null}
            </h3>
            {data.phonetic ? (
              <div className="text-default-500 italic">/{String(data.phonetic)}/</div>
            ) : null}
            {data.rootId ? (
              <Chip color="primary" size="sm" className="mt-1">
                Root ID: {String(data.rootId)}
              </Chip>
            ) : null}
          </div>

          <Divider />

          {Object.entries(data)
            .filter(([key]) => !["id", "name", "phonetic", "rootId", "prefix", "suffix", "created_at", "updated_at"].includes(key))
            .map(([key, value]) => (
              <div key={key} className="py-2">
                <div className="text-sm text-default-500 capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="font-medium">{String(value)}</div>
              </div>
            ))}
        </div>
      );
    }

    // Special rendering for meaning entity type
    if (request.entityType === "meanings") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Divider orientation="vertical" className="h-full w-[3px] bg-primary" />
              <div>
                {data.partOfSpeechId && (
                  <Chip size="sm" color="secondary" className="mb-2">
                    Part of Speech ID: {data.partOfSpeechId}
                  </Chip>
                )}
                <p className="text-lg font-medium">{data.meaning}</p>
              </div>
            </div>
            {data.imageUrl && (
              <div className="mt-2">
                <div className="text-sm text-default-500">Image URL</div>
                <div className="font-medium text-primary">{data.imageUrl}</div>
              </div>
            )}
          </div>

          <Divider />

          {Object.entries(data)
            .filter(([key]) => !["id", "meaning", "partOfSpeechId", "imageUrl", "wordId"].includes(key))
            .map(([key, value]) => (
              <div key={key} className="py-2">
                <div className="text-sm text-default-500 capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="font-medium">{String(value)}</div>
              </div>
            ))}
        </div>
      );
    }

    // Default rendering for other entity types
    return (
      <div className="space-y-4">
        {Object.entries(data)
          .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
          .map(([key, value]) => {
            const hasChanged = request.action === "update" && newData && newData[key] !== undefined;
            return (
              <div
                key={key}
                className={`py-2 px-4 rounded-lg ${hasChanged
                  ? 'border-l-4 border-warning bg-warning-100'
                  : 'border-l-4 border-default'
                  }`}
              >
                <div className="text-sm text-default-500 capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="font-medium">
                  {typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </div>
                {hasChanged && (
                  <div className="mt-2 pt-2 border-t border-dashed border-warning-400 dark:border-warning-700">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-warning" />
                      <p className="text-sm font-medium text-warning">{t("details.willChange")}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  // Helper function to render new data based on entity type
  const renderNewData = (data: Record<string, any>) => {
    if (!data || Object.keys(data).length === 0) return null;

    // Special rendering for word entity type
    if (request.entityType === "words") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-2 mb-4">
            <h3 className="text-2xl font-semibold">
              {data.prefix ? <span className="text-sm">{String(data.prefix)}- </span> : null}
              {data.name ? String(data.name) : ""}
              {data.suffix ? <span className="text-sm"> -{String(data.suffix)}</span> : null}
            </h3>
            {data.phonetic ? (
              <div className="text-default-500 italic">/{String(data.phonetic)}/</div>
            ) : null}
            {data.rootId ? (
              <Chip color="primary" size="sm" className="mt-1">
                Root ID: {String(data.rootId)}
              </Chip>
            ) : null}
          </div>

          <Divider />

          {Object.entries(data)
            .filter(([key]) => !["name", "phonetic", "rootId", "prefix", "suffix"].includes(key))
            .map(([key, value]) => {
              const isUpdate = !isCreateRequest && entityData && key in entityData;
              return (
                <div key={key} className="py-2">
                  <div className="text-sm text-default-500 capitalize">{key.replace(/_/g, ' ')}</div>
                  <div className="font-medium">{value ? String(value) : <em className="text-default-500">{t("details.empty")}</em>}</div>
                  {isUpdate && (
                    <div className="mt-1">
                      <span className="flex items-center gap-1 text-xs text-default-500">
                        <ArrowUp className="h-3 w-3" />
                        {t("details.updateFrom")}: {entityData && key in entityData ? String(entityData[key]) : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      );
    }

    // Special rendering for meaning entity type
    if (request.entityType === "meanings") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Divider orientation="vertical" className="h-full w-[3px] bg-success" />
              <div>
                {data.partOfSpeechId && (
                  <Chip size="sm" color="success" className="mb-2">
                    Part of Speech ID: {data.partOfSpeechId}
                  </Chip>
                )}
                <p className="text-lg font-medium">{data.meaning}</p>
              </div>
            </div>
            {data.imageUrl && (
              <div className="mt-2">
                <div className="text-sm text-default-500">Image URL</div>
                <div className="font-medium text-success">{data.imageUrl}</div>
              </div>
            )}
          </div>

          <Divider />

          {Object.entries(data)
            .filter(([key]) => !["meaning", "partOfSpeechId", "imageUrl", "wordId"].includes(key))
            .map(([key, value]) => {
              const isUpdate = !isCreateRequest && entityData && key in entityData;
              return (
                <div key={key} className="py-2">
                  <div className="text-sm text-default-500 capitalize">{key.replace(/_/g, ' ')}</div>
                  <div className="font-medium">{value ? String(value) : <em className="text-default-500">{t("details.empty")}</em>}</div>
                  {isUpdate && (
                    <div className="mt-1">
                      <span className="flex items-center gap-1 text-xs text-default-500">
                        <ArrowUp className="h-3 w-3" />
                        {t("details.updateFrom")}: {entityData && key in entityData ? String(entityData[key]) : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      );
    }

    // Default rendering for other entity types
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => {
          const isUpdate = !isCreateRequest && entityData && key in entityData;
          return (
            <div
              key={key}
              className={`py-2 px-4 rounded-lg border-l-4 ${isCreateRequest
                ? 'border-success bg-success-100'
                : 'border-success bg-success-100'}`}
            >
              <div className="text-sm text-default-500 capitalize">{key.replace(/_/g, ' ')}</div>
              <div className="font-medium">
                {value ? String(value) : <em className="text-default-500">{t("details.empty")}</em>}
              </div>
              {isUpdate && (
                <div className="mt-1">
                  <span className="flex items-center gap-1 text-xs text-default-500">
                    <ArrowUp className="h-3 w-3" />
                    {t("details.updateFrom")}: {entityData && key in entityData ? String(entityData[key]) : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button
          color="default"
          variant="flat"
          onPress={() => router.push("/requests")}
          startContent={<ArrowLeft className="h-4 w-4" />}
        >
          {t("buttons.back")}
        </Button>
      </div>

      <Card className="border-default shadow-sm">
        <CardHeader className="border-b border-default bg-default-50 px-6 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {entityTypeLabels[request.entityType]} {t("details.request")}
                {request.entityId ? ` #${request.entityId}` : ""}
              </h2>
              <div className="text-sm text-default-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {request.requestDate
                  ? formatDistanceToNow(new Date(request.requestDate), {
                    addSuffix: true,
                  })
                  : "Unknown"}
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
        </CardHeader>

        <CardBody className="px-6 py-5">
          {/* Request Reason */}
          {request.reason && (
            <div className="mb-8 rounded-lg border border-default bg-default-50 p-4">
              <h3 className="mb-2 text-sm uppercase text-default-500">{t("details.reason")}</h3>
              <p className="text-foreground">{request.reason}</p>
            </div>
          )}

          {/* Main Content */}
          {request.action === "delete" ? (
            <div className="rounded-lg border border-danger p-5 bg-danger-100">
              <div className="mb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <h3 className="text-lg font-medium text-danger">{t("details.deletionRequest")}</h3>
              </div>
              <p className="text-danger mb-4">{t("details.deletionWarning")}</p>

              {entityData && (
                <div className="mt-4 p-4 border border-dashed border-danger rounded-lg">
                  <h4 className="text-md font-medium mb-3 text-danger">Data to be deleted:</h4>
                  {renderEntityData(entityData)}
                </div>
              )}
            </div>
          ) : (
            <Tabs
              aria-label="Request data tabs"
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              color="primary"
              variant="light"
            >
              {!isCreateRequest && entityData && (
                <Tab
                  key="current"
                  title={
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{t("details.currentData")}</span>
                    </div>
                  }
                >
                  <div className="mt-6 p-4 border border-default rounded-lg bg-default-100">
                    {Object.entries(entityData).map(([key, value]) => {
                      // Skip these fields
                      if (
                        ["id", "createdAt", "updatedAt", "userId"].includes(key)
                      ) {
                        return null;
                      }

                      // Check if this field will be changed
                      const hasChanged =
                        newData && key in newData && newData[key] !== value;

                      return (
                        <div key={key} className="border-b border-default py-3 last:border-0">
                          <div className="flex flex-col">
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span>
                                {value === null || value === undefined
                                  ? t("details.empty")
                                  : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Tab>
              )}

              <Tab
                key="changes"
                title={
                  <div className="flex items-center gap-2">
                    {isCreateRequest ? <Plus className="h-4 w-4" /> : <PenSquare className="h-4 w-4" />}
                    <span>{isCreateRequest ? t("details.newData") : t("details.changes")}</span>
                  </div>
                }
              >
                <div className={`mt-6 p-4 border rounded-lg border-success bg-success-100`}>
                  {Object.entries(newData).map(([key, value]) => {
                    // Skip these fields
                    if (
                      ["id", "createdAt", "updatedAt", "userId"].includes(key)
                    ) {
                      return null;
                    }

                    const isUpdate =
                      entityData && key in entityData && entityData[key] !== value;

                    return (
                      <div key={key} className="border-b border-default py-3 last:border-0">
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="text-success-600 font-medium">
                              {value === null || value === undefined
                                ? t("details.empty")
                                : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Tab>

              <Tab
                key="comparison"
                title={
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    <span>{t("details.sideBySide")}</span>
                  </div>
                }
                isDisabled={isCreateRequest || !entityData}
              >
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="p-4 border border-default rounded-lg bg-default-100">
                    <h3 className="text-lg font-medium mb-4 border-b pb-2">{t("details.currentData")}</h3>
                    {Object.keys({ ...entityData, ...newData }).map((key) => {
                      // Skip these fields
                      if (
                        ["id", "createdAt", "updatedAt", "userId"].includes(key)
                      ) {
                        return null;
                      }

                      const currentValue = entityData && key in entityData ? entityData[key] : undefined;
                      const newValue = key in newData ? newData[key] : undefined;
                      const isUpdate = entityData && key in entityData && key in newData && currentValue !== newValue;
                      const isNew = !(entityData && key in entityData) && key in newData;
                      const isDeleted = entityData && key in entityData && !(key in newData);

                      // Skip if no change
                      if (currentValue === newValue && !isNew && !isDeleted) {
                        return null;
                      }

                      return (
                        <div key={key} className="border-b border-default py-3 last:border-0">
                          <div className="flex flex-col">
                            <div className="flex justify-between">
                              <span className="font-medium capitalize">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <div className="flex flex-col items-end">
                                <span className="text-success-600 font-medium">
                                  {newValue === null || newValue === undefined
                                    ? t("details.empty")
                                    : typeof newValue === "object"
                                    ? JSON.stringify(newValue)
                                    : String(newValue)}
                                </span>
                                {isUpdate && (
                                  <div className="mt-1">
                                    <span className="flex items-center gap-1 text-xs text-default-500">
                                      <ArrowUp className="h-3 w-3" />
                                      {t("details.updateFrom")}: {entityData && key in entityData ? (
                                        currentValue === null || currentValue === undefined
                                          ? t("details.empty")
                                          : typeof currentValue === "object"
                                          ? JSON.stringify(currentValue)
                                          : String(currentValue)
                                      ) : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 border rounded-lg border-success bg-success-100">
                    <h3 className="text-lg font-medium mb-4 border-b pb-2">{t("details.changes")}</h3>
                    {Object.keys({ ...entityData, ...newData }).map((key) => {
                      // Skip these fields
                      if (
                        ["id", "createdAt", "updatedAt", "userId"].includes(key)
                      ) {
                        return null;
                      }

                      const currentValue = entityData && key in entityData ? entityData[key] : undefined;
                      const newValue = key in newData ? newData[key] : undefined;
                      const isUpdate = entityData && key in entityData && key in newData && currentValue !== newValue;
                      const isNew = !(entityData && key in entityData) && key in newData;
                      const isDeleted = entityData && key in entityData && !(key in newData);

                      // Skip if no change
                      if (currentValue === newValue && !isNew && !isDeleted) {
                        return null;
                      }

                      return (
                        <div key={key} className="border-b border-default py-3 last:border-0">
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <div className="flex flex-col items-end">
                              <span className="text-success-600 font-medium">
                                {newValue === null || newValue === undefined
                                  ? t("details.empty")
                                  : typeof newValue === "object"
                                  ? JSON.stringify(newValue)
                                  : String(newValue)}
                              </span>
                              {isUpdate && (
                                <div className="mt-1">
                                  <span className="flex items-center gap-1 text-xs text-default-500">
                                    <ArrowUp className="h-3 w-3" />
                                    {t("details.updateFrom")}: {entityData && key in entityData ? (
                                      currentValue === null || currentValue === undefined
                                        ? t("details.empty")
                                        : typeof currentValue === "object"
                                        ? JSON.stringify(currentValue)
                                        : String(currentValue)
                                    ) : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </Tab>
            </Tabs>
          )}
        </CardBody>

        {/* Actions */}
        {isPending && (
          <CardFooter className="border-t border-default bg-default-50 px-6 py-4">
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
          </CardFooter>
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
                    value={reason || data?.request.reason || ""}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("messages.reasonPlaceholder")}
                    className="w-full rounded-md focus:border-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="border border-danger rounded-lg p-4 bg-danger-100">
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
