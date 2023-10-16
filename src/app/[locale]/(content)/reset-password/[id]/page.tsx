"use client";
import "react-toastify/dist/ReactToastify.css";
import { Button, Spinner } from "@nextui-org/react";
import React, { useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next-intl/client";
import { useTheme } from "next-themes";
import { api } from "@/src/trpc/react";
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
  const { theme } = useTheme();
  const onSubmit: SubmitHandler<ForgotPasswordForm> = async (data) => {
    await resetPasswordMutation.mutateAsync({
      token: searchParams.token as string,
      id: params.id,
      newPassword: data.resetPassword,
    });
  };
  const forgotPasswordMutation = api.auth.verifyResetPasswordToken.useMutation({
    onError(error) {
      toast.info("Redirecting to signup page", {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
        autoClose: 2500,
      });
      setTimeout(() => {
        router.replace("/signup");
      }, 3000);
    },
  });
  const resetPasswordMutation = api.auth.resetPassword.useMutation({
    onError(error) {
      toast.error(t(error.message), {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
    },
    onSuccess(data) {
      toast.success(t("PasswordResetSuccess"), {
        autoClose: 1500,
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
      // wait 2 seconds before redirecting to login
      setTimeout(() => {
        router.replace("/signin");
      }, 2000);
    },
  });
  useEffect(() => {
    const verifyResetPasswordToken = async () => {
      await forgotPasswordMutation.mutateAsync({
        token: searchParams.token as string,
        id: params.id,
      });
    };
    verifyResetPasswordToken();
  }, []);
  return (
    <>
      {forgotPasswordMutation.status === "loading" && (
        <Spinner size="lg" className="fixed inset-0 m-auto" />
      )}
      {forgotPasswordMutation.error && (
        <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
          <div className="flex flex-col shadow-md gap-12 w-11/12 sm:w-full max-w-xl bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl">
            <h1 className="text-xl sm:text-3xl lg:text-6xl">{t("Opps!")}</h1>
            <p className="sm:text-xl">
              {t(forgotPasswordMutation.error.message)}
            </p>
          </div>
        </div>
      )}
      {forgotPasswordMutation.isSuccess && (
        <div className="absolute grid  place-items-center w-full h-[calc(100%-64px)] p-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col shadow-md gap-2 w-11/12 sm:w-full max-w-xl bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
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
                required: true,
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
