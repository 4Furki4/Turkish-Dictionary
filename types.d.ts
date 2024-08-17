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

type WordInput = ToUndefinedProps<
  // Replace null with undefined since null is not allowed in Input value prop of NextUI
  Prettify<
    Partial<
      Omit<InsertWord, "rootId" | "created_at" | "updated_at" | "id"> &
      {
        language: string
        root: string;
        attributes: string[];
      }
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

type WordFormSubmit = Prettify<{
  name: string;
  language?: string;
  phonetic?: string;
  root?: string;
  prefix?: string;
  suffix?: string;
  attributes: number[]
  meanings: {
    meaning: string;
    partOfSpeechId: number;
    attributes?: string;
    example?: {
      sentence: string;
      author: 'string | number';
    }
  }[]
}>;
type Language = {
  id: number;
  language_en: string;
  language_tr: string;
  language_code: string;
}
type WordSearchResult = {
  word_data: {
    word_id: number;
    word_name: string;
    phonetic: string;
    prefix: string;
    suffix: string;
    attributes?: {
      attribute_id: number;
      attribute: string;
    }[];
    root: {
      root: string;
    } & Omit<Language, "id">
    meanings: {
      meaning_id: number;
      meaning: string;
      part_of_speech: string;
      sentence: string | null;
      author: string | null;
      attributes?: [
        {
          attribute_id: number;
          attribute: string;
        }
      ]
    }[];
  }
}

type DashboardWordList = {
  word_id: number;
  name: string;
  meaning: string;
}

type EditWordForm = {
  name: string
  attributes: string[]
  language: string
  root: string
  phonetic: string
}

type NewAttributeForm = {
  attribute: string
}
