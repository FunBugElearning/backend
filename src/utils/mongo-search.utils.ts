// Prisma's MongoDB connector doesn't support `mode: 'insensitive'` (that's a
// Postgres/MySQL-only filter option), so case-insensitive matching goes
// through a raw `find` command instead. Only used for filters that don't
// need to join across collections - MongoDB's `$runCommandRaw` operates on
// a single collection, with no equivalent to Prisma's typed relation
// `include`/`where`.
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface RawFindResult {
  cursor?: {
    firstBatch?: unknown[];
  };
}

export function firstBatchOf<T>(rawResult: unknown): T[] {
  const result = rawResult as RawFindResult;
  return (result.cursor?.firstBatch ?? []) as T[];
}
