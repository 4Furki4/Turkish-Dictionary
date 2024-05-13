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

type RootInput = Pick<InsertRoot, "root" | "language">;
type WordInput = ToUndefinedProps<
  // Replace null with undefined since null is not allowed in Input value prop of NextUI
  Prettify<
    Partial<
      Omit<InsertWord, "rootId" | "created_at" | "updated_at" | "id"> &
      RootInput
    >
  >
>;

type Meaning = {
  meaning: string;
  image: FileList | null;
  example?: {
    sentence: string | undefined;
    author: string | undefined;
  };
  partOfSpeechId: number | undefined;
  attributes: string;
};

type MeaningInputs = Partial<Meaning>;

type WordForm = Prettify<
  WordInput & {
    meanings: MeaningInputs[];
  }
>;

type WordSearchResult = {
  word_data: {
    word_id: number;
    word_name: string;
    phonetic: string;
    prefix: string;
    suffix: string;
    attributes: {
      attribute_id: number;
      attribute: string;
    }[];
    root: {
      root: string;
      language: string;
    };
    meanings: {
      meaning_id: number;
      meaning: string;
      part_of_speech: string;
    }[];
  }
}

