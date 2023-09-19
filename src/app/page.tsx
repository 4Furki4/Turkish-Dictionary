"use client";
import { trpc } from "./_trpc/client";

export default function Home() {
  const { data } = trpc.helloWorld.useQuery();
  return (
    <main>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
