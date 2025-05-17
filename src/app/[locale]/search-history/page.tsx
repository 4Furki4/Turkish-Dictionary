import { auth } from '@/src/server/auth/auth';
import { redirect } from 'next/navigation';
import SearchHistory from '@/src/_pages/search-history/search-history';

export default async function SearchHistoryPage() {
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect('/signin');
  }

  return <SearchHistory userId={session.user.id} />;
}
