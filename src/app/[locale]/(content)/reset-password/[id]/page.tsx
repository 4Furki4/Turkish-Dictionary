"use client";
import { trpc } from "@/app/_trpc/client";
import { Spinner } from "@nextui-org/react";
import React, { useEffect } from "react";
export default function Page({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  params: {
    id: string;
  };
}) {
  const forgotPasswordMutation = trpc.verifyResetPasswordToken.useMutation({
    onError(error) {
      console.log(error);
    },
    onSuccess(data) {
      console.log(data);
    },
  });
  useEffect(() => {
    forgotPasswordMutation.mutate({
      token: searchParams.token as string,
      id: params.id,
    });
  }, [searchParams.token, params.id]);
  console.log(forgotPasswordMutation);
  return (
    <>
      {forgotPasswordMutation.status === "loading" && (
        <Spinner className="fixed inset-0 m-auto" />
      )}
      {forgotPasswordMutation.error && (
        <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
          <div>
            <h1>Error</h1>
            <p>{forgotPasswordMutation.error.message}</p>
          </div>
        </div>
      )}
      {forgotPasswordMutation.isSuccess && (
        <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
          <div>
            <h1>Reset password</h1>
            {/*
              TODO: Add reset password form
            */}
          </div>
        </div>
      )}
    </>
  );
}
