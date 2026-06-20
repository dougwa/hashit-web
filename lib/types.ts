// Types derived from proto/search.proto (hashit.search.v1)

export interface TagFilter {
  key: string;
  value: string;
}

export interface QueryRequest {
  name?: string;
  hash?: string;
  min_size?: number;
  max_size?: number;
  min_date?: string;
  max_date?: string;
  tags?: TagFilter[];
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
