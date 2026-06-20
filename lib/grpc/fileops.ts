import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import type { GetMetaResponse, OpResponse } from "../types";

const PROTO = path.join(process.cwd(), "proto", "fileops.proto");

const pkgDef = protoLoader.loadSync(PROTO, {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
});
const pkg = grpc.loadPackageDefinition(pkgDef) as any;

const addr = process.env.HASHIT_FILEOPS_ADDR ?? "127.0.0.1:50552";

let _client: any = null;
function client() {
  if (!_client) {
    _client = new pkg.hashit.fileops.v1.FileOps(
      addr,
      grpc.credentials.createInsecure()
    );
  }
  return _client;
}

export function getMeta(paths: string[]): Promise<GetMetaResponse> {
  return new Promise((resolve, reject) => {
    client().GetMeta({ paths }, (err: Error | null, res: GetMetaResponse) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

export function putMeta(
  paths: string[],
  set: Record<string, string>,
  remove: string[]
): Promise<OpResponse> {
  return new Promise((resolve, reject) => {
    client().PutMeta({ paths, set, remove }, (err: Error | null, res: OpResponse) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

export function cpFiles(
  sources: string[],
  dest: string,
  recursive = false,
  force = false
): Promise<OpResponse> {
  return new Promise((resolve, reject) => {
    client().Cp(
      { sources, dest, recursive, force },
      (err: Error | null, res: OpResponse) => {
        if (err) reject(err);
        else resolve(res);
      }
    );
  });
}

export function mvFiles(
  sources: string[],
  dest: string,
  force = false
): Promise<OpResponse> {
  return new Promise((resolve, reject) => {
    client().Mv(
      { sources, dest, force },
      (err: Error | null, res: OpResponse) => {
        if (err) reject(err);
        else resolve(res);
      }
    );
  });
}

export function rmFiles(
  paths: string[],
  recursive = false,
  force = false
): Promise<OpResponse> {
  return new Promise((resolve, reject) => {
    client().Rm(
      { paths, recursive, force },
      (err: Error | null, res: OpResponse) => {
        if (err) reject(err);
        else resolve(res);
      }
    );
  });
}
