import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import * as memorizationSchema from "./memorization-schema";
import * as syncSchema from "./sync-schema";
import * as kidsSchema from "./kids-schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, {
  schema: { ...schema, ...memorizationSchema, ...syncSchema, ...kidsSchema },
});
