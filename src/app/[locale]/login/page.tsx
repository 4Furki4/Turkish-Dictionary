"use client";
import { signIn } from "next-auth/react";
import React from "react";

export default function page() {
  return (
    <div>
      <button
        onClick={() =>
          signIn("google", {
            redirect: false,
          })
        }
      >
        Signin with Google
      </button>
    </div>
  );
}
