import { browse, scopedQuery } from "@/lib/browse";
import { queryFiles } from "@/lib/grpc/search";
import { getMeta } from "@/lib/grpc/fileops";
import Explorer from "@/components/Explorer";
import type { BrowseFile, FileResult, Scope } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
// Cap on how many indexed files in the current directory we enrich with
// metadata for the browse listing; files beyond it render without a thumbnail.
const ENRICH_LIMIT = 1000;

interface Props {
  searchParams: Promise<{
    path?: string;
    q?: string;
    scope?: string;
    offset?: string;
  }>;
}

function parseScope(s: string | undefined): Scope {
  return s === "dir" || s === "global" ? s : "subtree";
}

// Resolve the thumbnail path for each indexed file via FileOps (best-effort).
async function thumbnailsFor(paths: string[]): Promise<Record<string, string>> {
  const thumbnails: Record<string, string> = {};
  if (!paths.length) return thumbnails;
  try {
    const { entries } = await getMeta(paths);
    for (const e of entries ?? []) {
      if (e.thumbnail) thumbnails[e.path] = e.thumbnail;
    }
  } catch {
    // FileOps unavailable — listing renders without thumbnails.
  }
  return thumbnails;
}

export default async function ExplorePage({ searchParams }: Props) {
  const sp = await searchParams;
  const dir = sp.path && sp.path.startsWith("/") ? sp.path : "/";
  const query = sp.q?.trim() ?? "";
  const scope = parseScope(sp.scope);
  const offset = Number(sp.offset ?? 0);

  // SEARCH MODE — index only, scoped to the current directory via the dir field.
  if (query) {
    let results: FileResult[] = [];
    let total = 0;
    let searchError = false;
    try {
      const resp = await queryFiles({
        query: scopedQuery(query, dir, scope),
        limit: PAGE_SIZE,
        offset,
      });
      results = resp.files ?? [];
      total = resp.total ?? 0;
    } catch {
      searchError = true;
    }
    const thumbnails = await thumbnailsFor(results.map((f) => f.path));

    return (
      <Explorer
        mode="search"
        dir={dir}
        parent={dir === "/" ? null : dir.replace(/\/[^/]*$/, "") || "/"}
        query={query}
        scope={scope}
        dirs={[]}
        files={[]}
        results={results}
        thumbnails={thumbnails}
        total={total}
        offset={offset}
        pageSize={PAGE_SIZE}
        searchError={searchError}
      />
    );
  }

  // BROWSE MODE — the real filesystem, enriched with index metadata.
  const listing = await browse(dir);

  let indexed: FileResult[] = [];
  let thumbnails: Record<string, string> = {};
  if (!listing.error && listing.fileNames.length) {
    try {
      const resp = await queryFiles({
        query: scopedQuery("", listing.path, "dir"),
        limit: ENRICH_LIMIT,
        offset: 0,
      });
      indexed = resp.files ?? [];
    } catch {
      // hashit-idx unavailable — files render without index metadata.
    }
    thumbnails = await thumbnailsFor(indexed.map((f) => f.path));
  }

  const byName = new Map(indexed.map((f) => [f.name, f]));
  const files: BrowseFile[] = listing.fileNames.map((name) => {
    const f = byName.get(name);
    if (!f) return { name };
    return {
      name,
      hash: f.hash,
      size: f.size,
      mtime: f.mtime,
      fileType: f.file_type,
      thumbnail: thumbnails[f.path],
    };
  });

  return (
    <Explorer
      mode="browse"
      dir={listing.path}
      parent={listing.parent}
      query=""
      scope={scope}
      dirs={listing.dirs}
      files={files}
      results={[]}
      thumbnails={{}}
      total={0}
      offset={0}
      pageSize={PAGE_SIZE}
      searchError={false}
      browseError={listing.error}
    />
  );
}
