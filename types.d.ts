import type * as Prisma from "@prisma/client";
type Word = {
  meanings: Prisma.Meaning[];
} & Prisma.Word;

type SignUpRequest = Omit<SignUpInputs, "confirmPassword">; // Omit confirmPassword from SignUpInputs to create SignUpRequest
type SignUpInputs = {
  name: string;
  username: string;
  email: string;
  signupPassword: string;
  confirmPassword: string;
};
type LoginInputs = {
  usernameOrEmail: string;
  password: string;
};

type ForgotPassword = {
  forgotPasswordEmail: string;
};
