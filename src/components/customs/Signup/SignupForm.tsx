"use client";
import "react-toastify/dist/ReactToastify.css";
import { onEnterAndSpace } from "@/src/lib/keyEvents";
import { SignUpInputs, SignUpRequest } from "@/types";
import { Button, Divider, Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import Link from "next-intl/link";
import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next-intl/client";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { api } from "@/src/trpc/react";
import PasswordEye from "./PasswordEye";
import { z } from "zod";
import { TRPCClientError } from "@trpc/client";
export default function SignupForm() {
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
      toast.success(t("Account created successfully, please sign in"), {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
      console.log(params.get("callbackUrl"));
      router.push("/signin", { scroll: false });
    },
  });
  const onSignupSubmit: SubmitHandler<SignUpInputs> = (data: SignUpRequest) => {
    const user = {
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.signupPassword,
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
  } = useForm<SignUpInputs>({ mode: "all" });
  const t = useTranslations("SignupForm");
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
        {t("Sign up with Google")}
      </Button>
      <Divider></Divider>
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold">
          {t("Create a new account")}
        </h1>
      </div>
      <Controller
        name="name"
        rules={{
          required: { value: true, message: t("NameRequiredErrorMessage") },
          onChange: (e) => {
            if (e.target.value.length > 0) {
              clearErrors("name");
            }
          },
        }}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            inputMode="text"
            autoComplete="name"
            dir="auto"
            label={t("Name")}
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
            message: t("UsernameRequiredErrorMessage"),
          },
        }}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            autoComplete="username"
            inputMode="text"
            dir="auto"
            label={t("Username")}
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
            message: t("EmailRequiredErrorMessage"),
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
            type="email"
            {...field}
            label={t("Email")}
            color="primary"
            variant="underlined"
            errorMessage={errors.email?.message}
            isInvalid={error !== undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="signupPassword"
        rules={{
          pattern: {
            value:
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=\S+$).{8,}$/,
            message: t("PasswordPatternErrorMessage"),
          },
          required: {
            value: true,
            message: t("PasswordRequiredErrorMessage"),
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            autoComplete="new-password"
            label={t("Password")}
            color="primary"
            variant="underlined"
            errorMessage={errors.signupPassword?.message}
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
            message: t("ConfirmPasswordRequiredErrorMessage"),
          },
          validate: (value) =>
            value === watch("signupPassword") || "Passwords do not match",
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            autoComplete="new-password"
            label={t("Confirm Password")}
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
        {t("Sign Up Button")}
      </Button>
      <p>
        {t("Already have an account?")}{" "}
        <Link
          href={`/signin?${decodeURIComponent(params.toString())}`}
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
        >
          {t("Login")}
        </Link>
      </p>
    </form>
  );
}
