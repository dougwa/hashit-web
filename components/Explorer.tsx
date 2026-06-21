"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BrowseFile, DirEntry, FileResult, Scope } from "@/lib/types";

const FILE_TYPE_ICONS: Record<string, string> = {
  image: "🖼",
  video: "🎬",
  audio: "🎵",
  text: "📄",
  application: "📦",
};

const SCOPE_LABELS: Record<Scope, string> = {
  dir: "This folder",
  subtree: "This folder + subfolders",
  global: "Everywhere",
};

interface Props {
  mode: "browse" | "search";
  dir: string;
  parent: string | null;
  query: string;
  scope: Scope;
  // browse mode
  dirs: DirEntry[];
  files: BrowseFile[];
  browseError?: string;
  // search mode
  results: FileResult[];
  thumbnails: Record<string, string>;
  total: number;
  offset: number;
  pageSize: number;
  searchError: boolean;
}

export default function Explorer(props: Props) {
  const { mode, dir, parent, scope, dirs, files, browseError } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(props.query);
  const [scopeSel, setScopeSel] = useState<Scope>(scope);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the search box after hydration (avoids autoFocus hydration mismatch).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function go(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    }
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/explore?${qs}` : "/explore"));
  }

  function navigateTo(path: string) {
    // Navigating folders clears any active search but keeps the scope choice.
    go({ path, scope: scopeSel });
  }

  function runSearch() {
    const q = query.trim();
    if (!q) {
      go({ path: dir, scope: scopeSel });
      return;
    }
    go({ path: dir, q, scope: scopeSel });
  }

  function clearSearch() {
    setQuery("");
    go({ path: dir, scope: scopeSel });
  }

  function paginate(newOffset: number) {
    go({ path: dir, q: props.query, scope: scopeSel, offset: newOffset });
  }

  return (
    <div>
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        className="flex flex-wrap items-center gap-2 mb-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indexed files — e.g. report ext:jpg mtime:{last month}"
          spellCheck={false}
          className="flex-1 min-w-[16rem] bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-slate-500"
        />
        <select
          value={scopeSel}
          onChange={(e) => setScopeSel(e.target.value as Scope)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500"
          title="Search scope"
        >
          {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
            <option key={s} value={s}>
              {SCOPE_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 border border-slate-700 rounded text-sm text-slate-200 hover:border-slate-500 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Breadcrumb */}
      <Breadcrumb dir={dir} scope={scopeSel} onNavigate={navigateTo} />

      <div className={isPending ? "opacity-50 pointer-events-none mt-4" : "mt-4"}>
        {mode === "search" ? (
          <SearchResults {...props} onClear={clearSearch} onPaginate={paginate} />
        ) : (
          <BrowseListing
            parent={parent}
            dirs={dirs}
            files={files}
            error={browseError}
            onNavigate={navigateTo}
          />
        )}
      </div>
    </div>
  );
}

function Breadcrumb({
  dir,
  scope,
  onNavigate,
}: {
  dir: string;
  scope: Scope;
  onNavigate: (path: string) => void;
}) {
  const segments = dir.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    name: seg,
    path: `/${segments.slice(0, i + 1).join("/")}`,
  }));
  return (
    <div className="flex items-center gap-1 text-sm text-slate-400 flex-wrap">
      <button onClick={() => onNavigate("/")} className="hover:text-slate-100 transition-colors">
        /
      </button>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(c.path)}
            className={
              i === crumbs.length - 1
                ? "text-slate-100"
                : "hover:text-slate-100 transition-colors"
            }
          >
            {c.name}
          </button>
          {i < crumbs.length - 1 && <span className="text-slate-700">/</span>}
        </span>
      ))}
      <span className="ml-2 text-xs text-slate-600">· search: {SCOPE_LABELS[scope]}</span>
    </div>
  );
}

function BrowseListing({
  parent,
  dirs,
  files,
  error,
  onNavigate,
}: {
  parent: string | null;
  dirs: DirEntry[];
  files: BrowseFile[];
  error?: string;
  onNavigate: (path: string) => void;
}) {
  if (error) {
    return (
      <p className="text-red-400 text-sm">
        Can&apos;t open this folder: <span className="font-mono">{error}</span>
      </p>
    );
  }

  const empty = dirs.length === 0 && files.length === 0;

  return (
    <div className="divide-y divide-slate-800/60">
      {parent !== null && (
        <button
          onClick={() => onNavigate(parent)}
          className="flex items-center gap-3 py-2 px-1 w-full text-left hover:bg-slate-900/40 rounded transition-colors"
        >
          <span className="w-8 text-center text-lg">📁</span>
          <span className="text-sm text-slate-400">..</span>
        </button>
      )}

      {dirs.map((d) => (
        <button
          key={d.path}
          onClick={() => onNavigate(d.path)}
          className="flex items-center gap-3 py-2 px-1 w-full text-left hover:bg-slate-900/40 rounded transition-colors group"
        >
          <span className="w-8 text-center text-lg">📁</span>
          <span className="text-sm text-slate-200 group-hover:text-white truncate">{d.name}</span>
        </button>
      ))}

      {files.map((f) => (
        <FileRow key={f.name} file={f} />
      ))}

      {empty && <p className="text-slate-400 text-sm py-3">This folder is empty.</p>}
    </div>
  );
}

function FileRow({ file }: { file: BrowseFile }) {
  const icon = file.fileType ? (FILE_TYPE_ICONS[file.fileType] ?? "📄") : "📄";
  const date = file.mtime ? new Date(file.mtime).toLocaleDateString() : null;

  const body = (
    <>
      <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center overflow-hidden rounded">
        {file.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/file?path=${encodeURIComponent(file.thumbnail)}`}
            alt=""
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <span className="text-lg">{icon}</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={
            file.hash
              ? "text-sm text-slate-200 group-hover:text-white truncate"
              : "text-sm text-slate-500 truncate"
          }
        >
          {file.name}
        </p>
        {!file.hash && <p className="text-xs text-slate-700">not indexed</p>}
      </div>
      {file.size !== undefined && (
        <div className="shrink-0 text-right space-y-0.5">
          <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
          {date && <p className="text-xs text-slate-600">{date}</p>}
        </div>
      )}
    </>
  );

  if (file.hash) {
    return (
      <Link
        href={`/content/${encodeURIComponent(file.hash)}`}
        className="flex items-center gap-3 py-2 px-1 hover:bg-slate-900/40 rounded transition-colors group"
      >
        {body}
      </Link>
    );
  }
  return <div className="flex items-center gap-3 py-2 px-1 opacity-70">{body}</div>;
}

