"use client";
import "react-toastify/dist/ReactToastify.css";
import { ForgotPassword } from "@/types";
import { Button, Input } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { useRouter } from "next-intl/client";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next-intl/link";
import { api } from "@/src/trpc/react";

export default function ForgotPasswordForm() {
  const t = useTranslations("ForgotPasswordForm");
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
        toast.error(t(error.message), {
          theme:
            theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
          position: "bottom-center",
        });
      },
      onSuccess: async (data) => {
        console.log(data);
        toast.success(t("Email Sent"), {
          theme:
            theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
          position: "bottom-center",
        });
        router.push(
          `${
            params.get("callbackUrl")
              ? `?callbackUrl=${params.get("callbackUrl")}`
              : ""
          }`,
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
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
            {t("Forgot Password")}
          </h1>
        </div>
        <Controller
          name="forgotPasswordEmail"
          rules={{
            required: {
              value: true,
              message: t("EmailRequired"),
            },
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
              message: t("InvalidEmail"),
            },
          }}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              key={"forgotPasswordEmail"}
              type="email"
              autoCapitalize="email"
              inputMode="email"
              dir="auto"
              {...field}
              label={t("Email")}
              color="primary"
              variant="underlined"
              errorMessage={errors.forgotPasswordEmail?.message}
              isInvalid={error !== undefined}
            />
          )}
        />
        <Button color="primary" variant="ghost" type="submit">
          {t("Send Email")}
        </Button>
        <p>
          {t("Remembered Password")}
          {` `}
          <Link
            className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
            href={`/signin?${decodeURIComponent(params.toString())}`}
          >
            {t("Login")}
          </Link>
        </p>
      </form>
    </>
  );
}
