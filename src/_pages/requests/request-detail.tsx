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
import RelatedWordDisplay from "@/src/components/shared/RelatedWordDisplay";
import DisplayWordBeingModified from "@/src/components/shared/DisplayWordBeingModified";
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
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { toast } from "sonner";


export interface RequestDetailProps {
  requestId: number;
}

type EntityData = Record<string, any>;

export default function RequestDetail({ requestId }: RequestDetailProps) {
  console.log('[RequestDetail] Props:', requestId);
  const t = useTranslations("Requests");
  const tDbFieldLabels = useTranslations("DbFieldLabels");
  const tRelationTypes = useTranslations("RelationTypes");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string>("current");
  const { executeRecaptcha } = useGoogleReCaptcha()
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
    related_phrases: t("entityTypes.related_phrases"),
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

  const getDisplayLabelForKey = (key: string): string => {
    const labelFromDb = tDbFieldLabels(key);
    // next-intl returns the key if no translation is found for the current locale.
    // It returns an empty string if the key is missing from the namespace entirely.
    if (labelFromDb !== key && labelFromDb !== "") {
      return labelFromDb;
    }
    // Default fallback: format the key (e.g., 'view_count' -> 'View count')
    const formattedKey = key.replace(/_/g, " ");
    return formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
  };

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

  const handleCancelRequest = useCallback(async () => {
    if (!executeRecaptcha) {
      toast.error(t("Errors.captchaError"));
      return;
    }
    try {
      const captchaToken = await executeRecaptcha("cancel_request");
      cancelRequestMutation.mutate({ requestId, captchaToken });
    } catch (error) {
      console.error("reCAPTCHA execution failed:", error);
      toast.error(t("Errors.captchaError"));
    }
  }, [cancelRequestMutation, requestId, executeRecaptcha, t]);

  const handleUpdateRequest = useCallback(async () => {
    if (!executeRecaptcha) {
      toast.error(t("Errors.captchaError"));
      return;
    }
    try {
      const captchaToken = await executeRecaptcha("update_request");
      updateRequestMutation.mutate({
        requestId,
        newData: editedData,
        reason: reason || data?.request.reason || "",
        captchaToken,
      });
    } catch (error) {
      console.error("reCAPTCHA execution failed:", error);
      toast.error(t("Errors.captchaError"));
    }
  }, [updateRequestMutation, requestId, editedData, reason, data, executeRecaptcha, t]);

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
  console.log('[RequestDetail] Full request object:', request);
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
  console.log('[RequestDetail] Memoized entityData:', entityData, 'Memoized newData:', newData);

  const isPending = request.status === "pending";
  const isCreateRequest = data.request.action === "create";

  // Helper function to render entity data based on entity type
  const renderEntityData = (data: EntityData) => {
    if (!data) return null;

    // Special rendering for word entity type
    if (data.request.entityType === "words") {
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
                {getDisplayLabelForKey("rootId")}: {String(data.rootId)}
              </Chip>
            ) : null}
          </div>

          <Divider />

          {Object.entries(data)
            .filter(([key]) => !["id", "name", "phonetic", "rootId", "prefix", "suffix", "created_at", "updated_at"].includes(key))
            .map(([key, value]) => (
              <div key={key} className="py-2">
                <div className="text-sm text-default-500 capitalize">{
                  key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                    key === "newRelationType" ? t("details.newRelationTypeLabel") :
                      key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                        key === "reason" ? t("details.reason") :
                          getDisplayLabelForKey(key)
                }</div>
                <div className="font-medium">{String(value)}</div>
              </div>
            ))}
        </div>
      );
    }

    // Special rendering for meaning entity type
    if (data.request.entityType === "meanings") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Divider orientation="vertical" className="h-full w-[3px] bg-primary" />
              <div>
                {data.partOfSpeechId && (
                  <Chip size="sm" color="secondary" className="mb-2">
                    {getDisplayLabelForKey("partOfSpeechId")}: {data.partOfSpeechId}
                  </Chip>
                )}
                <p className="text-lg font-medium">{data.meaning}</p>
              </div>
            </div>
            {data.imageUrl && (
              <div className="mt-2">
                <div className="text-sm text-default-500">{getDisplayLabelForKey("imageUrl")}</div>
                <div className="font-medium text-primary">{data.imageUrl}</div>
              </div>
            )}
          </div>

          <Divider />

          {Object.entries(data)
            .filter(([key]) => !["id", "meaning", "partOfSpeechId", "imageUrl", "wordId"].includes(key))
            .map(([key, value]) => {
              console.log('[renderEntityData - meanings] Processing key:', key, 'Value:', value, 'Is relatedWordId?', key === 'relatedWordId');
              return (
                <div key={key} className="py-2">
                  <div className="text-sm text-default-500 capitalize">{
                    key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                      key === "newRelationType" ? t("details.newRelationTypeLabel") :
                        key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                          key === "reason" ? t("details.reason") :
                            getDisplayLabelForKey(key)
                  }</div>
                  <div className="font-medium">{
                    key === "relatedWordId" && value !== null && value !== undefined ? (
                      <RelatedWordDisplay relatedWordId={String(value)} />
                    ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                      tRelationTypes(String(value))
                    ) : value === null || value === undefined ? (
                      t("details.empty")
                    ) : typeof value === "object" ? (
                      JSON.stringify(value, null, 2)
                    ) : (
                      String(value)
                    )
                  }</div>
                </div>
              )
            })
          }
        </div>
      );
    }

    // Default rendering for other entity types
    return (
      <div className="space-y-4">
        {Object.entries(data)
          .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
          .map(([key, value]) => {
            console.log('[renderEntityData - default] Processing key:', key, 'Value:', value, 'Is relatedWordId?', key === 'relatedWordId');
            const hasChanged = data.request.action === "update" && newData && newData[key] !== undefined;
            return (
              <div
                key={key}
                className={`py-2 px-4 rounded-lg ${hasChanged
                  ? 'border-l-4 border-warning bg-warning-100'
                  : 'border-l-4 border-default'
                  }`}
              >
                <div className="text-sm text-default-500 capitalize">{
                  key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                    key === "newRelationType" ? t("details.newRelationTypeLabel") :
                      key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                        key === "reason" ? t("details.reason") :
                          getDisplayLabelForKey(key)
                }</div>
                <div className="font-medium">{
                  key === "relatedWordId" && value !== null && value !== undefined ? (
                    <RelatedWordDisplay relatedWordId={String(value)} />
                  ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                    tRelationTypes(String(value))
                  ) : value === null || value === undefined ? (
                    t("details.empty")
                  ) : typeof value === "object" ? (
                    JSON.stringify(value, null, 2)
                  ) : (
                    String(value)
                  )
                }</div>
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
    if (data.request.entityType === "words") {
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
                {getDisplayLabelForKey("rootId")}: {String(data.rootId)}
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
                  <div className="text-sm text-default-500 capitalize">{
                    key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                      key === "newRelationType" ? t("details.newRelationTypeLabel") :
                        key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                          key === "reason" ? t("details.reason") :
                            getDisplayLabelForKey(key)
                  }</div>
                  <div className="font-medium">{
                    key === "relatedWordId" && value !== null && value !== undefined ? (
                      <RelatedWordDisplay relatedWordId={String(value)} />
                    ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                      tRelationTypes(String(value))
                    ) : value === null || value === undefined ? (
                      <em className="text-default-500">{t("details.empty")}</em>
                    ) : typeof value === "object" ? (
                      JSON.stringify(value, null, 2)
                    ) : (
                      String(value)
                    )
                  }</div>
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
    if (data.request.entityType === "meanings") {
      return (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Divider orientation="vertical" className="h-full w-[3px] bg-success" />
              <div>
                {data.partOfSpeechId && (
                  <Chip size="sm" color="success" className="mb-2">
                    {getDisplayLabelForKey("partOfSpeechId")}: {data.partOfSpeechId}
                  </Chip>
                )}
                <p className="text-lg font-medium">{data.meaning}</p>
              </div>
            </div>
            {data.imageUrl && (
              <div className="mt-2">
                <div className="text-sm text-default-500">{getDisplayLabelForKey("imageUrl")}</div>
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
                  <div className="text-sm text-default-500 capitalize">{
                    key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                      key === "newRelationType" ? t("details.newRelationTypeLabel") :
                        key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                          key === "reason" ? t("details.reason") :
                            getDisplayLabelForKey(key)
                  }</div>
                  <div className="font-medium">{
                    key === "relatedWordId" && value !== null && value !== undefined ? (
                      <RelatedWordDisplay relatedWordId={String(value)} />
                    ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                      tRelationTypes(String(value))
                    ) : value === null || value === undefined ? (
                      <em className="text-default-500">{t("details.empty")}</em>
                    ) : typeof value === "object" ? (
                      JSON.stringify(value, null, 2)
                    ) : (
                      String(value)
                    )
                  }</div>
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
              <div className="text-sm text-default-500 capitalize">{
                key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                  key === "newRelationType" ? t("details.newRelationTypeLabel") :
                    key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                      key === "reason" ? t("details.reason") :
                        getDisplayLabelForKey(key)
              }</div>
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

      <Card className="border-default shadow-xs">
        <CardHeader className="border-b border-default bg-default-50 px-6 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("title")}{` #${request.id}: ${entityTypeLabels[request.entityType]} - ${actionLabels[request.action]}`}
              </h2>
              {request.entityType === "words" && (request.action === "update" || request.action === "delete") && request.entityId && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-default-600">{t("details.modifyingWordLabel")}:</span>
                  <DisplayWordBeingModified wordId={request.entityId} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-default-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {request.requestDate
                  ? formatDistanceToNow(new Date(request.requestDate), {
                    addSuffix: true,
                  })
                  : t("details.unknownDate")}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Chip
                  color={statusColors[request.status]}
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
          {data.request.action === "delete" ? (
            <div className="rounded-lg border border-danger bg-danger-100 p-5">
              <div className="mb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <h3 className="text-lg font-medium text-danger">{t("details.deletionRequest")}</h3>
              </div>
              <p className="text-danger mb-4">{t("details.deletionWarning")}</p>

              {entityData && (
                <div className="mt-4 rounded-lg border border-dashed border-danger p-4">
                  <h4 className="text-md mb-3 font-medium text-danger">{t("details.dataToBeDeleted")}</h4>
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
              {/* Current Data Tab */}
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
                  <div className="mt-6 rounded-lg border border-default bg-default-100 p-4">
                    {Object.entries(entityData)
                      .filter(([key]) => !["id", "createdAt", "updatedAt", "userId"].includes(key))
                      .map(([key, value]) => {
                        const hasChanged = newData && key in newData && newData[key] !== value;
                        return (
                          <div
                            key={`current-${key}`}
                            className={`border-b border-default py-3 last:border-0 ${hasChanged ? "bg-warning-50" : ""
                              }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  {getDisplayLabelForKey(key)}:
                                </span>
                                <span>
                                  {value === null || value === undefined
                                    ? t("details.empty")
                                    : typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)}
                                </span>
                              </div>
                              {hasChanged && newData && (
                                <div className="mt-1 text-xs text-warning-600">
                                  {t("details.willChangeTo")}:{" "}
                                  {newData[key] === null || newData[key] === undefined
                                    ? t("details.empty")
                                    : typeof newData[key] === "object"
                                      ? JSON.stringify(newData[key])
                                      : String(newData[key])}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Tab>
              )}

              {/* New Data / Changes Tab */}
              <Tab
                key="changes"
                title={
                  <div className="flex items-center gap-2">
                    {isCreateRequest ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <PenSquare className="h-4 w-4" />
                    )}
                    <span>
                      {isCreateRequest
                        ? t("details.newData")
                        : t("details.changes")}
                    </span>
                  </div>
                }
              >
                <div
                  className={`mt-6 rounded-lg border p-4 ${isCreateRequest
                    ? "border-success bg-success-100"
                    : "border-warning bg-warning-100"
                    }`}
                >
                  {Object.entries(newData)
                    .filter(([key]) => !["id", "createdAt", "updatedAt", "userId"].includes(key))
                    .map(([key, value]) => {
                      const isUpdate =
                        !isCreateRequest &&
                        entityData &&
                        key in entityData &&
                        entityData[key] !== value;
                      return (
                        <div
                          key={`changes-${key}`}
                          className="border-b border-default py-3 last:border-0"
                        >
                          <div className="flex flex-col">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {
                                  key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                                    key === "newRelationType" ? t("details.newRelationTypeLabel") :
                                      key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                                        key === "reason" ? t("details.reason") :
                                          getDisplayLabelForKey(key)
                                }:
                              </span>
                              <span
                                className={`${isCreateRequest ? "text-success-700" : "text-warning-700"} font-medium`}
                              >
                                {
                                  key === "relatedWordId" && value !== null && value !== undefined ? (
                                    <RelatedWordDisplay relatedWordId={String(value)} />
                                  ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                                    tRelationTypes(String(value))
                                  ) : value === null || value === undefined ? (
                                    t("details.empty")
                                  ) : typeof value === "object" ? (
                                    JSON.stringify(value, null, 2)
                                  ) : (
                                    String(value)
                                  )
                                }
                              </span>
                            </div>
                            {isUpdate && entityData && (
                              <div className="mt-1 text-xs text-default-500">
                                <span className="flex items-center gap-1">
                                  <ArrowUp className="h-3 w-3" />
                                  {t("details.updateFrom")}:{" "}
                                  {entityData[key] === null ||
                                    entityData[key] === undefined
                                    ? t("details.empty")
                                    : typeof entityData[key] === "object"
                                      ? JSON.stringify(entityData[key])
                                      : String(entityData[key])}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Tab>

              {/* Side-by-Side Comparison Tab */}
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
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* Current Data Side */}
                  <div className="rounded-lg border border-default bg-default-100 p-4">
                    <h3 className="mb-4 border-b border-default pb-2 text-lg font-medium">
                      {t("details.currentData")}
                    </h3>
                    <div className="space-y-3">
                      {entityData && Object.entries(entityData)
                        .filter(([key]) => !["id", "createdAt", "updatedAt", "userId"].includes(key))
                        .map(([key, value]) => (
                          <div key={`comparison-current-${key}`} className="flex flex-col">
                            <span className="text-sm font-semibold text-default-700">
                              {key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                                key === "newRelationType" ? t("details.newRelationTypeLabel") :
                                  key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                                    key === "reason" ? t("details.reason") :
                                      getDisplayLabelForKey(key)}:
                            </span>
                            <span className="text-default-600">
                              {key === "relatedWordId" && value !== null && value !== undefined ? (
                                <RelatedWordDisplay relatedWordId={String(value)} />
                              ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                                tRelationTypes(String(value))
                              ) : value === null || value === undefined ? (
                                t("details.empty")
                              ) : typeof value === "object" ? (
                                JSON.stringify(value)
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* New Data Side */}
                  <div className={`rounded-lg border p-4 ${isCreateRequest ? "border-success bg-success-100" : "border-warning bg-warning-100"}`}>
                    <h3 className={`mb-4 border-b pb-2 text-lg font-medium ${isCreateRequest ? "border-success text-success-700" : "border-warning text-warning-700"}`}>
                      {isCreateRequest ? t("details.newData") : t("details.proposedChanges")}
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(newData)
                        .filter(([key]) => !["id", "createdAt", "updatedAt", "userId"].includes(key))
                        .map(([key, value]) => (
                          <div key={`comparison-new-${key}`} className="flex flex-col">
                            <span className={`text-sm font-semibold ${isCreateRequest ? "text-success-700" : "text-warning-700"}`}>
                              {key === "relatedWordId" ? t("details.relatedWordIdLabel") :
                                key === "newRelationType" ? t("details.newRelationTypeLabel") :
                                  key === "originalRelationType" ? t("details.originalRelationTypeLabel") :
                                    key === "reason" ? t("details.reason") :
                                      getDisplayLabelForKey(key)}:
                            </span>
                            <span className={`${isCreateRequest ? "text-success-600" : "text-warning-600"}`}>
                              {key === "relatedWordId" && value !== null && value !== undefined ? (
                                <RelatedWordDisplay relatedWordId={String(value)} />
                              ) : (key === "newRelationType" || key === "originalRelationType") && value !== null && value !== undefined ? (
                                tRelationTypes(String(value))
                              ) : value === null || value === undefined ? (
                                t("details.empty")
                              ) : typeof value === "object" ? (
                                JSON.stringify(value)
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
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
                    onPress={onOpen} // Opens modal for cancel confirmation
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
                    onPress={onOpen} // Opens modal for save changes confirmation
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
          {(modalClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {isEditing ? t("details.updateRequestModalTitle") : t("details.cancelRequestModalTitle")}
              </ModalHeader>
              <ModalBody>
                {isEditing ? (
                  <>
                    <p>{t("prompts.confirmUpdateRequest")}</p>
                    <Textarea
                      label={t("inputs.reasonForChangeLabel")}
                      placeholder={t("inputs.reasonForChangePlaceholder")}
                      value={reason}
                      onValueChange={setReason}
                      className="mt-4"
                    />
                  </>
                ) : (
                  <p>{t("prompts.confirmCancelRequest")}</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={modalClose}>
                  {t("buttons.close")}
                </Button>
                <Button
                  color={isEditing ? "primary" : "danger"}
                  onPress={() => {
                    if (isEditing) {
                      handleUpdateRequest();
                    } else {
                      handleCancelRequest();
                    }
                    modalClose(); // Close modal after action
                  }}
                >
                  {isEditing ? t("buttons.confirmUpdate") : t("buttons.confirmCancel")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
