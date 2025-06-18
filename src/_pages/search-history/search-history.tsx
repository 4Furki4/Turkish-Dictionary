'use client';

import { useTranslations } from 'next-intl';
import { api } from '@/src/trpc/react';
import { Card, CardBody, CardHeader, Alert, Button, ButtonGroup } from '@heroui/react';
import { Clock, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from '@/src/i18n/routing';
import { useSnapshot } from 'valtio';
import { preferencesState } from '@/src/store/preferences';
import { useDisclosure } from '@heroui/react'
import ClearSearchHistory from '@/src/components/customs/modals/clear-search-history';
interface SearchHistoryProps {
  userId: string;
}

export default function SearchHistory({ userId }: SearchHistoryProps) {
  const t = useTranslations('SearchHistory');
  const navT = useTranslations('Navbar');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { isBlurEnabled } = useSnapshot(preferencesState);

  const [searchHistory, { error, refetch, isRefetching, isSuccess }] = api.user.getUserSearchHistory.useSuspenseQuery(
    { limit: 50 },
    {
      refetchOnWindowFocus: true,
    }
  );
  const { mutateAsync: clearUserSearchHistory } = api.user.clearUserSearchHistory.useMutation();

  const handleRefresh = () => {
    void refetch();
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'PPpp');
  };
  const clearHistory = async () => {
    await clearUserSearchHistory();
    await refetch();
    onClose()
  };

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold">{navT('SearchHistory')}</h1>
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
  if (isSuccess && (!searchHistory || searchHistory.length === 0)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card isBlurred={isBlurEnabled} className="border border-border rounded-sm p-2 w-full" classNames={{
          base: "bg-background/10",
        }}>
          <CardHeader>
            <h1 className="text-3xl font-bold">{navT('SearchHistory')}</h1>
            <Button
              onPress={handleRefresh}
              variant="flat"
              isLoading={isRefetching}
              disabled={isRefetching}
              aria-label={t('refresh')}
              className='ml-auto'
              isIconOnly
            >
              <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardBody>
            <p className="text-muted-foreground">{t('emptyHistory')}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Render search history
  return (
    <div className="container mx-auto py-8 px-4">
      <Card isBlurred={isBlurEnabled} className="border border-border rounded-sm p-2 w-full" classNames={{
        base: "bg-background/10",
      }}>
        <CardHeader>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{navT('SearchHistory')}</h1>
              <p className="text-muted-foreground mt-1">
                {searchHistory?.length} {searchHistory?.length === 1 ? t('item') : t('items')}
              </p>
            </div>
          </div>
          <ButtonGroup className='ml-auto gap-2'>
            <Button
              onPress={onOpen}
              variant="flat"
              color="danger"
              aria-label={t('clearHistory')}
              isDisabled={isRefetching}
              isIconOnly
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              onPress={handleRefresh}
              variant="flat"
              isLoading={isRefetching}
              disabled={isRefetching}
              aria-label={t('refresh')}
              isIconOnly
            >
              <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </ButtonGroup>
        </CardHeader>
        <CardBody>
          <div className="divide-y">
            {searchHistory?.map((item, index) => (
              <div
                key={`${item.wordId}-${index}`}
                className="py-3 first:pt-0 last:pb-0 last:border-b-0"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <Link
                    href={{
                      pathname: '/search/[word]',
                      params: {
                        word: item.wordName
                      }
                    }}
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
      <ClearSearchHistory isOpen={isOpen} onClose={onClose} onClear={clearHistory} />
    </div>
  );
}
