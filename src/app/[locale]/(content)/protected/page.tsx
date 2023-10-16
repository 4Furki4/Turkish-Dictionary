"use client";
import { signOut } from "next-auth/react";
import React from "react";

export default function Protected() {
  return (
    <div>
      <h1>Protected</h1>
      <button onClick={() => signOut()}>Signout</button>
    </div>
  );
}
