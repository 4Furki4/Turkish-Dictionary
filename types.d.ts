import type { SelectWord } from "./db/schema";

type LoginInputs = {
  usernameOrEmail: string;
  password: string;
};

type ForgotPassword = {
  forgotPasswordEmail: string;
};
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type SignupInputs =
  | "name"
  | "username"
  | "email"
  | "password"
  | "confirmPassword";
type SignupForm = Record<SignupInputs, string>;

type SignupRequest = Omit<SignupForm, "confirmPassword">; // Omit confirmPassword from SignUpInputs to create SignUpRequest
type ReplaceNullWithUndefined<T> = T extends null ? undefined : T;
type ToUndefinedProps<T> = {
  // Replace null with undefined
  [P in keyof T]: ReplaceNullWithUndefined<T[P]>;
};

type WordInputs = Prettify<
  ToUndefinedProps<
    // to avoid react hook form type errors
    Omit<
      SelectWord,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "attributes"
      | "relatedWords"
      | "relatedPhrases"
    >
  > &
    Record<"attributes" | "relatedWords" | "relatedPhrases", string | undefined>
>;

type MeaningInputs = {
  definition: {
    definition: string;
    image: FileList | null | undefined;
    example?: {
      sentence: string;
      author: string | undefined;
    };
  };
  partOfSpeech: string;
  attributes: string | undefined;
};
type WordForm = Prettify<
  WordInputs & {
    meanings: MeaningInputs[];
  }
>;
