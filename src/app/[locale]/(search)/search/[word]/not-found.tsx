import { getTranslations } from 'next-intl/server'
import React from 'react'

export default async function notFound() {
    const t = await getTranslations('SearchResults')
    return (
        <div className='text-center'>
            <h1 className='text-fs-2'>
                {t('NoResults')}
            </h1>
        </div>
    )
}
