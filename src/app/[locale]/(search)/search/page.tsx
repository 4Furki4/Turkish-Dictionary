import { api } from "@/src/trpc/server";
import { redirect } from "next/navigation";
// if the first searched word is not found, this will reduce bundle size by not importing WordCard component.
export async function generateMetadata(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  const word = searchParams.word as string;
  if (word) {
    const parsedWord = decodeURIComponent(word); // parse the word to utf-8 format string
    const response = await api.word.getWord({ name: parsedWord, skipLogging: true });
    return {
      title: parsedWord,
      description: response[0]?.word_data.meanings.map((meaning) => meaning.meaning).join(", "),
    };
  }
}

export default async function Page(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams.word === undefined) return redirect("/"); // redirect to home page if no word param is provided
  const parsedWord = decodeURIComponent(searchParams.word as string);
  if (!parsedWord) {
    // redirect to home page if word param is empty
    redirect("/");
  } else {
    redirect(decodeURI(`/search/${parsedWord}`));
  }
}
