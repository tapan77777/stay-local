/** Transaction policy shared by normal content editing and Excel operations. */
export interface Command {
  text: string;
  values: unknown[];
}
export const transactionSettings: Command = {
  text: "SELECT set_config('lock_timeout','5s',true), set_config('statement_timeout','30s',true), CASE WHEN current_setting('server_version_num')::int >= 170000 THEN set_config('transaction_timeout','120s',true) END",
  values: [],
};
const contentTables = new Set([
  "destinations",
  "itinerary_days",
  "places",
  "transports",
  "stays",
  "foods",
  "experiences",
  "map_pins",
  "destination_notes",
  "india_guide_items",
  "plan_documents",
]);
export function contentMutationCommands(
  table: string,
  scope: "plan" | "destination" | "record",
  id: string,
  text: string,
  values: unknown[],
): Command[] {
  if (!contentTables.has(table)) throw new Error("Unsupported content table.");
  const planLevel = [
    "destinations",
    "india_guide_items",
    "plan_documents",
  ].includes(table);
  const parent =
    scope === "plan"
      ? "$1::uuid"
      : scope === "destination"
        ? "(SELECT plan_id FROM destinations WHERE id=$1)"
        : planLevel
          ? `(SELECT plan_id FROM ${table} WHERE id=$1)`
          : `(SELECT d.plan_id FROM ${table} c JOIN destinations d ON d.id=c.destination_id WHERE c.id=$1)`;
  return [
    transactionSettings,
    {
      // A separate statement gives the following mutation a fresh READ COMMITTED
      // snapshot after waiting. Lock the plan BEFORE touching any child tuples.
      text: `SELECT id FROM plans WHERE id=${parent} ORDER BY id FOR NO KEY UPDATE`,
      values: [id],
    },
    { text, values },
  ];
}
export function retryableTransactionError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    ["40P01", "40001"].includes(String(error.code))
  );
}
export async function retryTransaction<T>(
  operation: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= 2 || !retryableTransactionError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
}
