import React from 'react';
import { Button, useDisclosure } from "@heroui/react";
import { Card, CardBody } from "@heroui/card";
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Session } from 'next-auth';
import RelatedPhraseCreateRequestModal from './related-phrase-create-request-modal';

export type RelatedPhraseItemType = {
  related_phrase_id: number;
  related_phrase: string; // Changed from related_phrase_text
};

interface RelatedPhrasesEditTabContentProps {
  currentWordId: number;
  relatedPhrases: RelatedPhraseItemType[];
  session: Session | null;
  // Add props for opening phrase edit/delete modals when ready
  // onOpenPhraseEditModal: (phrase: RelatedPhraseItemType) => void;
  // onOpenPhraseDeleteModal: (phrase: RelatedPhraseItemType) => void;
}

const RelatedPhrasesEditTabContent: React.FC<RelatedPhrasesEditTabContentProps> = ({
  currentWordId,
  relatedPhrases,
  session,
}) => {
  const t = useTranslations('Requests');
  const tWordCard = useTranslations('WordCard');
  const tActions = useTranslations('Actions');
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange } = useDisclosure();

  if (!session) {
    return <p>{t('SignInToSuggestChanges')}</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onPress={onCreateOpen} color="primary" startContent={<Plus size={16} />}>
          {tActions('SuggestNewPhrase')}
        </Button>
      </div>

      <RelatedPhraseCreateRequestModal isOpen={isCreateOpen} onOpenChange={onCreateOpenChange} wordId={currentWordId} session={session} />

      {(!relatedPhrases || relatedPhrases.length === 0) ? (
        <div className="text-center text-gray-500">
          <p>{tWordCard('NoRelatedPhrasesFound')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* TODO: Add translation keys for aria-labels if not already present
           e.g., t('SuggestEditForRelatedPhrase', { phraseText: phrase.related_phrase_text })
           e.g., t('SuggestDeletionForRelatedPhrase', { phraseText: phrase.related_phrase_text }) */}
          {relatedPhrases.map((phrase) => (
            <Card key={phrase.related_phrase_id}>
              <CardBody className="flex flex-row justify-between items-center">
                <div>
                  {/* Phrases might not be directly linkable like words, adjust as needed */}
                  <span className="font-medium">{phrase.related_phrase}</span>
                </div>
                {session && (
                  <div className="flex gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => {
                        // Placeholder: Implement phrase edit functionality
                        console.log('Edit phrase:', phrase);
                        // onOpenPhraseEditModal(phrase); // Uncomment when modal is ready
                      }}
                      aria-label={`Edit related phrase: ${phrase.related_phrase}`} // Placeholder aria-label
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => {
                        // Placeholder: Implement phrase delete functionality
                        console.log('Delete phrase:', phrase);
                        // onOpenPhraseDeleteModal(phrase); // Uncomment when modal is ready
                      }}
                      aria-label={`Delete related phrase: ${phrase.related_phrase}`} // Placeholder aria-label
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedPhrasesEditTabContent;
