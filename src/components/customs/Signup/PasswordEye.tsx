"use client";
import { Eye, EyeOff } from "lucide-react";
import React from "react";

export default function PasswordEye({
  handleVisibility,
  isVisible,
}: {
  handleVisibility: () => void;
  isVisible: boolean;
}) {
  return (
    <div
      tabIndex={0}
      aria-hidden
      className="cursor-pointer"
      onClick={() => {
        handleVisibility();
      }}
    >
      {isVisible ? (
        <EyeOff aria-label="Eye Off Icon" />
      ) : (
        <Eye aria-label="Eye Icon" />
      )}
    </div>
  );
}
