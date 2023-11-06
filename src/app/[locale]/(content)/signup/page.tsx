import SignupForm from "@/src/components/customs/Signup/SignupForm";
import { getServerAuthSession } from "@/src/server/auth";
import { Metadata } from "next";
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

export default async function Page() {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/?warning=alreadySignedIn");
  }
  return (
    <main className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
      <SignupForm />
    </main>
  );
}
