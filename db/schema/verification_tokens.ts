import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const verificationTokens = pgTable(
    "verification_token",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
)