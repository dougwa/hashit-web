"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { FileResult } from "@/lib/types";

const FILE_TYPE_ICONS: Record<string, string> = {
  image: "🖼",
  video: "🎬",
  audio: "🎵",
  text: "📄",
  application: "📦",
};

interface Filters {
  name?: string;
  hash?: string;
  tag_key?: string;
  tag_value?: string;
}

interface Props {
  initialResults: FileResult[];
  initialFilters: Filters;
  offset: number;
  pageSize: number;
  total: number;
  hasError: boolean;
  thumbnails?: Record<string, string>;
}

export default function SearchInterface({
  initialResults,
  initialFilters,
  offset,
  pageSize,
  total,
  hasError,
  thumbnails = {},
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function applyFilters(updated: Filters) {
    setFilters(updated);
    const params = new URLSearchParams();
    if (updated.name) params.set("name", updated.name);
    if (updated.hash) params.set("hash", updated.hash);
    if (updated.tag_key) params.set("tag_key", updated.tag_key);
    if (updated.tag_value) params.set("tag_value", updated.tag_value);
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  function paginate(newOffset: number) {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.hash) params.set("hash", filters.hash);
    if (filters.tag_key) params.set("tag_key", filters.tag_key);
    if (filters.tag_value) params.set("tag_value", filters.tag_value);
    params.set("offset", String(newOffset));
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <TextFilter
          placeholder="Name search"
          value={filters.name ?? ""}
          onChange={(v) => applyFilters({ ...filters, name: v })}
        />
        <TextFilter
          placeholder="Hash prefix"
          value={filters.hash ?? ""}
          onChange={(v) => applyFilters({ ...filters, hash: v })}
        />
        <TextFilter
          placeholder="Property key"
          value={filters.tag_key ?? ""}
          onChange={(v) => applyFilters({ ...filters, tag_key: v })}
        />
        <TextFilter
          placeholder="Property value (optional)"
          value={filters.tag_value ?? ""}
          onChange={(v) => applyFilters({ ...filters, tag_value: v })}
        />
      </div>

      {hasError && (
        <p className="text-red-400 text-sm mb-4">
          Could not reach hashit-idx — is it running?
        </p>
      )}

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        {initialResults.length === 0 && !hasError && (
          <p className="text-slate-400 text-sm">No results.</p>
        )}

        <div className="divide-y divide-slate-800/60">
          {initialResults.map((file) => (
            <ResultRow key={file.path} file={file} thumbnail={thumbnails[file.path]} />
          ))}
        </div>

        {/* Pagination */}
        {(offset > 0 || initialResults.length === pageSize) && (
          <div className="flex items-center gap-3 mt-6 text-sm">
            <button
              onClick={() => paginate(Math.max(0, offset - pageSize))}
              disabled={offset === 0}
              className="px-3 py-1 border border-slate-700 rounded hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-slate-500">
              {offset + 1}–{offset + initialResults.length}
              {total > 0 && ` of ${total.toLocaleString()}`}
            </span>
            <button
              onClick={() => paginate(offset + pageSize)}
              disabled={initialResults.length < pageSize}
              className="px-3 py-1 border border-slate-700 rounded hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({ file, thumbnail }: { file: FileResult; thumbnail?: string }) {
  const icon = file.file_type ? (FILE_TYPE_ICONS[file.file_type] ?? "📄") : "📄";
  const date = file.mtime ? new Date(file.mtime).toLocaleDateString() : null;

  return (
    <Link
      href={`/content/${encodeURIComponent(file.hash)}`}
      className="flex items-center gap-3 py-2 px-1 hover:bg-slate-900/40 rounded transition-colors group"
    >
      <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden rounded">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/file?path=${encodeURIComponent(thumbnail)}`}
            alt=""
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <span className="text-lg">{icon}</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 group-hover:text-white truncate">{file.name}</p>
        <p className="text-xs text-slate-500 truncate">{file.path}</p>
      </div>
      <div className="shrink-0 text-right space-y-0.5">
        <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
        {date && <p className="text-xs text-slate-600">{date}</p>}
      </div>
      <span className="text-xs text-slate-700 font-mono hidden sm:block w-24 shrink-0 truncate">
        {file.hash.slice(0, 10)}
      </span>
    </Link>
  );
}

function TextFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 w-40"
    />
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
