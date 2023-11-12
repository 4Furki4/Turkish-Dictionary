import { getServerAuthSession } from "@/src/server/auth";
import React from "react";
export default async function Page() {
  console.log(await getServerAuthSession());
  return <></>; // This page is intentionally left blank to render the layout.
}
