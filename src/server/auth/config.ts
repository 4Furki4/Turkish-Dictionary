import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import Google from "next-auth/providers/google"
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
        DiscordProvider,
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile) {
                return {
                    id: profile.sub,
                    role: profile.role ?? "user",
                    image: profile.picture,
                    email: profile.email,
                    name: profile.name,
                    username: profile.email!.split("@")[0],
                };
            },
        }),

        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
    ],
    callbacks: {
        session: ({ session, user }) => ({
            ...session,
            user: {
                ...session.user,
                id: user.id,
            },
        }),
        authorized: async ({ auth }) => {

            // Logged in users are authenticated, otherwise redirect to login page
            return !!auth
        },

    },
    pages: {
        signIn: "/signin",
    }
} satisfies NextAuthConfig;
