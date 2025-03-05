// src/server/api/handlers/request-handlers/types.ts
import { PgTransaction } from "drizzle-orm/pg-core";
import { SelectRequest } from "@/db/schema/requests"; // adjust the import path
import { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";


// Use a more generic type that can accept any transaction type
export interface RequestHandlerContext {
    tx: PgTransaction<PostgresJsQueryResultHKT, any, any>;
    request: SelectRequest;
}

export interface RequestHandler<T> {
    handle(context: RequestHandlerContext): Promise<T>;
}