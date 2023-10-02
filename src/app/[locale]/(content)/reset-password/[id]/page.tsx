"use client";
import "react-toastify/dist/ReactToastify.css";
import { trpc } from "@/app/_trpc/client";
import { Button, Spinner } from "@nextui-org/react";
import React, { useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next-intl/client";
type ForgotPasswordForm = {
  resetPassword: string;
  resetPasswordConfirm: string;
};

export default function Page({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  params: {
    id: string;
  };
}) {
  const { handleSubmit, control, watch, clearErrors } =
    useForm<ForgotPasswordForm>({
      mode: "all",
    });
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const [isResetPasswordVisible, setIsResetPasswordVisible] =
    React.useState(false);
  const [isResetPasswordConfirmVisible, setIsResetPasswordConfirmVisible] =
    React.useState(false);
  const onSubmit: SubmitHandler<ForgotPasswordForm> = async (data) => {
    await resetPasswordMutation.mutateAsync({
      token: searchParams.token as string,
      id: params.id,
      newPassword: data.resetPassword,
    });
  };
  const forgotPasswordMutation = trpc.verifyResetPasswordToken.useMutation({
    onError(error) {
      toast.error(error.message);
    },
    onSuccess(data) {
      console.log(data);
    },
  });
  const resetPasswordMutation = trpc.resetPassword.useMutation({
    onError(error) {
      toast.error(error.message);
    },
    onSuccess(data) {
      toast.success(t("PasswordResetSuccess"));
      // wait 2 seconds before redirecting to login
      setTimeout(() => {
        router.push("/signup");
      }, 2000);
    },
  });
  useEffect(() => {
    forgotPasswordMutation.mutate({
      token: searchParams.token as string,
      id: params.id,
    });
  }, [searchParams.token, params.id]);
  return (
    <>
      {forgotPasswordMutation.status === "loading" && (
        <Spinner className="fixed inset-0 m-auto" />
      )}
      {forgotPasswordMutation.error && (
        <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
          <div>
            <h1>Error</h1>
            <p>{forgotPasswordMutation.error.message}</p>
          </div>
        </div>
      )}
      {forgotPasswordMutation.isSuccess && (
        <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl bg-background/70 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
          >
            <h1>{t("Reset Password")}</h1>
            <Controller
              name="resetPassword"
              control={control}
              rules={{
                pattern: {
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=\S+$).{8,}$/,
                  message: t("PasswordPatternErrorMessage"),
                },
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  endContent={
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setIsResetPasswordVisible((prev) => !prev);
                      }}
                    >
                      {isResetPasswordVisible ? <EyeOff /> : <Eye />}
                    </div>
                  }
                  isRequired
                  label={t("Password")}
                  type={isResetPasswordVisible ? "text" : "password"}
                  variant="underlined"
                  color="primary"
                  {...field}
                  isInvalid={error !== undefined}
                  errorMessage={error?.message}
                />
              )}
            />
            <Controller
              name="resetPasswordConfirm"
              control={control}
              rules={{
                validate: (value) => {
                  if (value === watch("resetPassword")) {
                    return true;
                  } else {
                    return t("Passwords do not match");
                  }
                },
                required: true,
              }}
              render={({ field, fieldState: { error } }) => (
                <Input
                  isRequired
                  endContent={
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setIsResetPasswordConfirmVisible((prev) => !prev);
                      }}
                    >
                      {isResetPasswordConfirmVisible ? <EyeOff /> : <Eye />}
                    </div>
                  }
                  label={t("Confirm Password")}
                  type={isResetPasswordConfirmVisible ? "text" : "password"}
                  variant="underlined"
                  color="primary"
                  {...field}
                  isInvalid={error !== undefined}
                  errorMessage={error?.message}
                />
              )}
            />
            <Button color="primary" variant="ghost" type="submit">
              {t("Reset Password")}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
