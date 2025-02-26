"use client";
import { cn } from "@/src/lib/utils";
import { BookmarkIcon } from "lucide-react";
import React, { useState } from "react";

export default function Bookmark({
  handleClick,
  className,
  isSaved,
}: {
  handleClick: () => Promise<boolean>;
  className?: string;
  isSaved: boolean;
}) {
  const [isBookmarked, setIsBookmarked] = useState(isSaved);
  return (
    <BookmarkIcon
      onClick={async () => {
        setIsBookmarked(!isBookmarked);
        const isSaveSuccesful = await handleClick();
        if (!isSaveSuccesful) setIsBookmarked(!isBookmarked);
      }}
      className={cn("sm:w-8 sm:h-8 cursor-pointer z-10", className)}
    />
  );
}
