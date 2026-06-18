import { hashit } from "@/lib/hashit";
import { redirect } from "next/navigation";
import FileBrowser from "@/components/FileBrowser";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ drive?: string; path?: string }>;
}

export default async function BrowsePage({ searchParams }: Props) {
  const { drive, path } = await searchParams;

  if (!drive) redirect("/drives");

  const [lsResult, drivesResult] = await Promise.all([
    hashit.GET("/v1/ls", { params: { query: { drive, path: path ?? "" } } }),
    hashit.GET("/v1/drives"),
  ]);

  const driveInfo = drivesResult.data?.find((d) => d.drive_id === drive);
  const entries = lsResult.data ?? [];

  if (lsResult.error) {
    return (
      <div className="border border-red-900 rounded p-4 text-red-400 text-sm">
        Error loading directory.
      </div>
    );
  }

  return (
    <FileBrowser
      driveId={drive}
      driveLabel={driveInfo?.label ?? drive}
      currentPath={path ?? ""}
      entries={entries}
    />
  );
}
