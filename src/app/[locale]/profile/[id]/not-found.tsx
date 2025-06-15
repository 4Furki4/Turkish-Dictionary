import React from 'react'
import { Card, CardBody } from '@heroui/react'
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
    const t = await getTranslations('ProfilePage');
    return (
        <Card className='w-full bg-transparent'>
            <CardBody className='flex items-center justify-center'>
                <h1 className='text-fs-2'>{t('notFound')}</h1>
            </CardBody>
        </Card>
    )
}
