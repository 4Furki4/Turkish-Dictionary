import Signup from "@/components/customs/Signup";
import { Metadata } from "next";
import React from "react";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  if (searchParams.user === "new") {
    return {
      title: "Sign up",
      description: "Sign up to create an account",
    };
  }
  return {
    title: "Sign in",
    description: "Sign in to your account",
  };
}

export default function Page() {
  return <Signup />;
}
