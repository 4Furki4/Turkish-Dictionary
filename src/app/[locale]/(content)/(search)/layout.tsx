import Search from "@/src/components/customs/Search";
import React from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Search>{children}</Search>;
}
