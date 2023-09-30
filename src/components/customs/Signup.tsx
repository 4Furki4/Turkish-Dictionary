"use client";

import { trpc } from "@/app/_trpc/client";
import { onEnterAndSpace } from "@/lib/keyEvents";
import { Button, Divider, Input } from "@nextui-org/react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next-intl/client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
// EXCLUDE CONFIRM PASSWORD
type SignUpRequest = Omit<SignUpInputs, "confirmPassword">;
type SignUpInputs = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};
type LoginInputs = {
  usernameOrEmail: string;
  loginPassword: string;
};

export default function Signup() {
  const mutation = trpc.createUser.useMutation();
  const onSignupSubmit: SubmitHandler<SignUpInputs> = async (
    data: SignUpRequest
  ) => {
    const createdUser = await mutation.mutateAsync(data);
    console.log(createdUser);
  };
  const onLoginSubmit: SubmitHandler<LoginInputs> = async (data) => {
    await signIn("credentials", {
      username: data.usernameOrEmail.includes("@")
        ? undefined
        : data.usernameOrEmail,
      email: data.usernameOrEmail.includes("@")
        ? data.usernameOrEmail
        : undefined,
      password: data.loginPassword,
      callbackUrl: decodeURIComponent(params.get("callbackUrl") ?? "/"),
    });
  };
  const onProviderSignin = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: decodeURIComponent(params.get("callbackUrl") ?? "/"),
    });
  };
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpInputs & LoginInputs>({ mode: "all" });
  const params = useSearchParams();
  const router = useRouter();
  const userParam = params.get("user");
  const t = useTranslations("Signup");
  return (
    <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
      {userParam && userParam === "new" ? (
        <form
          onSubmit={handleSubmit(onSignupSubmit)}
          className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl bg-background/70 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
        >
          <Button
            variant="bordered"
            onClick={() => onProviderSignin("google")}
            onKeyDown={(e) =>
              onEnterAndSpace(e, () => onProviderSignin("google"))
            }
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
              required: true,
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
                label={t("Name")}
                isRequired
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
              required: true,
              onChange: (e) => {
                if (e.target.value.length > 0) {
                  clearErrors("username");
                }
              },
            }}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                label={t("Username")}
                isRequired
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
              required: true,
              pattern: {
                value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
                message: "Please enter a valid email",
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                type="email"
                {...field}
                label={t("Email")}
                isRequired
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
              required: true,
              minLength: {
                value: 8,
                message: "Password must have at least 8 characters",
              },
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                label={t("Password")}
                isRequired
                color="primary"
                variant="underlined"
                errorMessage={errors.password?.message}
                isInvalid={error !== undefined}
                type="password"
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: true,
              validate: (value) =>
                value === watch("password") || "Passwords do not match",
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                {...field}
                label={t("Confirm Password")}
                isRequired
                color="primary"
                variant="underlined"
                errorMessage={errors.confirmPassword?.message}
                isInvalid={error !== undefined}
                type="password"
              />
            )}
          />

          <Button color="primary" variant="ghost" type="submit">
            {t("Sign Up Button")}
          </Button>
          <p>
            {t("Already have an account?")}{" "}
            <span
              className="underline cursor-pointer"
              onClick={() =>
                router.push(
                  `${
                    params.get("callbackUrl")
                      ? `?callbackUrl=${params.get("callbackUrl")}`
                      : ""
                  }`,
                  { scroll: false }
                )
              }
            >
              {t("Login")}
            </span>
          </p>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit(onLoginSubmit)}
          className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl bg-background/70 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
        >
          <Button
            variant="bordered"
            onClick={() => onProviderSignin("google")}
            onKeyDown={(e) =>
              onEnterAndSpace(e, () => onProviderSignin("google"))
            }
            startContent={
              <Image
                src={"/svg/providers/google.svg"}
                width={24}
                height={24}
                alt="google-icon"
              />
            }
          >
            Sign in with Google
          </Button>
          <Divider></Divider>
          <Controller
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
            name="loginPassword"
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
            <span
              className="underline cursor-pointer"
              onClick={() =>
                router.push(
                  `${
                    params.get("callbackUrl")
                      ? `?callbackUrl=${params.get("callbackUrl")}&user=new`
                      : "?user=new"
                  }`,
                  { scroll: false }
                )
              }
            >
              {t("Sign Up")}
            </span>
          </p>
        </form>
      )}
    </div>
  );
}
