# hashit-api — examples

Concrete request/response shapes to develop against. Assumes a local server with
`--no-token` (otherwise add `-H "Authorization: Bearer <t>"` or `?token=<t>`).
Base URL `http://127.0.0.1:8087`. JSON trimmed/illustrative.

## Drives

```sh
curl -s localhost:8087/v1/drives
```
```json
[
  {
    "drive_id": "574fcc9c-c48b-40d6-a524-3ee1579b192e",
    "label": "m3",
    "last_root": "/Volumes/Photos",
    "first_seen": "2026-06-16T05:32:50.556Z",
    "last_seen":  "2026-06-16T05:32:50.556Z",
    "online": true,
    "detached": false,
    "files": 41523
  }
]
```

## Browse (ls / stat)

```sh
curl -s "localhost:8087/v1/ls?drive=$DRIVE&path=photos"
```
```json
[
  { "name": "IMG_1.jpg", "kind": "file", "algo": "blake3",
    "hash": "e83bf71e2f36...", "size": 864, "file_type": "image",
    "ext": "jpg", "has_thumb": true },
  { "name": "b.png", "kind": "file", "algo": "blake3", "hash": "7af8184b8f...",
    "size": 1066, "file_type": "image", "ext": "png", "has_thumb": true },
  { "name": "raw", "kind": "dir", "file_count": 128 }
]
```
`path=""` (or omitted) lists the drive root. Directories carry `file_count`;
files carry the content summary. `stat` returns a single such entry, or 404.

## Query (reverse index, paginated)

```sh
curl -s "localhost:8087/v1/query?type=image&favorite=true&limit=50&offset=0"
curl -s "localhost:8087/v1/query?key=Model&value=ApiCam"
curl -s "localhost:8087/v1/query?ext=cr2&offline=true"
```
```json
[
  {
    "algo": "blake3",
    "hash": "e83bf71e2f364290e0b83a1d7778ee37f59fc9a7de11cb5a8772a18dc71b9bda",
    "file_type": "image", "ext": "jpg", "size": 864,
    "locations": 2, "online": true, "has_thumb": true,
    "drives": "574fcc9c-...,9a1b...", "sample_path": "photos/IMG_1.jpg",
    "tags": "favorite,green", "link_group": null
  }
]
```

## Detail, content, thumbnail

```sh
curl -s "localhost:8087/v1/content/$HASH/meta"
curl -s "localhost:8087/v1/content/$HASH"  -o file.bin      # streams bytes
curl -s "localhost:8087/v1/thumb/$HASH"     -o thumb.jpg     # image/jpeg
```
```json
{
  "algo": "blake3", "hash": "e83bf71e2f36...",
  "size": 864, "file_type": "image", "ext": "jpg",
  "extracted_at": "2026-06-16T05:32:50.6Z", "has_thumb": true,
  "metadata": [
    { "group": "EXIF", "key": "Model", "value": "ApiCam" },
    { "group": "File", "key": "MIMEType", "value": "image/jpeg" }
  ],
  "locations": [
    { "drive_id": "574fcc9c-...", "path": "photos/IMG_1.jpg", "online": true }
  ],
  "tags": ["favorite", "green"],
  "links": ["aa4e2e5322e2..."]
}
```
A hash arg may be a unique-enough **prefix**. `content`/`thumb` 404 if nothing
indexed / no online copy / not thumbnailable.

## Writes (server started with `--allow-write`)

```sh
# tags
curl -s -X POST localhost:8087/v1/content/$HASH/tags \
     -H 'content-type: application/json' -d '{"tags":["sunset","beach"]}'
curl -s -X DELETE localhost:8087/v1/content/$HASH/tags/beach
# -> ["sunset"]            (returns the updated tag list)

# favorite
curl -s -X POST   localhost:8087/v1/content/$HASH/favorite      # 204
curl -s -X DELETE localhost:8087/v1/content/$HASH/favorite      # 204

# link / unlink
curl -s -X POST localhost:8087/v1/links \
     -H 'content-type: application/json' -d '{"hashes":["'$JPG'","'$RAW'"]}'
# -> {"group":"8f67c63f-..."}
curl -s -X DELETE localhost:8087/v1/links/$JPG
# -> {"unlinked":true}

# dedup "keep this" (DESTRUCTIVE — requires confirm:true)
curl -s -X POST localhost:8087/v1/content/$HASH/dedup \
     -H 'content-type: application/json' \
     -d '{"keep_drive":"'$DRIVE'","keep_path":"photos/IMG_1.jpg","confirm":true}'
# -> {"kept":"<drive>:photos/IMG_1.jpg",
#     "removed":["<drive>:b/dup_copy.jpg"], "skipped_offline":0}
```

Without `--allow-write`, every write returns **403**. `dedup` without
`"confirm": true` returns **400** (it deletes files; offline copies are skipped
and a `<file>.dedup` pointer is left beside each removed file).
