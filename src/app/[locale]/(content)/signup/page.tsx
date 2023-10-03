import Signup from "@/components/customs/Signup";
import { Metadata } from "next";
import React, { Suspense } from "react";

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
  if (searchParams.user === "forgot") {
    return {
      title: "Forgot password",
      description: "Forgot your password? No problem, we'll help you reset it.",
    };
  }
  return {
    title: "Sign in",
    description: "Sign in to your account",
  };
}

export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return <Signup params={searchParams} />;
}
