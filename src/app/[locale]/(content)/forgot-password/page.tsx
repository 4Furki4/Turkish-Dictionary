import ForgotPasswordForm from "@/src/components/customs/Signup/ForgotPasswordForm";
import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/src/server/auth";

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
        title: "Şifremi unuttum",
        description: "Şifrenizi sıfırlayın",
      };
    default:
      return {
        title: "Forgot password",
        description: "Reset your password",
      };
  }
}

export default async function page() {
  const session = await getServerAuthSession();
  if (session) redirect("/?warning=alreadySignedIn");
  return (
    <main className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
      <ForgotPasswordForm />
    </main>
  );
}
