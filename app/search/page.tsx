import { queryFiles } from "@/lib/grpc/search";
import { getMeta } from "@/lib/grpc/fileops";
import SearchInterface from "@/components/SearchInterface";
import type { FileResult } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    name?: string;
    hash?: string;
    tag_key?: string;
    tag_value?: string;
    offset?: string;
  }>;
}

const PAGE_SIZE = 50;

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const offset = Number(sp.offset ?? 0);

  let results: FileResult[] = [];
  let total = 0;
  let hasError = false;
  let thumbnails: Record<string, string> = {};

  try {
    const resp = await queryFiles({
      name: sp.name || undefined,
      hash: sp.hash || undefined,
      tags: sp.tag_key ? [{ key: sp.tag_key, value: sp.tag_value ?? "" }] : [],
      limit: PAGE_SIZE,
      offset,
    });
    results = resp.files ?? [];
    total = resp.total ?? 0;
  } catch {
    hasError = true;
  }

  if (results.length) {
    try {
      const { entries } = await getMeta(results.map((f) => f.path));
      for (const e of entries ?? []) {
        if (e.thumbnail) thumbnails[e.path] = e.thumbnail;
      }
    } catch {
      // FileOps unavailable — list renders without thumbnails
    }
  }

  return (
    <SearchInterface
      initialResults={results}
      initialFilters={sp}
      offset={offset}
      pageSize={PAGE_SIZE}
      total={total}
      hasError={hasError}
      thumbnails={thumbnails}
    />
  );
}
