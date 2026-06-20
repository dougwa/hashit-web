import { queryFiles } from "@/lib/grpc/search";
import { getMeta } from "@/lib/grpc/fileops";
import { notFound } from "next/navigation";
import ContentDetail from "@/components/ContentDetail";
import type { FileResult } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ hash: string }>;
}

export default async function ContentPage({ params }: Props) {
  const { hash } = await params;

  // Resolve all file paths recorded for this hash.
  let files: FileResult[] = [];
  try {
    const result = await queryFiles({ hash, limit: 500, offset: 0 });
    files = result.files ?? [];
  } catch {
    // hashit-idx unreachable
    return (
      <p className="text-red-400 text-sm">
        Could not reach hashit-idx — is it running on {process.env.HASHIT_SEARCH_ADDR ?? "127.0.0.1:50551"}?
      </p>
    );
  }

  if (!files.length) notFound();

  const paths = files.map((f) => f.path);

  // Fetch per-path metadata (tags, properties, thumbnail) via FileOps.
  // Fall back to search data if FileOps isn't running.
  try {
    const { entries } = await getMeta(paths);
    if (entries?.length) {
      return <ContentDetail hash={hash} entries={entries} />;
    }
  } catch {
    // FileOps service unavailable — render with search data only.
  }

  const fallbackEntries = files.map((f) => ({
    path: f.path,
    error: "",
    hash: f.hash,
    algo: f.algo,
    size: f.size,
    file_type: f.file_type,
    ext: f.ext,
    tags: {} as Record<string, string>,
    properties: {} as Record<string, string>,
    thumbnail: "",
    preview: "",
  }));
  return <ContentDetail hash={hash} entries={fallbackEntries} fileOpsDown />;
}
