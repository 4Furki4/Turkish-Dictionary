"use client";

import { Button, Divider, Input } from "@nextui-org/react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import React from "react";
import { SubmitHandler, useForm, Controller } from "react-hook-form";

type Inputs = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Signup() {
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    console.log(data);
    console.log(errors);
  };
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<Inputs>({ mode: "onBlur" });
  return (
    <div className="absolute grid place-items-center w-full h-[calc(100%-64px)] p-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-11/12 sm:w-full max-w-xl bg-background/70 backdrop-saturate-150 p-6 sm:p-12 rounded-xl"
      >
        <Button
          onClick={() => signIn("google")}
          startContent={
            <Image
              src={"https://authjs.dev/img/providers/google.svg"}
              width={24}
              height={24}
              alt="google-icon"
            />
          }
        >
          Sign up with Google
        </Button>
        <Divider></Divider>
        <div>
          <h1 className="text-4xl font-bold">Create a new account</h1>
        </div>
        <Controller
          name="name"
          rules={{
            required: true,
            onChange: (e) => {
              if (e.target.value.length > 0) {
                clearErrors("name");
              }
            },
          }}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Name"
              isRequired
              color="primary"
              variant="underlined"
              errorMessage={errors.name?.message}
              isInvalid={error !== undefined}
            />
          )}
        />
        <Controller
          name="username"
          rules={{
            required: true,
            onChange: (e) => {
              if (e.target.value.length > 0) {
                clearErrors("username");
              }
            },
          }}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Username"
              isRequired
              color="primary"
              variant="underlined"
              errorMessage={errors.username?.message}
              isInvalid={error !== undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={{
            required: true,
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
              message: "Please enter a valid email",
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              type="email"
              {...field}
              label="Email"
              isRequired
              color="primary"
              variant="underlined"
              errorMessage={errors.email?.message}
              isInvalid={error !== undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{
            required: true,
            minLength: {
              value: 8,
              message: "Password must have at least 8 characters",
            },
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Password"
              isRequired
              color="primary"
              variant="underlined"
              errorMessage={errors.password?.message}
              isInvalid={error !== undefined}
              type="password"
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: true,
            validate: (value) =>
              value === watch("password") || "Passwords do not match",
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              {...field}
              label="Confirm password"
              isRequired
              color="primary"
              variant="underlined"
              errorMessage={errors.confirmPassword?.message}
              isInvalid={error !== undefined}
              type="password"
            />
          )}
        />

        <Button color="primary" variant="ghost" type="submit">
          Sign up
        </Button>
      </form>
    </div>
  );
}
