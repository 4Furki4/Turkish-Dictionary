import React from 'react';
import { Button } from "@heroui/react";
import { Card, CardBody } from "@heroui/card";
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Session } from 'next-auth';

// Assuming RelatedWordItemType is defined elsewhere and imported
// For now, let's define a placeholder type
export type RelatedWordItemType = {
  related_word_id: number;
  related_word_name: string;
  relation_type?: string; // Changed from string | null | undefined to string | undefined
};

interface RelatedWordsEditTabContentProps {
  relatedWords: RelatedWordItemType[];
  onSelectRelatedWord: (relatedWord: RelatedWordItemType) => void;
  onOpenEditModal: () => void;
  onOpenDeleteModal: () => void;
  session: Session | null;
}

const RelatedWordsEditTabContent: React.FC<RelatedWordsEditTabContentProps> = ({
  relatedWords,
  onSelectRelatedWord,
  onOpenEditModal,
  onOpenDeleteModal,
  session,
}) => {
  const t = useTranslations('Requests'); // Or a more general namespace if preferred
  const tWordCard = useTranslations('WordCard');

  if (!relatedWords || relatedWords.length === 0) {
    return <p>{tWordCard('NoRelatedWordsFound')}</p>;
  }

  return (
    <div className="space-y-2">
      {relatedWords.map((relatedWord) => (
        <Card key={relatedWord.related_word_id}>
          <CardBody className="flex flex-row justify-between items-center">
            <div>
              <a href={`/search/${relatedWord.related_word_name}`} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {relatedWord.related_word_name}
              </a>
              {relatedWord.relation_type && relatedWord.relation_type !== 'relatedWord' && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({tWordCard(relatedWord.relation_type as any) || relatedWord.relation_type})
                </span>
              )}
            </div>
            {session && (
              <div className="flex gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => {
                    onSelectRelatedWord(relatedWord);
                    onOpenEditModal();
                  }}
                  aria-label={t('SuggestEditForRelatedWord', { relatedWordName: relatedWord.related_word_name })}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => {
                    onSelectRelatedWord(relatedWord);
                    onOpenDeleteModal();
                  }}
                  aria-label={t('SuggestDeletionForRelatedWord', { relatedWordName: relatedWord.related_word_name })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default RelatedWordsEditTabContent;
