import { getServerAuthSession } from "@/src/server/auth";
import { signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import React from "react";

export default async function Protected() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect("/signin?callbackUrl=/protected");
  }
  return (
    <div>
      <h1>Protected</h1>
      {/* <button onClick={() => signOut()}>Signout</button> */}
      {/* <pre>
        <code>{JSON.stringify(session, null, 2)}</code>
      </pre> */}
    </div>
  );
}
