import { useMemo, useState } from 'react';

interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  pageItems: T[];
  pageSize: number;
  setPageSize: (size: number) => void;
  total: number;
}

/**
 * Client-side pagination over an already-fetched list. Appropriate at the
 * scale a single-location salon actually operates at (hundreds, maybe
 * low thousands of records) — the backend list endpoints already cap
 * generously (see appointmentController/clientController/etc.), so this
 * just windows what's already in memory rather than re-fetching per page.
 *
 * If the business outgrows this, the natural next step is real
 * server-side skip/take windowing with a `total` count in the API
 * response — the backend endpoints already accept ?skip=&take=, so that
 * upgrade wouldn't need new backend work, just swapping what feeds
 * `pageItems` here for a network call.
 */
export function usePagination<T>(items: T[], initialPageSize = 10): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Land back on a valid page if the list shrank (search/filter narrowed
  // it, an item was deleted, etc.) — otherwise you can end up "stuck" on
  // page 4 of an empty result set. Clamped directly here (derived from
  // existing state during render) rather than synced back via a
  // setState-in-effect, which would trigger an extra cascading render.
  const clampedPage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clampedPage, pageSize]);

  return {
    page: clampedPage,
    setPage,
    pageCount,
    pageItems,
    pageSize,
    setPageSize: (size: number) => { setPageSize(size); setPage(1); },
    total,
  };
}
