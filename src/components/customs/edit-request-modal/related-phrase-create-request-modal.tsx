import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { Session } from 'next-auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/src/trpc/react';
import { toast } from 'sonner';

interface RelatedPhraseCreateRequestModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  wordId: number;
  session: Session | null;
}

const createRelatedPhraseSchema = z.object({
  phrase: z.string().min(3, 'Phrase must be at least 3 characters long.'),
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
      phrase: '',
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

  const onSubmit = (data: CreateRelatedPhraseFormValues) => {
    createRequestMutation.mutate({
      ...data,
      wordId: wordId,
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
                name="phrase"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    label={tForm('phraseLabel')}
                    placeholder={tForm('phrasePlaceholder')}
                    isInvalid={!!errors.phrase}
                    errorMessage={errors.phrase?.message}
                    minRows={2}
                  />
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
