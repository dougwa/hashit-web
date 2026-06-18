"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DirEntry } from "@/lib/types";

const FILE_TYPE_COLORS: Record<string, string> = {
  image: "text-blue-400",
  video: "text-purple-400",
  audio: "text-green-400",
  text: "text-yellow-400",
  application: "text-orange-400",
};

const FILE_TYPE_ICONS: Record<string, string> = {
  image: "🖼",
  video: "🎬",
  audio: "🎵",
  text: "📄",
  application: "📦",
};

interface Props {
  driveId: string;
  driveLabel: string;
  currentPath: string;
  entries: DirEntry[];
}

export default function FileBrowser({ driveId, driveLabel, currentPath, entries }: Props) {
  const router = useRouter();

  const segments = currentPath ? currentPath.split("/") : [];
  const dirs = entries.filter((e) => e.kind === "dir");
  const files = entries.filter((e) => e.kind === "file");

  function navigateTo(path: string) {
    const params = new URLSearchParams({ drive: driveId });
    if (path) params.set("path", path);
    router.push(`/browse?${params}`);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-slate-400 mb-6 flex-wrap">
        <Link href="/drives" className="hover:text-slate-200 transition-colors">
          Drives
        </Link>
        <Chevron />
        <button
          onClick={() => navigateTo("")}
          className="hover:text-slate-200 transition-colors"
        >
          {driveLabel}
        </button>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <Chevron />
            <button
              onClick={() => navigateTo(segments.slice(0, i + 1).join("/"))}
              className={
                i === segments.length - 1
                  ? "text-slate-100"
                  : "hover:text-slate-200 transition-colors"
              }
            >
              {seg}
            </button>
          </span>
        ))}
      </nav>

      {entries.length === 0 && (
        <p className="text-slate-500 text-sm">Empty directory.</p>
      )}

      {/* Directories */}
      {dirs.length > 0 && (
        <section className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {dirs.map((entry) => (
              <button
                key={entry.name}
                onClick={() =>
                  navigateTo(currentPath ? `${currentPath}/${entry.name}` : entry.name)
                }
                className="text-left border border-slate-800 rounded-lg p-3 hover:border-slate-600 hover:bg-slate-900/40 transition-colors group"
              >
                <div className="text-2xl mb-1">📁</div>
                <div className="text-sm text-slate-200 truncate group-hover:text-white">
                  {entry.name}
                </div>
                {entry.file_count != null && (
                  <div className="text-xs text-slate-500">{entry.file_count} files</div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Files */}
      {files.length > 0 && (
        <section>
          <div className="divide-y divide-slate-800/60">
            {files.map((entry) => (
              <FileRow key={entry.name} entry={entry} driveId={driveId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FileRow({ entry, driveId }: { entry: DirEntry; driveId: string }) {
  const icon = entry.file_type ? (FILE_TYPE_ICONS[entry.file_type] ?? "📄") : "📄";
  const color = entry.file_type ? (FILE_TYPE_COLORS[entry.file_type] ?? "text-slate-400") : "text-slate-400";

  return (
    <Link
      href={entry.hash ? `/content/${entry.hash}` : "#"}
      className="flex items-center gap-3 py-2 px-1 hover:bg-slate-900/40 rounded transition-colors group"
    >
      {entry.has_thumb && entry.hash ? (
        <img
          src={`/api/v1/thumb/${entry.hash}`}
          alt=""
          className="w-10 h-10 object-cover rounded shrink-0 bg-slate-800"
          loading="lazy"
        />
      ) : (
        <span className="w-10 h-10 flex items-center justify-center text-xl shrink-0">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200 group-hover:text-white truncate">{entry.name}</div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          {entry.file_type && (
            <span className={color}>{entry.ext ?? entry.file_type}</span>
          )}
          {entry.size != null && <span>{formatBytes(entry.size)}</span>}
        </div>
      </div>
      <span className="text-xs text-slate-600 font-mono truncate max-w-[120px] hidden sm:block">
        {entry.hash?.slice(0, 12)}
      </span>
    </Link>
  );
}

function Chevron() {
  return <span className="text-slate-700">/</span>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
