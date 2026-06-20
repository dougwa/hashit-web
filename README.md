# hashit-web

A web front-end for **hashit** — a content-hash index over your files. The
backend is split into two local gRPC services; this project bridges them to
a browser UI via Next.js API routes.

## What it's for

- **Search** the file index by name, hash prefix, or tag/property filters —
  paginated for large collections.
- **Inspect** a file's detail: hash, type, size, every path it appears at,
  extracted metadata (EXIF etc.), and user-set properties.
- **Curate**: add, edit, or remove user properties on any file (hash-keyed,
  so changes apply to every copy).

## Prerequisites

Two backend services must be running before starting the front-end:

| Service | Command | Default port |
|---------|---------|-------------|
| `hashit-idx` | `hashit-idx <root> [<root>…]` | `127.0.0.1:50551` |
| `hashit` FileOps | `hashit watch <root> --serve --meta-all` | `127.0.0.1:50552` |

From the `../hashit` workspace:

```sh
cargo build --release

# 1. Build/refresh the file index
./target/release/hashit scan ~/path/to/files --meta-all

# 2. Start the search daemon (keep running)
./target/release/hashit-idx ~/path/to/files

# 3. Start the watcher + FileOps server (keep running)
./target/release/hashit watch ~/path/to/files --serve --meta-all
```

## Running the front-end

```sh
# 1. Install dependencies
npm install

# 2. Copy the example env file and edit if needed
cp .env.local.example .env.local
# Edit .env.local if your backends run on non-default addresses or
# if you want to enable the PUBLIC_API_KEY auth gate.

# 3. Start the dev server
npm run dev
# -> http://localhost:3000
```

For a production build:

```sh
npm run build
npm start
```

## Configuration

All config lives in `.env.local`:

| Variable | Default | Description |
|----------|---------|-------------|
| `HASHIT_SEARCH_ADDR` | `127.0.0.1:50551` | Address of the hashit-idx gRPC Search daemon |
| `HASHIT_FILEOPS_ADDR` | `127.0.0.1:50552` | Address of the hashit FileOps gRPC server |
| `PUBLIC_API_KEY` | *(blank = open)* | Bearer token required to use the UI; leave blank on a private network |

## Architecture

```
Browser
  └── Next.js (localhost:3000)
        ├── /api/search  ──gRPC──►  hashit-idx :50551  (Query / Stats)
        ├── /api/stats   ──gRPC──►  hashit-idx :50551
        └── /api/meta    ──gRPC──►  hashit      :50552  (GetMeta / PutMeta)
```

gRPC contracts are in `proto/` (kept in sync with `../hashit/proto/`).
See [`CLAUDE.md`](CLAUDE.md) for agent/developer orientation.
