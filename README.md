# hashit-web

A web front-end for **[hashit](https://github.com/dougwa/hashit)** — a
content-hash index and logical filesystem over your drives. hashit exposes a
headless HTTP API (`hashit-api`) and no UI; this project provides the
user-facing experience on top of it.

## What it's for

Browse and manage files across drives by **content**, not just path:

- **Browse** the logical hierarchy per drive (folders synthesized from indexed
  files), with online/offline awareness when a drive is unplugged.
- **Search** the reverse index: by file type, extension, tag, favorite, drive,
  presence, or metadata key/value — paginated for very large collections.
- **Inspect** a file's detail: metadata (EXIF, etc.), every location it appears
  at, tags, links, and a thumbnail.
- **Curate**: add/remove tags and favorites, link related files (e.g. a JPG and
  its RAW). These are hash-keyed, so they apply to every copy.
- **Deduplicate**: "keep this" — delete the other copies of identical content
  (a guarded, destructive action).

## The API

This UI talks to hashit-api over HTTP (default `http://127.0.0.1:8087`, routes
under `/v1`). The contract is documented here:

- **[`docs/openapi.yaml`](docs/openapi.yaml)** — OpenAPI 3.0 spec for all
  endpoints and response schemas.
- **[`docs/api-examples.md`](docs/api-examples.md)** — concrete request/response
  examples.

Auth is a bearer token (or `?token=`); writes require the server to run with
`--allow-write`. See the spec for details.

## Running the backend locally

```sh
git clone https://github.com/dougwa/hashit.git
cd hashit
cargo build --release --features serve
./target/release/hashit index ~/path/to/files     # build the index
./target/release/hashit serve --allow-write --no-token
```

(While the API PRs are in review it lives on the `api-mutations` branch.)

## Status

Greenfield. The backend API (M1–M3.5) is complete; the front-end stack here is
not yet chosen — see [`CLAUDE.md`](CLAUDE.md) for orientation and suggested
first steps.
