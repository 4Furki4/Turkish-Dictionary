import { auth } from "@/src/server/auth/auth";
import { redirect, RedirectType } from "next/navigation";

export default async function Profile() {
  const session = await auth();
  if (!session) redirect("/signin", RedirectType.replace);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Profile</h1>
    </main>
  );
}
