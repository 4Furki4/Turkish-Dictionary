"use client";
import "react-toastify/dist/ReactToastify.css";
import { ForgotPassword } from "@/types";
import { Button, Input } from "@nextui-org/react";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { api } from "@/src/trpc/react";
import { Link, useRouter } from "@/src/navigation";
import { useLocale } from "next-intl";

type ForgotPassowrdFormProps = Record<
  | "UnknownEmailError"
  | "GoogleAuthError"
  | "EmailIntl"
  | "InvalidEmailIntl"
  | "RememberedPasswordIntl"
  | "LoginIntl"
  | "EmailSentIntl"
  | "ForgotPasswordIntl"
  | "EmailRequiredIntl"
  | "EmailRequiredIntl",
  string
>;

export default function ForgotPasswordForm({
  EmailIntl,
  LoginIntl,
  RememberedPasswordIntl,
  InvalidEmailIntl,
  EmailSentIntl,
  ForgotPasswordIntl,
  EmailRequiredIntl,
  GoogleAuthError,
  UnknownEmailError,
}: ForgotPassowrdFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const locale = useLocale();
  const { theme } = useTheme();
  const {
    handleSubmit,
    control,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<ForgotPassword>({ mode: "all" });
  const forgotPasswordMutation =
    api.auth.createUniqueForgotPasswordLink.useMutation({
      onError: (error) => {
        toast.error(
          error.cause === "UknownEmailError"
            ? UnknownEmailError
            : GoogleAuthError,
          {
            theme:
              theme === "dark"
                ? "dark"
                : theme === "light"
                ? "light"
                : "colored",
            position: "bottom-center",
          }
        );
      },
      onSuccess: async (data) => {
        console.log(data);
        toast.success(EmailSentIntl, {
          theme:
            theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
          position: "bottom-center",
        });
        router.push(
          {
            pathname: "/signin",
            query: params.get("callbackUrl")
              ? { callbackUrl: params.get("callbackUrl") }
              : undefined,
          },
          { scroll: false }
        );
      },
    });
  const onForgotPasswordSubmit: SubmitHandler<ForgotPassword> = (data) => {
    forgotPasswordMutation.mutate({
      email: data.forgotPasswordEmail,
      locale,
    });
  };
  return (
    <>
      <form
        onSubmit={handleSubmit(onForgotPasswordSubmit)}
        className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl shadow-md bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
      >
        <h1 className="text-fs-2 font-bold text-center">
          {ForgotPasswordIntl}
        </h1>
        <Controller
          name="forgotPasswordEmail"
          rules={{
            required: {
              value: true,
              message: EmailRequiredIntl,
            },
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
              message: InvalidEmailIntl,
            },
          }}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              aria-required
              key={"forgotPasswordEmail"}
              type="email"
              autoCapitalize="email"
              inputMode="email"
              dir="auto"
              {...field}
              label={EmailIntl}
              color="primary"
              variant="underlined"
              errorMessage={errors.forgotPasswordEmail?.message}
              isInvalid={error !== undefined}
            />
          )}
        />
        <Button color="primary" variant="ghost" type="submit">
          {EmailSentIntl}
        </Button>
        <p>
          {RememberedPasswordIntl}
          {` `}
          <Link
            className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
            href={{
              pathname: "/signin",
              query: decodeURIComponent(params.toString()),
            }}
          >
            {LoginIntl}
          </Link>
        </p>
      </form>
    </>
  );
}
