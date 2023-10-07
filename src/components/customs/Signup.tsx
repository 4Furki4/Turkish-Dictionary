"use client";
import "react-toastify/dist/ReactToastify.css";
import { trpc } from "@/app/_trpc/client";
import { onEnterAndSpace } from "@/lib/keyEvents";
import { Button, Divider, Input } from "@nextui-org/react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next-intl/link";
import { useRouter } from "next-intl/client";
import Image from "next/image";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";

type SignUpRequest = Omit<SignUpInputs, "confirmPassword">; // Omit confirmPassword from SignUpInputs to create SignUpRequest
type SignUpInputs = {
  name: string;
  username: string;
  email: string;
  signupPassword: string;
  confirmPassword: string;
};
type LoginInputs = {
  usernameOrEmail: string;
  password: string;
};

type ForgotPassword = {
  forgotPasswordEmail: string;
};

export default function Signup({
  params,
}: {
  params: { [key: string]: string | string[] | undefined };
}) {
  const createUserMutation = trpc.createUser.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: async (data) => {
      toast.success(t("Account created successfully, please sign in"));
      router.push(
        `${params.callbackUrl ? `?callbackUrl=${params.callbackUrl}` : ""}`,
        { scroll: false }
      );
    },
  });
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
  const locale = useLocale();
  const onForgotPasswordSubmit: SubmitHandler<ForgotPassword> = (data) => {
    forgotPasswordMutation.mutate({
      email: data.forgotPasswordEmail,
      locale,
    });
  };
  const onSignupSubmit: SubmitHandler<SignUpInputs> = (data: SignUpRequest) => {
    createUserMutation.mutate({
      name: data.name,
      username: data.username,
      email: data.email,
      password: data.signupPassword,
    });
  };
  const onLoginSubmit: SubmitHandler<LoginInputs> = async (data) => {
    await signIn("credentials", {
      username: data.usernameOrEmail.includes("@")
        ? undefined
        : data.usernameOrEmail,
      email: data.usernameOrEmail.includes("@")
        ? data.usernameOrEmail
        : undefined,
      password: data.password,
      callbackUrl: decodeURIComponent((params.callbackUrl as string) ?? "/"),
    });
  };
  const onProviderSignin = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: decodeURIComponent((params.callbackUrl as string) ?? "/"),
    }).then((res) => {
      if (res?.error) {
        toast.error(res.error);
      }
    });
  };
  const {
    handleSubmit,
    control,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpInputs & LoginInputs & ForgotPassword>({ mode: "all" });
  const router = useRouter();
  const userParam = params.user;
  const t = useTranslations("Signup");
  return (
    <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
      {userParam && userParam === "new" ? (
        <form
          onSubmit={handleSubmit(onSignupSubmit)}
          className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
        >
          <Button
            variant="bordered"
            color="primary"
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
            name="signupPassword"
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
                errorMessage={errors.signupPassword?.message}
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
                value === watch("signupPassword") || "Passwords do not match",
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
            <Link
              href={`${
                params.callbackUrl ? `?callbackUrl=${params.callbackUrl}` : ""
              }`}
              className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
            >
              {t("Login")}
            </Link>
          </p>
        </form>
      ) : userParam === "forgot" ? (
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
                  errorMessage={errors.email?.message}
                  isInvalid={error !== undefined}
                />
              )}
            />
            <Button color="primary" variant="ghost" type="submit">
              {t("Send Email")}
            </Button>
            <p>
              {t("Already have an account?")}{" "}
              <Link
                href={`${
                  params.callbackUrl ? `?callbackUrl=${params.callbackUrl}` : ""
                }`}
                className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
              >
                {t("Login")}
              </Link>
            </p>
          </form>
        </>
      ) : (
        <form
          onSubmit={handleSubmit(onLoginSubmit)}
          className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
        >
          <Button
            variant="bordered"
            color="primary"
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
          <div>
            {params.error === "CredentialsSignin" && (
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
              href={`${
                params.callbackUrl
                  ? `?callbackUrl=${params.callbackUrl}&user=new`
                  : "?user=new"
              }`}
            >
              {t("Sign Up")}
            </Link>
          </p>
          <p>
            <Link
              className="underline hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
              href={`${
                params.callbackUrl
                  ? `?callbackUrl=${params.callbackUrl}&user=forgot`
                  : "?user=forgot"
              }`}
            >
              {t("Forgot Password")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
