"use client";
import { LoginInputs } from "@/types";
import { Button, Divider, Input } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { onEnterAndSpace } from "@/src/lib/keyEvents";
import Image from "next/image";
import { useTheme } from "next-themes";
import PasswordEye from "./PasswordEye";
import { z } from "zod";
import { GithubIcon } from "lucide-react";
import { Link, useRouter } from "@/src/navigation";

type IntlProps = Record<
  | "CorruptedLoginDataIntl"
  | "WithCredentialsIntl"
  | "SigninWithGoogleIntl"
  | "SigninWithDiscordIntl"
  | "SigninWithGithubIntl"
  | "UsernameOrEmailIntl"
  | "UsernameOrEmailRequiredIntl"
  | "PasswordRequiredErrorMessageIntl"
  | "PasswordMinLengthErrorMessageIntl"
  | "SigninIntl"
  | "DontHaveAnAccountIntl"
  | "SignupIntl"
  | "ForgotPasswordIntl"
  | "PasswordIntl"
  | "InvalidUsernameEmailOrPasswordIntl"
  | "OAuthAccountNotLinked",
  string
>;

export default function SigninForm({
  CorruptedLoginDataIntl,
  WithCredentialsIntl,
  SigninWithGoogleIntl,
  SigninWithDiscordIntl,
  SigninWithGithubIntl,
  UsernameOrEmailIntl,
  UsernameOrEmailRequiredIntl,
  PasswordRequiredErrorMessageIntl,
  PasswordMinLengthErrorMessageIntl,
  SigninIntl,
  DontHaveAnAccountIntl,
  SignupIntl,
  ForgotPasswordIntl,
  InvalidUsernameEmailOrPasswordIntl,
  PasswordIntl,
  OAuthAccountNotLinked,
}: IntlProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginInputs>({ mode: "all" });
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
      toast.error(CorruptedLoginDataIntl, {
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
          position: "bottom-center",
        });
      }
    });
  };
  useEffect(() => {
    if (params.get("error") === "CredentialsSignin") {
      toast.error(InvalidUsernameEmailOrPasswordIntl, {
        position: "bottom-center",
      });
      router.replace({
        pathname: "/signin",
        query: {
          callbackUrl: params.get("callbackUrl"),
        },
      });
    }
    if (params.get("error") === "OAuthAccountNotLinked") {
      toast.error(OAuthAccountNotLinked, {
        position: "bottom-center",
      });
      router.replace({
        pathname: "/signin",
        query: {
          callbackUrl: params.get("callbackUrl"),
        },
      });
    }
  }, [params.get("error")]);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  return (
    <form
      onSubmit={handleSubmit(onLoginSubmit)}
      className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl shadow-md bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-sm"
    >
      <Button
        className="rounded-sm"
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
        {SigninWithGoogleIntl}
      </Button>
      <Button
        className="rounded-sm"
        variant="bordered"
        color="primary"
        onClick={() => onProviderSignin("discord")}
        onKeyDown={(e) => onEnterAndSpace(e, () => onProviderSignin("discord"))}
      >
        {SigninWithDiscordIntl}
      </Button>
      <Button
        className="rounded-sm"
        variant="bordered"
        color="primary"
        onClick={() => onProviderSignin("github")}
        onKeyDown={(e) => onEnterAndSpace(e, () => onProviderSignin("github"))}
        startContent={<GithubIcon size={24} />}
      >
        {SigninWithGithubIntl}
      </Button>
      <Divider></Divider>
      <h1 className="text-fs-2 font-bold text-center">{WithCredentialsIntl}</h1>
      <Controller
        key={"usernameOrEmail"}
        name="usernameOrEmail"
        control={control}
        rules={{
          required: {
            value: true,
            message: UsernameOrEmailRequiredIntl,
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            aria-required
            {...field}
            dir="auto"
            autoComplete="on"
            label={UsernameOrEmailIntl}
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
            message: PasswordRequiredErrorMessageIntl,
          },
          minLength: {
            value: 8,
            message: PasswordMinLengthErrorMessageIntl,
          },
        }}
        render={({ field, fieldState: { error } }) => (
          <Input
            aria-required
            {...field}
            label={PasswordIntl}
            color="primary"
            variant="underlined"
            errorMessage={errors.password?.message}
            isInvalid={error !== undefined}
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            endContent={
              <PasswordEye
                handleVisibility={() => setIsPasswordVisible((val) => !val)}
                isVisible={isPasswordVisible}
              />
            }
          />
        )}
      />
      <Button className="rounded-sm" color="primary" variant="ghost" type="submit">
        {SigninIntl}
      </Button>
      <p>
        {DontHaveAnAccountIntl}{" "}
        <Link
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
          href={{
            pathname: "/signup",
            query: decodeURIComponent(params.toString()),
          }}
        >
          {SignupIntl}
        </Link>
      </p>
      <p>
        <Link
          className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
          href={{
            pathname: "/forgot-password",
            query: decodeURIComponent(params.toString()),
          }}
        >
          {ForgotPasswordIntl}
        </Link>
      </p>
    </form>
  );
}
