"use client";
import "react-toastify/dist/ReactToastify.css";
// You need to import our styles for the button to look right. Best to import in the root /layout.tsx but this is fine

import { UploadButton, UploadDropzone } from "@/src/lib/uploadthing";
import Image from "next/image";
import { toast } from "react-toastify";
import { useState } from "react";

export default function Profile() {
  const [uploadedPic, setUploadedPic] = useState<string | null>(null);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UploadButton
        endpoint="imageUploader"
        className="ut-button:bg-primary text-primary-foreground"
        onClientUploadComplete={(res) => {
          setUploadedPic(res ? res[0].url : "");
          // todo: save to db
          toast.success("Uploaded successfully!");
        }}
      />
    </main>
  );
}
