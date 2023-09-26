import { Loader } from "lucide-react";
import React from "react";

export default function Loading() {
  return (
    <div className="fixed top-1/2 left-1/2 animate-spin">
      <Loader />
    </div>
  );
}
