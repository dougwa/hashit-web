"use client";
import { useState } from "react";
import Link from "next/link";
import type { ContentDetail as ContentDetailType } from "@/lib/types";
import { api } from "@/lib/api";

interface Props {
  detail: ContentDetailType;
}

export default function ContentDetail({ detail }: Props) {
  const [tags, setTags] = useState<string[]>(detail.tags ?? []);
  const [favorite, setFavorite] = useState(tags.includes("favorite"));
  const [newTag, setNewTag] = useState("");
  const [dedupState, setDedupState] = useState<"idle" | "confirm" | "done">("idle");
  const [dedupKeep, setDedupKeep] = useState<{ drive: string; path: string } | null>(null);
  const [dedupResult, setDedupResult] = useState<string | null>(null);

  const hash = detail.hash ?? "";
  const locations = detail.locations ?? [];
  const online = locations.some((l) => l.online);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    const { data } = await api.POST("/v1/content/{hash}/tags", {
      params: { path: { hash } },
      body: { tags: [newTag.trim()] },
    });
    if (data) setTags(data);
    setNewTag("");
  }

  async function removeTag(tag: string) {
    const { data } = await api.DELETE("/v1/content/{hash}/tags/{tag}", {
      params: { path: { hash, tag } },
    });
    if (data) setTags(data);
  }

  async function toggleFavorite() {
    if (favorite) {
      await api.DELETE("/v1/content/{hash}/favorite", { params: { path: { hash } } });
    } else {
      await api.POST("/v1/content/{hash}/favorite", { params: { path: { hash } } });
    }
    setFavorite(!favorite);
  }

  async function confirmDedup() {
    if (!dedupKeep) return;
    const { data, error } = await api.POST("/v1/content/{hash}/dedup", {
      params: { path: { hash } },
      body: { keep_drive: dedupKeep.drive, keep_path: dedupKeep.path, confirm: true },
    });
    if (data) {
      setDedupResult(`Kept ${data.kept}. Removed ${data.removed?.length ?? 0} copy(ies).`);
      setDedupState("done");
    } else {
      setDedupResult("Dedup failed (writes disabled or server error).");
      setDedupState("done");
    }
  }

  // Group metadata by group name
  const metaGroups: Record<string, { key: string; value: string }[]> = {};
  for (const m of detail.metadata ?? []) {
    const g = m.group ?? "Other";
    if (!metaGroups[g]) metaGroups[g] = [];
    metaGroups[g].push({ key: m.key ?? "", value: m.value ?? "" });
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-slate-100 truncate">
            {locations[0]?.path?.split("/").pop() ?? hash.slice(0, 16)}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{hash}</p>
        </div>
        <button
          onClick={toggleFavorite}
          className={`text-lg transition-colors ${favorite ? "text-yellow-400" : "text-slate-600 hover:text-slate-400"}`}
          title={favorite ? "Unfavorite" : "Favorite"}
        >
          ★
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: thumbnail + file info */}
        <div className="lg:col-span-1 space-y-4">
          {detail.has_thumb && (
            <img
              src={`/api/v1/thumb/${hash}`}
              alt=""
              className="w-full rounded-lg border border-slate-800 bg-slate-900"
            />
          )}

          <InfoTable>
            {detail.file_type && <InfoRow label="Type" value={detail.file_type} />}
            {detail.ext && <InfoRow label="Extension" value={`.${detail.ext}`} />}
            {detail.size != null && <InfoRow label="Size" value={formatBytes(detail.size)} />}
            <InfoRow label="Online" value={online ? "Yes" : "No"} />
            <InfoRow label="Copies" value={String(locations.length)} />
          </InfoTable>

          {/* Download link (only if online) */}
          {online && (
            <a
              href={`/api/v1/content/${hash}`}
              download
              className="block text-center text-sm text-slate-400 border border-slate-700 rounded px-3 py-2 hover:border-slate-500 hover:text-slate-200 transition-colors"
            >
              Download
            </a>
          )}
        </div>

        {/* Right: tags, locations, metadata, dedup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tags */}
          <Section title="Tags">
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.length === 0 && <span className="text-slate-500 text-sm">No tags.</span>}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={addTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag…"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
              />
              <button
                type="submit"
                disabled={!newTag.trim()}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded text-sm transition-colors"
              >
                Add
              </button>
            </form>
          </Section>

          {/* Locations */}
          <Section title="Locations">
            <div className="space-y-1">
              {locations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-slate-300 font-mono text-xs truncate flex-1">
                    {loc.path}
                  </span>
                  <span
                    className={`shrink-0 text-xs ${
                      loc.online ? "text-green-400" : "text-slate-600"
                    }`}
                  >
                    {loc.online ? "online" : "offline"}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Linked hashes */}
          {(detail.links?.length ?? 0) > 0 && (
            <Section title="Linked files">
              <div className="space-y-1">
                {detail.links!.map((h) => (
                  <Link
                    key={h}
                    href={`/content/${h}`}
                    className="block text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors truncate"
                  >
                    {h}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Metadata */}
          {Object.keys(metaGroups).length > 0 && (
            <Section title="Metadata">
              <div className="space-y-4">
                {Object.entries(metaGroups).map(([group, rows]) => (
                  <div key={group}>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{group}</p>
                    <InfoTable>
                      {rows.map((r) => (
                        <InfoRow key={r.key} label={r.key} value={r.value} />
                      ))}
                    </InfoTable>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Dedup */}
          {locations.length > 1 && (
            <Section title="Deduplicate">
              {dedupState === "done" ? (
                <p className="text-sm text-slate-400">{dedupResult}</p>
              ) : dedupState === "confirm" && dedupKeep ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Keep <code className="text-xs text-yellow-400">{dedupKeep.path}</code> and
                    delete all other copies on online drives?{" "}
                    <span className="text-red-400">This is permanent.</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={confirmDedup}
                      className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-red-100 rounded text-sm transition-colors"
                    >
                      Yes, delete other copies
                    </button>
                    <button
                      onClick={() => setDedupState("idle")}
                      className="px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">
                    Choose which copy to keep. All others will be deleted from online drives.
                  </p>
                  {locations
                    .filter((l) => l.online)
                    .map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDedupKeep({ drive: loc.drive_id ?? "", path: loc.path ?? "" });
                          setDedupState("confirm");
                        }}
                        className="block w-full text-left text-xs font-mono text-slate-400 border border-slate-800 rounded px-3 py-2 hover:border-slate-600 hover:text-slate-200 transition-colors"
                      >
                        Keep: {loc.path}
                      </button>
                    ))}
                </div>
              )}
            </Section>
          )}
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
      <td className="py-1 pr-3 text-slate-500 whitespace-nowrap">{label}</td>
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
