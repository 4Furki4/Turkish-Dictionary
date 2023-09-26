import React from "react";

export default function Page({
  params: { word },
}: {
  params: { word: string };
}) {
  return <div>{word}</div>;
}
