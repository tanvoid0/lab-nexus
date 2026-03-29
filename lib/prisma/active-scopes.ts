/**
 * Active rows only. MongoDB distinguishes missing fields from explicit `null`; Prisma `equals: null`
 * alone does not match omitted `deletedAt`, which breaks soft-delete queries after creates that omit
 * the field.
 *
 * Cast to `any` so this fragment can be spread into any model `*WhereInput` and into `groupBy({ where })`.
 * Prisma types each model's `deletedAt` filter with a different `$PrismaModel` parameter (`FieldRef<…>`),
 * so a single shared object cannot satisfy every `*WhereInput` while staying strictly typed.
 */
export const notDeleted = {
  OR: [{ deletedAt: { isSet: false } }, { deletedAt: { equals: null } }],
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma ties DateTimeNullableFilter to each model; see module comment
