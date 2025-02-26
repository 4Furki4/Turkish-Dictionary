import UserList from '@/src/_pages/dashboard/user-list/user-list'
import { api } from '@/src/trpc/server'
import React from 'react'

export default async function UserListPage() {
    const usersListPromise = api.user.getUsers({ take: 10, skip: 0 })
    const userCountPromise = api.user.getUserCount()

    const results = await Promise.allSettled([usersListPromise, userCountPromise])
    const users = results[0].status === "fulfilled" ? results[0].value : []
    const userCount = results[1].status === "fulfilled" ? results[1].value : undefined
    return (
        <UserList users={users} userCount={userCount} />
    )
}
