"use client";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { TaskPage, TaskState, TaskCancel, useTaskActions } from "./task-page";
import { TaskLink } from "./task-link";
import { CaptchaProvider } from "@/src/components/customs/captcha-provider";
import WordEditRequest from "@/src/components/customs/edit-request-modal/word-edit-request";
import { AudioRecorder } from "@/src/components/customs/audio-recorder";
import { MeaningTaskForm } from "./meaning-task-form";
import { RelationTaskForm } from "./relation-task-form";

export type WordTaskProps = {
  wordId: string;
  kind?:
    | "edit"
    | "meanings"
    | "related-words"
    | "related-phrases"
    | "pronunciations";
  childId?: string;
  operation?: "new" | "edit" | "remove";
};
export function WordTask(props: WordTaskProps) {
  const t = useTranslations("TaskPage");
  const input = {
    wordId: Number(props.wordId),
    meaningId: props.kind === "meanings" ? Number(props.childId) : undefined,
    relationId:
      props.kind?.startsWith("related-") && props.childId
        ? Number(props.childId)
        : undefined,
    relationKind:
      props.kind === "related-words" || props.kind === "related-phrases"
        ? props.kind
        : undefined,
  };
  const valid = Object.values(input).every(
    (value) =>
      typeof value !== "number" || (Number.isSafeInteger(value) && value > 0),
  );
  const query = api.word.getTaskWord.useQuery(input, { enabled: valid });
  const word = query.data?.word_data;
  const title =
    props.kind === "edit"
      ? t("edit")
      : props.kind === "pronunciations"
        ? t("pronunciation")
        : props.kind === "meanings"
          ? t(props.operation === "remove" ? "remove" : "newMeaning")
          : props.kind
            ? t(
                props.kind === "related-words"
                  ? "relatedWords"
                  : "relatedPhrases",
              )
            : t("wordTasks", { word: word?.word_name ?? "…" });
  return (
    <TaskPage
      title={word && props.kind ? `${title}: ${word.word_name}` : title}
      parent={
        word
          ? {
              pathname: "/search/[word]",
              params: { word: word.word_name },
              query: { entry: word.word_id },
            }
          : "/search"
      }
      parentLabel={word?.word_name ?? t("word")}
      media={props.kind === "pronunciations"}
    >
      {!valid || query.isLoading || query.error || !word ? (
        <TaskState
          loading={valid && query.isLoading}
          error={query.error}
          missing={!valid || query.error?.data?.code === "NOT_FOUND"}
          retry={() => void query.refetch()}
        />
      ) : (
        <CaptchaProvider>
          <WordTaskContent {...props} word={query.data!} />
        </CaptchaProvider>
      )}
    </TaskPage>
  );
}
function WordTaskContent({
  word,
  ...props
}: WordTaskProps & { word: import("@/types").WordSearchResult }) {
  const { complete } = useTaskActions();
  const t = useTranslations("TaskPage");
  const data = word.word_data;
  const params = { wordId: data.word_id };
  if (props.kind === "edit")
    return (
      <>
        <WordEditRequest data={word} onClose={complete} />
        <TaskCancel />
      </>
    );
  if (props.kind === "pronunciations")
    return (
      <>
        <AudioRecorder
          wordId={data.word_id}
          onUploadComplete={complete}
          wrapperClassName="flex flex-wrap gap-4"
        />
        <TaskCancel />
      </>
    );
  if (props.kind === "meanings")
    return (
      <MeaningTaskForm
        meaning={
          data.meanings.find(
            (item) => item.meaning_id === Number(props.childId),
          )!
        }
        operation={props.operation!}
      />
    );
  if (props.kind)
    return (
      <RelationTaskForm
        word={data}
        kind={props.kind as "related-words" | "related-phrases"}
        operation={props.operation!}
        childId={Number(props.childId)}
      />
    );
  return (
    <div className="space-y-6">
      <TaskLink
        className="block text-primary underline"
        href={{ pathname: "/contribute-word/[wordId]/edit", params }}
      >
        {t("edit")}
      </TaskLink>
      <TaskLink
        className="block text-primary underline"
        href={{
          pathname: "/contribute-word/[wordId]/pronunciations/new",
          params,
        }}
      >
        {t("pronunciation")}
      </TaskLink>
      <section className="space-y-3">
        <h2 className="font-bold">{t("meaning")}</h2>
        {data.meanings.map((item) => (
          <div
            key={item.meaning_id}
            className="space-y-2 rounded-md border border-divider p-3"
          >
            <p>{item.meaning}</p>
            <div className="flex flex-wrap gap-4">
              {(["edit", "remove"] as const).map((op) => (
                <TaskLink
                  key={op}
                  className="text-primary underline"
                  href={{
                    pathname: `/contribute-word/[wordId]/meanings/[meaningId]/${op}`,
                    params: { ...params, meaningId: item.meaning_id },
                  }}
                >
                  {t(op)}
                </TaskLink>
              ))}
            </div>
          </div>
        ))}
      </section>
      {(["related-words", "related-phrases"] as const).map((kind) => (
        <section key={kind} className="space-y-3">
          <h2 className="font-bold">
            {t(kind === "related-words" ? "relatedWords" : "relatedPhrases")}
          </h2>
          <TaskLink
            className="text-primary underline"
            href={{ pathname: `/contribute-word/[wordId]/${kind}/new`, params }}
          >
            {t("newRelation")}
          </TaskLink>
          {(kind === "related-words"
            ? data.relatedWords?.map((item) => ({
                id: item.related_word_id,
                name: item.related_word_name,
              }))
            : data.relatedPhrases?.map((item) => ({
                id: item.related_phrase_id,
                name: item.related_phrase,
              }))
          )?.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-4 border border-divider rounded-md p-3"
            >
              <span>{item.name}</span>
              {(["edit", "remove"] as const).map((op) => (
                <TaskLink
                  key={op}
                  className="text-primary underline"
                  href={{
                    pathname: `/contribute-word/[wordId]/${kind}/[relationId]/${op}`,
                    params: { ...params, relationId: item.id },
                  }}
                >
                  {t(op)}
                </TaskLink>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
