import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import Google from "next-auth/providers/google"
import type { Provider } from "next-auth/providers"

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
type Role = "user" | "admin" | "moderator";
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role: Role;
            username: string;
        } & DefaultSession["user"];
    }
    interface User {
        id?: string;
        role: Role;
        username: string;
    }
}
declare module "next-auth/adapters" {
    export interface AdapterUser {
        role: Role;
    }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
    providers: [
        Google,
        DiscordProvider,
    ],
    callbacks: {
        session: ({ session, token }) => {
            console.log("session", session)
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    //todo: add role to the session
                },
            }
        },
        authorized: async ({ auth }) => {
            console.log("auth", auth)
            // Logged in users are authenticated, otherwise redirect to login page
            return !!auth
        },

    },
    pages: {
        signIn: "/signin",
    }
} satisfies NextAuthConfig;
