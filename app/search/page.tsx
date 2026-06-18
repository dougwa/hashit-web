import { hashit } from "@/lib/hashit";
import SearchInterface from "@/components/SearchInterface";

export const dynamic = "force-dynamic";
import type { QueryRow } from "@/lib/types";

interface Props {
  searchParams: Promise<{
    type?: string;
    ext?: string;
    tag?: string;
    favorite?: string;
    offline?: string;
    limit?: string;
    offset?: string;
  }>;
}

const PAGE_SIZE = 100;

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const offset = Number(sp.offset ?? 0);

  const { data: results, error } = await hashit.GET("/v1/query", {
    params: {
      query: {
        type: sp.type || undefined,
        ext: sp.ext || undefined,
        tag: sp.tag || undefined,
        favorite: sp.favorite === "true" ? true : undefined,
        offline: sp.offline === "true" ? true : undefined,
        limit: PAGE_SIZE,
        offset,
      },
    },
  });

  return (
    <SearchInterface
      initialResults={results ?? []}
      initialFilters={sp}
      offset={offset}
      pageSize={PAGE_SIZE}
      hasError={!!error}
    />
  );
}
