// Types derived from proto/search.proto (hashit.search.v1)

export interface QueryRequest {
  // Query-language string (see ../hashit/QUERY.md). Supersedes any structured
  // fields server-side; the web layer only sends this.
  query?: string;
  limit?: number;
  offset?: number;
}

export interface FileResult {
  path: string;
  name: string;
  hash: string;
  algo: string;
  size: number;
  mtime: string;
  file_type: string;
  ext: string;
}

export interface QueryResponse {
  files: FileResult[];
  total: number;
}

// Folder-explore view (filesystem-backed navigation; see lib/browse.ts)

// Search scope relative to the directory being browsed.
//  - "dir":     only files directly in the current directory  (dir=…)
//  - "subtree": the current directory and all subdirectories   (dir:=…/%)
//  - "global":  the whole index, ignoring the current directory
export type Scope = "dir" | "subtree" | "global";

export interface DirEntry {
  name: string;
  path: string;
}

// A file shown in the browse listing. Always present on disk; the index-derived
// fields are filled in only when the file is indexed.
export interface BrowseFile {
  name: string;
  hash?: string;
  size?: number;
  mtime?: string;
  fileType?: string;
  thumbnail?: string;
}

export interface StatsResponse {
  files: number;
  hashes: number;
  tags: number;
}

// Types derived from proto/fileops.proto (hashit.fileops.v1)

export interface MetaEntry {
  path: string;
  error: string;
  hash: string;
  algo: string;
  size: number;
  file_type: string;
  ext: string;
  tags: Record<string, string>;
  properties: Record<string, string>;
  thumbnail: string;
  preview: string;
}

export interface GetMetaResponse {
  entries: MetaEntry[];
}

export interface OpResponse {
  message: string;
}
