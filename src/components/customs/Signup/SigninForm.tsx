"use client";
import "react-toastify/dist/ReactToastify.css";
import { LoginInputs } from "@/types";
import { Button, Divider, Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import Link from "next-intl/link";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { onEnterAndSpace } from "@/src/lib/keyEvents";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter } from "next-intl/client";
import PasswordEye from "./PasswordEye";
import { z } from "zod";
import { GithubIcon } from "lucide-react";
export default function SigninForm() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginInputs>({ mode: "all" });
  const t = useTranslations("SigninForm");
  const params = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const credentialSchema = z.object({
    usernameOrEmail: z.string().min(3),
    password: z.string().min(8),
  });
  const onLoginSubmit: SubmitHandler<LoginInputs> = async (data) => {
    const result = credentialSchema.safeParse(data);
    if (!result.success) {
      toast.error(t("CorruptedLoginData"), {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
      return;
    }
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
  const onProviderSignin = (provider: "google" | "discord" | "github") => {
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
  useEffect(() => {
    if (params.get("error") === "CredentialsSignin") {
      toast.error(t("Invalid username, email or password"), {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
      router.replace(
        `/signin?${
          params.get("callbackUrl")
            ? `callbackUrl=${params.get("callbackUrl")}`
            : ""
        }`
      );
    }
    if (params.get("error") === "OAuthAccountNotLinked") {
      toast.error(t("OAuthAccountNotLinked"), {
        theme:
          theme === "dark" ? "dark" : theme === "light" ? "light" : "colored",
        position: "bottom-center",
      });
      router.replace(
        `/signin?${
          params.get("callbackUrl")
            ? `callbackUrl=${params.get("callbackUrl")}`
            : ""
        }`
      );
    }
  }, [params.get("error")]);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
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
      <Button
        variant="bordered"
        color="primary"
        onClick={() => onProviderSignin("discord")}
        onKeyDown={(e) => onEnterAndSpace(e, () => onProviderSignin("discord"))}
      >
        {"Sign in with Discord"}
      </Button>
      <Button
        variant="bordered"
        color="primary"
        onClick={() => onProviderSignin("github")}
        onKeyDown={(e) => onEnterAndSpace(e, () => onProviderSignin("github"))}
        startContent={<GithubIcon size={24} />}
      >
        {"Sign in with Github"}
      </Button>
      <Divider></Divider>
      <Controller
        key={"usernameOrEmail"}
        name="usernameOrEmail"
        control={control}
        rules={{
          required: {
            value: true,
            message: t("UsernameOrEmailRequired"),
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label={t("Username or Email")}
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
        rules={{
          required: {
            value: true,
            message: t("PasswordRequiredErrorMessage"),
          },
          minLength: {
            value: 8,
            message: t("PasswordMinLengthErrorMessage"),
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            {...field}
            label={t("Password")}
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
      <Button color="primary" variant="ghost" type="submit">
        {t("Sign In")}
      </Button>
      <p>
        {t("Don't have an account?")}{" "}
        <Link
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
          href={`/signup?${decodeURIComponent(params.toString())}`}
        >
          {t("Sign Up")}
        </Link>
      </p>
      <p>
        <Link
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
          href={`/forgot-password?${decodeURIComponent(params.toString())}`}
        >
          {t("Forgot Password")}
        </Link>
      </p>
    </form>
  );
}
