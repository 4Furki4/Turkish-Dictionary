import { InsertMeaning } from "./db/schema/meanings";
import { PartOfSpeech } from "./db/schema/part_of_speechs";
import { InsertRoot } from "./db/schema/roots";
import { InsertWord } from "./db/schema/words";

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

type WordInput = Prettify<
  Omit<InsertWord, "rootId" | "created_at" | "updated_at">
>;

type MeaningInputs = {
  meaning: {
    meaning: string;
    image: FileList | null | undefined;
    example?: {
      sentence: string;
      author: string | undefined;
    };
  };
  partOfSpeech: PartOfSpeech;
  attributes: string | undefined;
};
