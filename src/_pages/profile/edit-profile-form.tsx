"use client";

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { api } from '@/src/trpc/react';
import type { User } from 'next-auth';

// 1. Zod Schema for validation
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  username: z.string().min(3, 'Username must be at least 3 characters long.').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

// 2. Component Props
interface EditProfileFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
}

// 3. EditProfileForm Component
export default function EditProfileForm({ isOpen, onOpenChange, user }: EditProfileFormProps) {
  const t = useTranslations('ProfilePage.editProfileModal');
  const utils = api.useUtils();

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      username: user.username || '',
    },
  });

  const updateProfileMutation = api.profile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t('updateSuccess'));
      // Invalidate profile data to refetch
      utils.user.getProfile.invalidate({ userId: user.id });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || t('updateError'));
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>{t('title')}</ModalHeader>
            <ModalBody>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('nameLabel')}
                    placeholder={t('namePlaceholder')}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name?.message}
                    className="mb-4"
                  />
                )}
              />
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label={t('usernameLabel')}
                    placeholder={t('usernamePlaceholder')}
                    isInvalid={!!errors.username}
                    errorMessage={errors.username?.message}
                  />
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                {t('cancel')}
              </Button>
              <Button color="primary" type="submit" isLoading={updateProfileMutation.isPending}>
                {t('saveChanges')}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
