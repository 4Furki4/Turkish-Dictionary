import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";
import { db } from "@/db";
import { accounts } from "@/db/schema/accounts";
import { sessions } from "@/db/schema/session";
import { users } from "@/db/schema/users";
import { verificationTokens } from "@/db/schema/verification_tokens";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }) as any,
    ...authConfig,
});

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
