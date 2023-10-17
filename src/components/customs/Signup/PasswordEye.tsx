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
      className="cursor-pointer"
      onClick={() => {
        handleVisibility();
      }}
    >
      {isVisible ? <EyeOff /> : <Eye />}
    </div>
  );
}
