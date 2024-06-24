import SignupForm from "@/src/components/customs/Signup/SignupForm";
import { getServerAuthSession } from "@/src/server/auth";
import { Metadata } from "next";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import React from "react";

export async function generateMetadata({
  params: { locale },
}: {
  params: {
    locale: string;
  };
}): Promise<Metadata> {
  switch (locale) {
    case "tr":
      return {
        title: "Kayıt ol",
        description: "Hesap oluşturmak için kayıt olun",
      };
    default:
      return {
        title: "Sign up",
        description: "Sign up to create an account",
      };
  }
}

export default async function Page({
  params: { locale },
}: {
  params: {
    locale: string;
  };
}) {
  unstable_setRequestLocale(locale)
  const session = await getServerAuthSession();
  if (session) {
    redirect("/?warning=alreadySignedIn");
  }
  const t = await getTranslations("SignupForm");
  return (
    <main className="grid place-items-center w-full mt-auto p-2">
      <SignupForm
        CreateNewAccIntl={t("CreateNewAccount")}
        SuccessMessageIntl={t("SignupSuccess")}
        GoogleSignupIntl={t("Sign up with Google")}
        UsernameRequiredErrorIntl={t("UsernameRequiredErrorMessage")}
        NameIntl={t("Name")}
        NameRequiredErrorIntl={t("NameRequiredErrorMessage")}
        UsernameIntl={t("Username")}
        EmailRequiredErrorIntl={t("EmailRequiredErrorMessage")}
        EmailIntl={t("Email")}
        PasswordPatternErrorIntl={t("PasswordPatternErrorMessage")}
        PasswordRequiredErrorIntl={t("PasswordRequiredErrorMessage")}
        PasswordIntl={t("Password")}
        ConfirmPasswordRequiredErrorIntl={t(
          "ConfirmPasswordRequiredErrorMessage"
        )}
        ConfirmPasswordIntl={t("Confirm Password")}
        SignupButtonIntl={t("Sign Up Button")}
        AlreadyHaveAccountIntl={t("Already have an account?")}
        LoginIntl={t("Login")}
      />
    </main>
  );
}
