/**
 * Shared App Router page prop shapes. Dynamic route APIs are Promises in this Next.js version;
 * use these helpers so param bags stay consistent across pages.
 */
export type NextPageProps<
  TParams extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
> = {
  params: Promise<TParams>;
};
