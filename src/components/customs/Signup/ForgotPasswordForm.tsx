"use client";
import "react-toastify/dist/ReactToastify.css";
import { trpc } from "@/src/app/_trpc/client";
import { ForgotPassword } from "@/types";
import { Button, Input } from "@nextui-org/react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { useRouter } from "next-intl/client";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";

export default function ForgotPasswordForm() {
  const t = useTranslations("ForgotPasswordForm");
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const {
    handleSubmit,
    control,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<ForgotPassword>({ mode: "all" });
  const forgotPasswordMutation =
    trpc.createUniqueForgotPasswordLink.useMutation({
      onError: (error) => {
        toast.error(t(error.message));
      },
      onSuccess: async (data) => {
        console.log(data);
        toast.success(t("Email Sent"));
        router.push(
          `${params.callbackUrl ? `?callbackUrl=${params.callbackUrl}` : ""}`,
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
        className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
            {t("Forgot Password")}
          </h1>
        </div>
        <Controller
          name="forgotPasswordEmail"
          rules={{
            required: true,
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
              message: "Please enter a valid email",
            },
          }}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              key={"forgotPasswordEmail"}
              type="email"
              {...field}
              label={t("Email")}
              isRequired
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
      </form>
    </>
  );
}
