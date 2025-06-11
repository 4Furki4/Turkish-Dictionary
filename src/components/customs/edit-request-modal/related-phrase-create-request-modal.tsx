import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea, Autocomplete, AutocompleteItem } from '@heroui/react';
import { useDebounce } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';
import { Session } from 'next-auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/src/trpc/react';
import { toast } from 'sonner';

interface SimpleWord {
  id: number;
  word: string;
}

interface RelatedPhraseCreateRequestModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  wordId: number;
  session: Session | null;
}

const createRelatedPhraseSchema = z.object({
  relatedPhraseId: z.number({ required_error: 'This field is required.' }), // Will replace with tForm('requiredField') later
  description: z.string().optional(),
  reason: z.string().optional(),
});

type CreateRelatedPhraseFormValues = z.infer<typeof createRelatedPhraseSchema>;

const RelatedPhraseCreateRequestModal: React.FC<RelatedPhraseCreateRequestModalProps> = ({
  isOpen,
  onOpenChange,
  wordId,
  session,
}) => {
  const t = useTranslations('Requests');
  const tActions = useTranslations('Actions');
  const tForm = useTranslations('Form');

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateRelatedPhraseFormValues>({
    resolver: zodResolver(createRelatedPhraseSchema),
    defaultValues: {
      // relatedPhraseId will be undefined by default, which is fine for a required field
      description: '',
      reason: '',
    },
  });

  const createRequestMutation = api.request.requestCreateRelatedPhrase.useMutation({
    onSuccess: () => {
      toast.success(t('RequestSubmittedSuccessfully'));
      reset();
      onOpenChange(false);
    },
    onError: (error: { message: string }) => {
      toast.error(t('RequestSubmissionFailed', { error: error.message }));
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: searchResults, isLoading: isLoadingSearch } = api.word.searchWordsSimple.useQuery(
    { query: debouncedSearchQuery, limit: 10 },
    { enabled: debouncedSearchQuery.length > 1 }
  );

  const wordOptions: SimpleWord[] = searchResults?.words.map((word: SimpleWord) => ({ id: word.id, word: word.word })) || [];

  const onSubmit = (data: CreateRelatedPhraseFormValues) => {
    createRequestMutation.mutate({
      wordId: wordId,
      phraseId: data.relatedPhraseId, // Correctly pass relatedPhraseId as phraseId
      description: data.description,
      reason: data.reason,
    });
  };

  if (!session) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside" backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>{t('CreateRelatedPhraseRequestTitle')}</ModalHeader>
            <ModalBody className="space-y-4">
              <Controller
                name="relatedPhraseId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    label={tForm('relatedPhraseWordLabel')} // Placeholder for new translation key
                    placeholder={tForm('relatedPhraseWordPlaceholder')} // Placeholder for new translation key
                    items={wordOptions} // wordOptions is already an array of SimpleWord {id, word}
                    selectedKey={field.value ? String(field.value) : null}
                    onSelectionChange={(key) => field.onChange(key ? Number(key) : null)}
                    onInputChange={setSearchQuery}
                    isLoading={isLoadingSearch}
                    isInvalid={!!errors.relatedPhraseId}
                    errorMessage={errors.relatedPhraseId?.message}
                    allowsCustomValue={false}
                    // emptyContent prop removed as it's likely not supported or needed; Autocomplete might handle this internally
                  >
                    {(item: SimpleWord) => (
                      <AutocompleteItem key={item.id} textValue={item.word}>
                        {item.word}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label={tForm('descriptionLabelOptional')}
                    placeholder={tForm('descriptionPlaceholder')}
                    isInvalid={!!errors.description}
                    errorMessage={errors.description?.message}
                    minRows={3}
                  />
                )}
              />
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label={tForm('reasonLabelOptional')}
                    placeholder={tForm('reasonPlaceholder')}
                    isInvalid={!!errors.reason}
                    errorMessage={errors.reason?.message}
                    minRows={3}
                  />
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {tActions('Cancel')}
              </Button>
              <Button type="submit" color="primary" isLoading={createRequestMutation.isPending}>
                {t('submitRequest')}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RelatedPhraseCreateRequestModal;
