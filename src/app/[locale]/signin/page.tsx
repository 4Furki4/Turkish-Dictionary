import SigninForm from "@/src/components/customs/Signup/SigninForm";
import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/src/server/auth/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Params } from "next/dist/server/request/params";

export async function generateMetadata({
  params
}: {
  params: Params
}): Promise<Metadata> {
  const { locale } = await params
  switch (locale) {
    case "tr":
      return {
        title: "Giriş yap",
        description: "Hesabınıza giriş yapın",
      };
    default:
      return {
        title: "Sign in",
        description: "Sign in to your account",
      };
  }
}

export default async function page({
  params
}: {
  params: Params
}) {
  const { locale } = await params
  setRequestLocale(locale as string)
  const session = await auth();
  const t = await getTranslations("SigninForm");
  if (session) redirect("/?warning=alreadySignedIn");
  return (
    <main className="grid place-items-center w-full h-full mt-auto p-2">
      <SigninForm
        CorruptedLoginDataIntl={t("CorruptedLoginData")}
        WithCredentialsIntl={t("WithCredentials")}
        DontHaveAnAccountIntl={t("Don't have an account?")}
        ForgotPasswordIntl={t("Forgot Password")}
        PasswordMinLengthErrorMessageIntl={t("PasswordMinLengthErrorMessage")}
        PasswordRequiredErrorMessageIntl={t("PasswordRequiredErrorMessage")}
        PasswordIntl={t("Password")}
        InvalidUsernameEmailOrPasswordIntl={t(
          "Invalid username, email or password"
        )}
        OAuthAccountNotLinked={t("OAuthAccountNotLinked")}
        SigninWithGoogleIntl={t("Sign in with Google")}
        SigninWithDiscordIntl={t("Sign in with Discord")}
        SigninWithGithubIntl={t("Sign in with GitHub")}
        SigninIntl={t("Sign In")}
        UsernameOrEmailRequiredIntl={t("UsernameOrEmailRequired")}
        UsernameOrEmailIntl={t("Username or Email")}
        SignupIntl={t("Sign Up")}
      />
    </main>
  );
}
