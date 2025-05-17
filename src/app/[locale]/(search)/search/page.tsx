import { redirect } from "next/navigation";


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
