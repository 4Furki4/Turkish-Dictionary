import WordCard from "@/src/components/customs/WordCard";
import { getServerAuthSession } from "@/src/server/auth";
import { api } from "@/src/trpc/server";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import React from "react";

export default async function Protected() {
  const savedWords = await api.user.getSavedWords.query();
  return (
    <div>
      <h1>Protected</h1>
      {savedWords.map((word) => (
        <WordCard word={word} />
      ))}
      {/* <button onClick={() => signOut()}>Signout</button> */}
      {/* <pre>
        <code>{JSON.stringify(session, null, 2)}</code>
      </pre> */}
    </div>
  );
}
