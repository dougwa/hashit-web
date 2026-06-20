"use client";
import { useState } from "react";
import type { MetaEntry } from "@/lib/types";

interface Props {
  hash: string;
  entries: MetaEntry[];
  fileOpsDown?: boolean;
}

export default function ContentDetail({ hash, entries, fileOpsDown }: Props) {
  // All entries share the same hash; use the first for file-level info.
  const primary = entries[0];
  const previewSrc = primary.preview
    ? `/api/file?path=${encodeURIComponent(primary.preview)}`
    : primary.thumbnail
    ? `/api/file?path=${encodeURIComponent(primary.thumbnail)}`
    : null;
  const downloadHref = `/api/file?path=${encodeURIComponent(primary.path)}&download=1`;

  // Merge properties from all entries (they should be identical, keyed by hash).
  const [properties, setProperties] = useState<Record<string, string>>(
    primary.properties ?? {}
  );
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const tags = primary.tags ?? {};
  const tagEntries = Object.entries(tags);

  async function addProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    setSaving(true);
    await fetch("/api/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paths: entries.map((e) => e.path),
        set: { [newKey.trim()]: newValue.trim() },
        remove: [],
      }),
    });
    setProperties((p) => ({ ...p, [newKey.trim()]: newValue.trim() }));
    setNewKey("");
    setNewValue("");
    setSaving(false);
  }

  async function removeProperty(key: string) {
    await fetch("/api/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paths: entries.map((e) => e.path),
        set: {},
        remove: [key],
      }),
    });
    setProperties((p) => {
      const next = { ...p };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="max-w-4xl">
      {fileOpsDown && (
        <p className="text-amber-400 text-xs mb-4">
          hashit FileOps service unavailable — tags and properties require{" "}
          <code className="font-mono">hashit watch --serve</code> on port 50552.
        </p>
      )}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-base font-semibold text-slate-100 truncate">
          {primary.path.split("/").pop()}
        </h1>
        <p className="text-xs text-slate-500 font-mono mt-0.5">{hash}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: file info */}
        <div className="lg:col-span-1 space-y-4">
          {previewSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt="Preview"
              className="w-full rounded-lg border border-slate-800 object-contain max-h-80"
            />
          )}

          <InfoTable>
            {primary.file_type && <InfoRow label="Type" value={primary.file_type} />}
            {primary.ext && <InfoRow label="Ext" value={`.${primary.ext}`} />}
            {primary.size > 0 && (
              <InfoRow label="Size" value={formatBytes(primary.size)} />
            )}
            <InfoRow label="Algo" value={primary.algo} />
          </InfoTable>

          <a
            href={downloadHref}
            className="block w-full text-center px-3 py-1.5 border border-slate-700 rounded text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Download
          </a>
        </div>

        {/* Right: locations, extracted tags, user properties */}
        <div className="lg:col-span-2 space-y-6">
          {/* Locations */}
          <Section title={`Locations (${entries.length})`}>
            <div className="space-y-1">
              {entries.map((entry, i) => (
                <div key={i} className="text-xs font-mono text-slate-400 truncate">
                  {entry.error ? (
                    <span className="text-red-400">{entry.path} — {entry.error}</span>
                  ) : (
                    entry.path
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Extracted tags (read-only) */}
          {tagEntries.length > 0 && (
            <Section title="Extracted metadata">
              <InfoTable>
                {tagEntries.map(([k, v]) => (
                  <InfoRow key={k} label={k} value={v} />
                ))}
              </InfoTable>
            </Section>
          )}

          {/* User properties (read-write) */}
          <Section title="Properties">
            <div className="space-y-1 mb-3">
              {Object.keys(properties).length === 0 && (
                <p className="text-slate-500 text-sm">No properties set.</p>
              )}
              {Object.entries(properties).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 font-mono text-xs flex-1 truncate">
                    <span className="text-slate-300">{k}</span>
                    {v && <span className="text-slate-600"> = {v}</span>}
                  </span>
                  <button
                    onClick={() => removeProperty(k)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addProperty} className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="key"
                className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="value (optional)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                disabled={!newKey.trim() || saving}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded text-sm transition-colors"
              >
                Add
              </button>
            </form>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoTable({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <tbody>{children}</tbody>
    </table>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-800/60 last:border-0">
      <td className="py-1 pr-3 text-slate-500 whitespace-nowrap text-xs">{label}</td>
      <td className="py-1 text-slate-300 font-mono text-xs break-all">{value}</td>
    </tr>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
