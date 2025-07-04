import { redirect } from "next/navigation";
import SearchPageClient from "./_pages/search-page-client";

export default async function Page(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }
) {
  const searchParams = await props.searchParams;
  
  // Handle query parameter based search (normal online flow)
  if (searchParams.word !== undefined) {
    const parsedWord = decodeURIComponent(searchParams.word as string);
    if (!parsedWord) {
      // redirect to home page if word param is empty
      redirect("/");
    } else {
      redirect(decodeURI(`/search/${parsedWord}`));
    }
  }
  
  // If no query parameter, render the client component that can handle offline routing
  // This handles the case where service worker serves this page for dynamic routes like /en/search/word
  return <SearchPageClient />;
}
