import { useTranslations } from "next-intl";
import type { Actions, EntityTypes, Status } from "@/db/schema/requests";

// It's a good practice to pass the t function as an argument
// if these helpers are called outside of a component's render cycle
// or if you want to control the translation namespace explicitly.

export function getDisplayLabelForAction(
  action: Actions,
  t: ReturnType<typeof useTranslations<"RequestActions">>
): string {
  return t(action);
}

export function getDisplayLabelForEntityType(
  entityType: EntityTypes,
  t: ReturnType<typeof useTranslations<"EntityTypes">>
): string {
  return t(entityType);
}

export function getDisplayLabelForStatus(
  status: Status,
  t: ReturnType<typeof useTranslations<"RequestStatuses">>
): string {
  return t(status);
}
