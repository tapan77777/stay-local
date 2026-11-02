import "server-only";
import { sql } from "../db";
import { transactionSettings, retryTransaction } from "../transactions";
import type { Database } from "./store";
export const database: Database = {
  async query(text, values = []) {
    return sql().query(text, values);
  },
  async transaction(statements) {
    const client = sql();
    return retryTransaction(() =>
      client.transaction(
        [transactionSettings, ...statements].map((s) =>
          client.query(s.text, s.values),
        ),
      ),
    );
  },
};
