"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { QueryRow } from "@/lib/types";

const FILE_TYPE_ICONS: Record<string, string> = {
  image: "🖼",
  video: "🎬",
  audio: "🎵",
  text: "📄",
  application: "📦",
};

interface Filters {
  type?: string;
  ext?: string;
  tag?: string;
  favorite?: string;
  offline?: string;
}

interface Props {
  initialResults: QueryRow[];
  initialFilters: Filters;
  offset: number;
  pageSize: number;
  hasError: boolean;
}

export default function SearchInterface({
  initialResults,
  initialFilters,
  offset,
  pageSize,
  hasError,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<Filters>(initialFilters);

  function applyFilters(updated: Filters) {
    setFilters(updated);
    const params = new URLSearchParams();
    if (updated.type) params.set("type", updated.type);
    if (updated.ext) params.set("ext", updated.ext);
    if (updated.tag) params.set("tag", updated.tag);
    if (updated.favorite === "true") params.set("favorite", "true");
    if (updated.offline === "true") params.set("offline", "true");
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  function paginate(newOffset: number) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.ext) params.set("ext", filters.ext);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.favorite === "true") params.set("favorite", "true");
    if (filters.offline === "true") params.set("offline", "true");
    params.set("offset", String(newOffset));
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <Select
          value={filters.type ?? ""}
          onChange={(v) => applyFilters({ ...filters, type: v, offset: undefined } as Filters)}
          options={[
            { value: "", label: "All types" },
            { value: "image", label: "Images" },
            { value: "video", label: "Video" },
            { value: "audio", label: "Audio" },
            { value: "text", label: "Text" },
            { value: "application", label: "Application" },
          ]}
        />
        <TextFilter
          placeholder="Extension (e.g. cr2)"
          value={filters.ext ?? ""}
          onChange={(v) => applyFilters({ ...filters, ext: v })}
        />
        <TextFilter
          placeholder="Tag"
          value={filters.tag ?? ""}
          onChange={(v) => applyFilters({ ...filters, tag: v })}
        />
        <Checkbox
          label="Favorites"
          checked={filters.favorite === "true"}
          onChange={(v) => applyFilters({ ...filters, favorite: v ? "true" : "" })}
        />
        <Checkbox
          label="Offline only"
          checked={filters.offline === "true"}
          onChange={(v) => applyFilters({ ...filters, offline: v ? "true" : "" })}
        />
      </div>

      {hasError && (
        <p className="text-red-400 text-sm mb-4">Error loading results.</p>
      )}

      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        {/* Results grid */}
        {initialResults.length === 0 && !hasError && (
          <p className="text-slate-400 text-sm">No results.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {initialResults.map((row) => (
            <ResultCard key={row.hash} row={row} />
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

function ResultCard({ row }: { row: QueryRow }) {
  const icon = row.file_type ? (FILE_TYPE_ICONS[row.file_type] ?? "📄") : "📄";
  const tags = row.tags ? row.tags.split(",").filter(Boolean) : [];

  return (
    <Link
      href={`/content/${row.hash}`}
      className="block border border-slate-800 rounded-lg overflow-hidden hover:border-slate-600 transition-colors group"
    >
      {row.has_thumb ? (
        <img
          src={`/api/v1/thumb/${row.hash}`}
          alt=""
          className="w-full aspect-square object-cover bg-slate-800"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-square bg-slate-900 flex items-center justify-center text-4xl">
          {icon}
        </div>
      )}
      <div className="p-2">
        <p className="text-xs text-slate-300 truncate">{row.sample_path?.split("/").pop()}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-500">{formatBytes(row.size ?? 0)}</span>
          {!row.online && (
            <span className="text-xs text-slate-600">offline</span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="text-xs bg-slate-800 text-slate-400 px-1 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-slate-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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
      className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 w-36"
    />
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-slate-400 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-slate-400"
      />
      {label}
    </label>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
