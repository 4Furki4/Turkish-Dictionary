"use client";
import { onEnterAndSpace } from "@/src/lib/keyEvents";
import { SignupForm, SignupRequest } from "@/types";
import { Button, Divider, Input } from "@nextui-org/react";
import Image from "next/image";
import React, { useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { api } from "@/src/trpc/react";
import PasswordEye from "./PasswordEye";
import { Link, useRouter } from "@/src/navigation";

type SignUpFormProps = Record<
  | "SuccessMessageIntl"
  | "GoogleSignupIntl"
  | "CreateNewAccIntl"
  | "NameIntl"
  | "UsernameRequiredErrorIntl"
  | "NameRequiredErrorIntl"
  | "UsernameIntl"
  | "EmailRequiredErrorIntl"
  | "EmailIntl"
  | "PasswordPatternErrorIntl"
  | "PasswordRequiredErrorIntl"
  | "PasswordIntl"
  | "ConfirmPasswordRequiredErrorIntl"
  | "ConfirmPasswordIntl"
  | "SignupButtonIntl"
  | "AlreadyHaveAccountIntl"
  | "LoginIntl",
  string
>;

export default function SignupForm({
  SuccessMessageIntl,
  GoogleSignupIntl,
  CreateNewAccIntl,
  NameIntl,
  UsernameRequiredErrorIntl,
  NameRequiredErrorIntl,
  UsernameIntl,
  EmailRequiredErrorIntl,
  EmailIntl,
  PasswordPatternErrorIntl,
  PasswordRequiredErrorIntl,
  PasswordIntl,
  ConfirmPasswordRequiredErrorIntl,
  ConfirmPasswordIntl,
  SignupButtonIntl,
  AlreadyHaveAccountIntl,
  LoginIntl,
}: SignUpFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const { theme } = useTheme();
  const createUserMutation = api.auth.createUser.useMutation({
    onError: (error) => {
      if (error.data?.zodError?.fieldErrors) {
        // Validation error messages from zod
        for (const field in error.data?.zodError?.fieldErrors) {
          toast.error(t(error.data?.zodError?.fieldErrors[field]?.at(0)), {
            theme:
              theme === "dark"
                ? "dark"
                : theme === "light"
                ? "light"
                : "colored",
            position: "bottom-center",
          });
        }
        return;
      }

      toast.error(error.message, {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
    },
    onSuccess: async (data) => {
      toast.success(SuccessMessageIntl, {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
      console.log(params.get("callbackUrl"));
      router.push("/signin", { scroll: false });
    },
  });
  const onSignupSubmit: SubmitHandler<SignupForm> = (data: SignupRequest) => {
    const user = {
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.password,
    };
    createUserMutation.mutate(user);
  };
  const onProviderSignin = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: decodeURIComponent(
        (params.get("callbackUrl") as string) ?? "/"
      ),
    }).then((res) => {
      if (res?.error) {
        toast.error(res.error, {
          theme:
            theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
          position: "bottom-center",
        });
      }
    });
  };
  const {
    handleSubmit,
    control,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<SignupForm>({ mode: "all" });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  return (
    <form
      onSubmit={handleSubmit(onSignupSubmit)}
      className="flex flex-col gap-2 w-11/12 sm:w-full shadow-md max-w-xl bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
    >
      <Button
        variant="bordered"
        color="primary"
        onClick={() => onProviderSignin("google")}
        onKeyDown={(e) => onEnterAndSpace(e, () => onProviderSignin("google"))}
        startContent={
          <Image
            src={"/svg/providers/google.svg"}
            width={24}
            height={24}
            alt="google-icon"
          />
        }
      >
        {GoogleSignupIntl}
      </Button>
      <Divider></Divider>
      <h1 className="text-fs-2 font-bold text-center">{CreateNewAccIntl}</h1>
      <Controller
        name="name"
        rules={{
          required: { value: true, message: NameRequiredErrorIntl },
          onChange: (e) => {
            if (e.target.value.length > 0) {
              clearErrors("name");
            }
          },
        }}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            aria-required
            {...field}
            autoComplete="name"
            dir="auto"
            label={NameIntl}
            color="primary"
            variant="underlined"
            errorMessage={errors.name?.message}
            isInvalid={error !== undefined}
          />
        )}
      />
      <Controller
        name="username"
        rules={{
          required: {
            value: true,
            message: UsernameRequiredErrorIntl,
          },
        }}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            autoComplete="username"
            dir="auto"
            aria-required
            label={UsernameIntl}
            {...field}
            color="primary"
            variant="underlined"
            errorMessage={errors.username?.message}
            isInvalid={error !== undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        rules={{
          required: {
            value: true,
            message: EmailRequiredErrorIntl,
          },
          pattern: {
            value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
            message: "Please enter a valid email",
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            autoComplete="email"
            inputMode="email"
            dir="auto"
            aria-required
            type="email"
            {...field}
            label={EmailIntl}
            color="primary"
            variant="underlined"
            errorMessage={errors.email?.message}
            isInvalid={error !== undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        rules={{
          pattern: {
            value:
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=\S+$).{8,}$/,
            message: PasswordPatternErrorIntl,
          },
          required: {
            value: true,
            message: PasswordRequiredErrorIntl,
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            aria-required
            {...field}
            autoComplete="new-password"
            label={PasswordIntl}
            color="primary"
            variant="underlined"
            errorMessage={errors.password?.message}
            isInvalid={error !== undefined}
            type={isPasswordVisible ? "text" : "password"}
            endContent={
              <PasswordEye
                handleVisibility={() => setIsPasswordVisible((val) => !val)}
                isVisible={isPasswordVisible}
              />
            }
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        rules={{
          required: {
            value: true,
            message: ConfirmPasswordRequiredErrorIntl,
          },
          validate: (value) =>
            value === watch("password") || "Passwords do not match",
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            autoComplete="new-password"
            label={ConfirmPasswordIntl}
            color="primary"
            variant="underlined"
            errorMessage={errors.confirmPassword?.message}
            isInvalid={error !== undefined}
            endContent={
              <PasswordEye
                handleVisibility={() =>
                  setIsConfirmPasswordVisible((val) => !val)
                }
                isVisible={isConfirmPasswordVisible}
              />
            }
            type={isConfirmPasswordVisible ? "text" : "password"}
          />
        )}
      />

      <Button color="primary" variant="ghost" type="submit">
        {SignupButtonIntl}
      </Button>
      <p>
        {AlreadyHaveAccountIntl}{" "}
        <Link
          href={{
            pathname: "/signin",
            query: new URLSearchParams(params) as any,
          }}
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
        >
          {LoginIntl}
        </Link>
      </p>
    </form>
  );
}
