# hashit-web — agent orientation

This repo is the **web front-end for hashit-api**. The backend (`hashit`) is a
separate Rust project at `../hashit`; it exposes a headless HTTP API and ships
**no UI**. Your job here is to build the user-facing web experience on top of
that API. Do **not** put UI code in `../hashit`.

## What the backend is

`hashit` maintains a content-hash index of files across drives (a logical
filesystem layer over native disks). Key ideas the UI must respect:

- **Everything is keyed by content hash.** The same bytes on multiple
  drives/paths are one "content" with many "locations". Tags, favorites, links,
  metadata, and thumbnails attach to the **hash**, so they apply to every copy.
- **Drive-aware / offline.** Each copy lives on a drive that may be online or
  offline (unplugged). Query results say whether any copy is currently online.
- **Reverse index.** Query/filter by file type, extension, tag, favorite, drive,
  presence (offline), or a metadata key/value — paginated.
- **Logical hierarchy.** Browse per-drive directory trees (`ls`/`stat`) even
  though storage is hash-keyed.

## The API contract

- **Spec:** [`docs/openapi.yaml`](docs/openapi.yaml) — full endpoint + schema
  definitions (OpenAPI 3.0).
- **Examples:** [`docs/api-examples.md`](docs/api-examples.md) — real curl calls
  and response shapes.
- Base URL default `http://127.0.0.1:8087`, all routes under `/v1`.
- **Auth:** bearer token (`Authorization: Bearer <t>`) or `?token=<t>`, unless the
  server runs with `--no-token`. CORS is permissive (any origin).
- **Reads:** `drives`, `ls`, `stat`, `query`, `content/:hash` (streams bytes),
  `content/:hash/meta`, `thumb/:hash`.
- **Writes (require backend `--allow-write`, else 403):** tag add/remove,
  favorite set/clear, link/unlink, and **dedup "keep this"** (destructive —
  deletes other copies; requires `confirm: true`).

## Running the backend for development

From `../hashit` (the API lives behind the `serve` cargo feature):

```sh
# build with the server
cargo build --release --features serve     # binary: ../hashit/target/release/hashit

# 1) build/refresh the index over some files (default build already has `extract`)
./target/release/hashit index ~/somewhere/with/files

# 2) serve the API (enable writes + skip token for easy local dev)
./target/release/hashit serve --allow-write --no-token
#    -> http://127.0.0.1:8087   (use --token <t> to require auth)
```

> The API is not yet merged to `main` in `../hashit`; it currently lives on the
> branch `api-mutations` (PR stack #4→#7). Check out that branch to build it
> until the PRs land.

## Constraints & gotchas for the UI

- **Paginate.** `query` is server-paginated (`limit`/`offset`, max 1000); the
  index can be huge (designed for ~10TB / millions of files). Never try to load
  everything — page or virtualize.
- **Thumbnails** are generated on demand at `GET /v1/thumb/:hash` (JPEG); a 404
  means the format wasn't thumbnailable.
- **Offline content** is normal — show it, but actions on offline copies won't
  work (e.g. content streaming 404s, dedup skips them).
- **Dedup is destructive.** Surface a clear confirm step; the API itself refuses
  without `{"confirm": true}` and only with `--allow-write`.
- **Nullable fields:** `DirEntry` omits file-only fields for directories and
  vice-versa; `file_type`/`ext`/`link_group` can be null.

## Suggested first steps

1. Decide the stack (your call — any standard web framework). Confirm with the
   user before scaffolding.
2. Generate a typed client from `docs/openapi.yaml` (or hand-write a thin fetch
   wrapper) with a configurable base URL + token.
3. Build the core flows: drive list → browse (`ls`) / search (`query`) → detail
   (`meta` + `thumb`) → edits (tags/favorites/links) → dedup with confirm.

See [`README.md`](README.md) for the project overview and `../hashit/ROADMAP.md`
for where this fits in the larger plan.
