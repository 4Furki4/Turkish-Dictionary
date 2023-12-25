import SigninForm from "@/src/components/customs/Signup/SigninForm";
import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/src/server/auth";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
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

export default async function page() {
  const session = await getServerAuthSession();
  if (session) redirect("/?warning=alreadySignedIn");
  return (
    <main className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
      <SigninForm />
    </main>
  );
}
