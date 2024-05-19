import { and, eq } from "drizzle-orm";
import { PgDatabase } from "drizzle-orm/pg-core";
import { Awaitable } from "next-auth";
import { Adapter, AdapterUser } from "next-auth/adapters";
import { AdapterAccount } from "next-auth/adapters";
import { Role, users } from "./schema/users";
import { accounts } from "./schema/accounts";
export function CustomDrizzleAdapter(
  client: InstanceType<typeof PgDatabase>
): Adapter {
  return {
    async createUser(user) {
      const { name, email, image, emailVerified, username, role } = user;
      return (await client
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name,
          email,
          image,
          emailVerified,
          role: role as Role | undefined,
          username: username || email.split("@")[0],
        })
        .returning()
        .then((res) => res[0] ?? null)) as Awaitable<AdapterUser>;
    },
    async getUser(data) {
      return (await client
        .select()
        .from(users)
        .where(eq(users.id, data))
        .then((res) => res[0] ?? null)) as AdapterUser;
    },
    async getUserByEmail(data) {
      return (await client
        .select()
        .from(users)
        .where(eq(users.email, data))
        .then((res) => res[0] ?? null)) as AdapterUser;
    },
    async updateUser(data) {
      if (!data.id) {
        throw new Error("No user id.");
      }
      return (await client
        .update(users)
        .set({
          ...data,
          role: data.role as Role | undefined,
        })
        .where(eq(users.id, data.id))
        .returning()
        .then((res) => res[0])) as AdapterUser;
    },
    async linkAccount(rawAccount) {
      const updatedAccount = await client
        .insert(accounts)
        .values(rawAccount)
        .returning()
        .then((res) => res[0]);

      // Drizzle will return `null` for fields that are not defined.
      // However, the return type is expecting `undefined`.
      const account = {
        ...updatedAccount,
        access_token: updatedAccount.access_token ?? undefined,
        token_type: updatedAccount.token_type ?? undefined,
        id_token: updatedAccount.id_token ?? undefined,
        refresh_token: updatedAccount.refresh_token ?? undefined,
        scope: updatedAccount.scope ?? undefined,
        expires_at: updatedAccount.expires_at ?? undefined,
        session_state: updatedAccount.session_state ?? undefined,
      };

      return account as AdapterAccount;
    },
    async unlinkAccount(account) {
      const { type, provider, providerAccountId, userId } = await client
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, account.providerAccountId),
            eq(accounts.provider, account.provider)
          )
        )
        .returning()
        .then((res) => res[0] ?? null);

      return { provider, type, providerAccountId, userId };
    },
    async getUserByAccount(account) {
      const dbAccount =
        (await client
          .select()
          .from(accounts)
          .where(
            and(
              eq(accounts.providerAccountId, account.providerAccountId),
              eq(accounts.provider, account.provider)
            )
          )
          .leftJoin(users, eq(accounts.userId, users.id))
          .then((res) => res[0])) ?? null;

      if (!dbAccount) {
        return null;
      }

      return dbAccount.users as AdapterUser;
    },
  };
}