function SearchResults({
  query,
  scope,
  results,
  thumbnails,
  total,
  offset,
  pageSize,
  searchError,
  onClear,
  onPaginate,
}: Props & { onClear: () => void; onPaginate: (offset: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-slate-400">
          {total > 0 ? total.toLocaleString() : "No"} result{total === 1 ? "" : "s"} for{" "}
          <span className="font-mono text-slate-200">{query}</span>{" "}
          <span className="text-slate-600">· {SCOPE_LABELS[scope]}</span>
        </span>
        <button onClick={onClear} className="text-slate-500 hover:text-slate-300 transition-colors">
          Clear search
        </button>
      </div>

      {searchError && (
        <p className="text-red-400 text-sm mb-4">Could not reach hashit-idx — is it running?</p>
      )}

      {!searchError && results.length === 0 && (
        <p className="text-slate-400 text-sm">No matching indexed files.</p>
      )}

      <div className="divide-y divide-slate-800/60">
        {results.map((file) => (
          <ResultRow key={file.path} file={file} thumbnail={thumbnails[file.path]} />
        ))}
      </div>

      {(offset > 0 || results.length === pageSize) && (
        <div className="flex items-center gap-3 mt-6 text-sm">
          <button
            onClick={() => onPaginate(Math.max(0, offset - pageSize))}
            disabled={offset === 0}
            className="px-3 py-1 border border-slate-700 rounded hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-slate-500">
            {offset + 1}–{offset + results.length}
            {total > 0 && ` of ${total.toLocaleString()}`}
          </span>
          <button
            onClick={() => onPaginate(offset + pageSize)}
            disabled={results.length < pageSize}
            className="px-3 py-1 border border-slate-700 rounded hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
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
    </Link>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
