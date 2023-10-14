"use client";
import "react-toastify/dist/ReactToastify.css";
import { LoginInputs } from "@/types";
import { Button, Divider, Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import Link from "next-intl/link";
import React from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { onEnterAndSpace } from "@/src/lib/keyEvents";
import Image from "next/image";
import { useTheme } from "next-themes";
export default function SigninForm() {
  const {
    handleSubmit,
    control,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<LoginInputs>({ mode: "all" });
  const t = useTranslations("SigninForm");
  const params = useSearchParams();
  const { theme } = useTheme();

  const onLoginSubmit: SubmitHandler<LoginInputs> = async (data) => {
    await signIn("credentials", {
      username: data.usernameOrEmail.includes("@")
        ? undefined
        : data.usernameOrEmail,
      email: data.usernameOrEmail.includes("@")
        ? data.usernameOrEmail
        : undefined,
      password: data.password,
      callbackUrl: decodeURIComponent(
        (params.get("callbackUrl") as string) ?? "/"
      ),
    });
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
        });
      }
    });
  };
  return (
    <form
      onSubmit={handleSubmit(onLoginSubmit)}
      className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl shadow-md bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
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
        {t("Sign in with Google")}
      </Button>
      <Divider></Divider>
      <div>
        {params.get("error") === "CredentialsSignin" && (
          <p className="text-red-500">
            {t("Invalid username, email or password")}
          </p>
        )}
      </div>
      <Controller
        key={"usernameOrEmail"}
        name="usernameOrEmail"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label={t("Username or Email")}
            isRequired
            color="primary"
            variant="underlined"
            errorMessage={errors.usernameOrEmail?.message}
            isInvalid={error !== undefined}
          />
        )}
      />
      <Controller
        name="password"
        key="password"
        control={control}
        rules={{ required: true }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label={t("Password")}
            isRequired
            color="primary"
            variant="underlined"
            isInvalid={error !== undefined}
            type="password"
          />
        )}
      />
      <Button color="primary" variant="ghost" type="submit">
        {t("Sign In")}
      </Button>
      <p>
        {t("Don't have an account?")}{" "}
        <Link
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
          href={`/signup?${params.toString()}`}
        >
          {t("Sign Up")}
        </Link>
      </p>
      <p>
        <Link
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
          href={`/forgot-password?${params.toString()}`}
        >
          {t("Forgot Password")}
        </Link>
      </p>
    </form>
  );
}
