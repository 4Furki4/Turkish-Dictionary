import { auth } from '@/src/server/auth/auth';
import { getCsrfToken } from 'next-auth/react';
import React from 'react'

export default async function page() {
    // After successful sign in, redirect to this page
    // TODO: Show a form to complete the profile
    return (
        <div>
            <h1>Complete Profile</h1>
        </div>
    )
}
