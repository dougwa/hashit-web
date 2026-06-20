# hashit-web — agent orientation

This repo is the **web front-end for hashit**. The backend is a Rust workspace
at `../hashit` split into two local-only gRPC services:

| Service | Default address | Role |
|---------|----------------|------|
| `hashit` (FileOps) | `127.0.0.1:50552` | Mutations: cp/mv/rm/get-meta/put-meta |
| `hashit-idx` (Search) | `127.0.0.1:50551` | Read-only global index: query/stats |

The web layer bridges browser requests to these services through Next.js API
routes using `@grpc/grpc-js`. **Do not put UI code in `../hashit`.**

## What the backend is

`hashit` maintains a content-hash index of files across local directories.

Key ideas:
- **Content-keyed.** EXIF metadata, thumbnails, and user properties attach to
  the **hash** — every copy of the same bytes shares one metadata record.
- **hashit-idx** holds a SQLite index rebuilt from `.hashit` manifests and
  `*.meta.json` files. It is read-only and never writes source files.
- **hashit FileOps** exposes hash-aware file operations and per-path metadata
  reads/writes. It keeps manifests consistent regardless of whether changes
  came from the CLI or the gRPC server.

## gRPC contracts

Defined in `proto/` (kept in sync with `../hashit/proto/`):

**`proto/search.proto`** → `hashit.search.v1.Search` (hashit-idx):
- `Query(QueryRequest) → QueryResponse` — paginated search by name, hash, size, date, tags/properties
- `Stats(StatsRequest) → StatsResponse` — index-wide file/hash/tag counts

**`proto/fileops.proto`** → `hashit.fileops.v1.FileOps` (hashit):
- `GetMeta(GetMetaRequest) → GetMetaResponse` — per-path metadata (hash, size, type, tags, properties, thumbnail path)
- `PutMeta(PutMetaRequest) → OpResponse` — set/remove user properties by file path
- `Cp / Mv / Rm` — hash-aware file operations

## JSON API (Next.js bridge)

Browser → Next.js API routes → gRPC backend:

| Route | Method | Backend |
|-------|--------|---------|
| `/api/search` | GET | hashit-idx Query |
| `/api/stats` | GET | hashit-idx Stats |
| `/api/meta` | GET `?path[]=...` | hashit GetMeta |
| `/api/meta` | POST `{paths, set, remove}` | hashit PutMeta |
| `/api/auth` | POST / DELETE | session cookie auth |

Query params for `/api/search`: `name`, `hash`, `tag_key`, `tag_value`,
`min_size`, `max_size`, `min_date`, `max_date`, `limit`, `offset`.

## Running the backends for development

From `../hashit`:

```sh
cargo build --release

# Index files and extract metadata
./target/release/hashit scan ~/path/to/files --meta-all

# Start hashit-idx (search daemon)
./target/release/hashit-idx ~/path/to/files
#    -> gRPC on 127.0.0.1:50551

# Start hashit watcher + FileOps server
./target/release/hashit watch ~/path/to/files --serve --meta-all
#    -> gRPC FileOps on 127.0.0.1:50552
```

## Env vars

Set in `.env.local` (see `.env.local.example`):

```
HASHIT_SEARCH_ADDR=127.0.0.1:50551   # hashit-idx gRPC address
HASHIT_FILEOPS_ADDR=127.0.0.1:50552  # hashit FileOps gRPC address
PUBLIC_API_KEY=<secret>               # web UI auth key (blank = open)
```

## Key constraints

- **Paginate.** The index can hold millions of files. Always use `limit`/`offset`.
- **GetMeta takes file paths, not hashes.** To show a detail view for a hash,
  first `Query({hash})` to resolve paths, then `GetMeta({paths})`.
- **Properties are hash-keyed.** `PutMeta` on any path updates the metadata for
  that hash — all copies share one metadata record. One path is sufficient.
- **Tags vs properties.** `MetaEntry.tags` are extracted (EXIF etc., read-only).
  `MetaEntry.properties` are user-authored (read-write via PutMeta).
- **No content streaming or HTTP thumbnails.** `MetaEntry.thumbnail` is a local
  filesystem path — the web layer does not serve it.
