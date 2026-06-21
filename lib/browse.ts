import fs from "fs/promises";
import path from "path";
import type { DirEntry, Scope } from "./types";

// Server-only filesystem navigation + query-scope helpers for the explore view.
// Browsing follows the real directory tree from "/"; the index is consulted
// separately (in the page) only to enrich/search indexed files.

export interface BrowseListing {
  path: string;
  parent: string | null;
  dirs: DirEntry[];
  fileNames: string[]; // basenames of regular files directly in this directory
  error?: string; // populated when the directory can't be read (e.g. EACCES)
}

// List a single directory level. Never throws: an unreadable directory comes
// back with `error` set and empty contents so the UI can show it inline.
export async function browse(dir: string): Promise<BrowseListing> {
  // Normalize to an absolute path and collapse any "." / ".." segments.
  const abs = path.resolve("/", dir);
  const parent = abs === "/" ? null : path.dirname(abs);

  try {
    const entries = await fs.readdir(abs, { withFileTypes: true });
    const dirs: DirEntry[] = [];
    const fileNames: string[] = [];
    for (const e of entries) {
      if (e.isDirectory()) dirs.push({ name: e.name, path: path.join(abs, e.name) });
      else if (e.isFile() || e.isSymbolicLink()) fileNames.push(e.name);
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    fileNames.sort((a, b) => a.localeCompare(b));
    return { path: abs, parent, dirs, fileNames };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { path: abs, parent, dirs: [], fileNames: [], error: msg };
  }
}

// Double-quote and escape a value for the hashit-idx query language.
function quote(v: string): string {
  return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// The directory-scoping term for a search, or "" for global (no constraint).
//
//  - "dir":     `dir=<abs>` — files whose containing directory is exactly <abs>.
//  - "subtree": `path:=<abs>/%` — a LIKE glob on the full file *path*, so it
//    matches files directly in <abs> (path `<abs>/<name>`) AND in any nested
//    directory. Globbing `dir` instead would exclude <abs>'s own files; the
//    trailing slash also prevents sibling bleed (e.g. `<abs>2/...`).
export function dirTerm(dir: string, scope: Scope): string {
  if (scope === "global") return "";
  const abs = path.resolve("/", dir);
  if (scope === "dir") return `dir=${quote(abs)}`;
  // NOTE: a literal `%` or `_` in a path would act as a wildcard — the backend's
  // `:=` exposes no escape — but real paths rarely contain them.
  const pattern = abs === "/" ? "/%" : `${abs}/%`;
  return `path:=${quote(pattern)}`;
}

// Combine the user's free-form query with the directory scope into one
// query-language string for hashit-idx.
export function scopedQuery(userQuery: string, dir: string, scope: Scope): string {
  return [dirTerm(dir, scope), userQuery.trim()].filter(Boolean).join(" ");
}
