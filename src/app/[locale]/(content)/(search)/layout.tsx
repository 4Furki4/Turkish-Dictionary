"use client";
import { Button, Input } from "@nextui-org/react";
import React from "react";
import { useRouter } from "next-intl/client";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <>
      <form
        className="max-w-5xl mx-auto px-6"
        onSubmit={(e) => {
          e.preventDefault();
          const search = e.currentTarget.search.value;
          router.push(`/search?word=${search}`);
        }}
      >
        <div className="flex">
          <Input color="primary" name="search" placeholder="Search Words..." />
          <Button type="submit">Search</Button>
        </div>
      </form>
      {children}
    </>
  );
}
