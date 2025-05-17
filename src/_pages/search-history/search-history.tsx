'use client';

import { useTranslations } from 'next-intl';
import { api } from '@/src/trpc/react';
import { Card, CardBody, CardHeader, Alert, Button } from '@heroui/react';
import { Skeleton } from '@heroui/skeleton';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface SearchHistoryProps {
  userId: string;
}

export default function SearchHistory({ userId }: SearchHistoryProps) {
  const t = useTranslations('SearchHistory');
  const navT = useTranslations('Navbar');

  const { data: searchHistory, isLoading, error, refetch, isRefetching } = api.user.getUserSearchHistory.useQuery(
    { limit: 50 },
    {
      enabled: !!userId,
      refetchOnWindowFocus: false
    }
  );

  const handleRefresh = () => {
    void refetch();
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'PPpp');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">{navT('SearchHistory')}</h1>
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('loading')}</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-6 w-1/3 rounded-md" />
                  <Skeleton className="h-4 w-1/4 rounded-md" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">{navT('SearchHistory')}</h1>
        <Alert color="danger">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{t('error')}</p>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Empty history state
  if (!searchHistory || searchHistory.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">{navT('SearchHistory')}</h1>
        <Card className="w-full">
          <CardHeader>
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            <p className="text-muted-foreground">{t('emptyHistory')}</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render search history
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{navT('SearchHistory')}</h1>
          <p className="text-muted-foreground mt-1">
            {searchHistory.length} {searchHistory.length === 1 ? t('item') : t('items')}
          </p>
        </div>
        <Button
          onPress={handleRefresh}
          isIconOnly
          variant="flat"
          isLoading={isRefetching}
          disabled={isLoading || isRefetching}
          aria-label={t('refresh')}
        >
          <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
        </CardHeader>
        <CardBody>
          <div className="divide-y">
            {searchHistory.map((item, index) => (
              <div
                key={`${item.wordId}-${index}`}
                className="py-3 first:pt-0 last:pb-0 last:border-b-0"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <Link
                    href={`/search/${encodeURIComponent(item.wordName)}`}
                    className="text-primary hover:underline font-medium text-base"
                  >
                    {String(item.wordName)}
                  </Link>
                  <div className="text-sm text-muted-foreground flex items-center mt-1 sm:mt-0">
                    <Clock className="h-4 w-4 mr-1.5 inline" />
                    <span>{t('searchedOn')}: {formatDate(item.searchedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
