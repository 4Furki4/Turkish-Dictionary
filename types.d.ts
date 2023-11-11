import type * as Prisma from "@prisma/client";
type Word = {
  meanings: Prisma.Meaning[];
} & Prisma.Word;

type LoginInputs = {
  usernameOrEmail: string;
  password: string;
};

type ForgotPassword = {
  forgotPasswordEmail: string;
};

type SignupInputs =
  | "name"
  | "username"
  | "email"
  | "password"
  | "confirmPassword";
type SignupForm = Record<SignupInputs, string>;

type SignupRequest = Omit<SignUpForm, "confirmPassword">; // Omit confirmPassword from SignUpInputs to create SignUpRequest
