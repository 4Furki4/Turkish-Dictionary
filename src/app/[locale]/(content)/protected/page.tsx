"use client";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import React from "react";

export default function Protected() {
  const { data } = useSession();
  const savedWords = trpc.getSavedWords.useQuery(data?.user?.email!);
  console.log(savedWords.data);
  return (
    <div>
      <h1>Protected</h1>
      <button onClick={() => signOut()}>Signout</button>
      <Button>Log Saved Words</Button>
    </div>
  );
}
