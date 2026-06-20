import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import type { QueryRequest, QueryResponse, StatsResponse } from "../types";

const PROTO = path.join(process.cwd(), "proto", "search.proto");

const pkgDef = protoLoader.loadSync(PROTO, {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
});
const pkg = grpc.loadPackageDefinition(pkgDef) as any;

const addr = process.env.HASHIT_SEARCH_ADDR ?? "127.0.0.1:50551";

let _client: any = null;
function client() {
  if (!_client) {
    _client = new pkg.hashit.search.v1.Search(
      addr,
      grpc.credentials.createInsecure()
    );
  }
  return _client;
}

export function queryFiles(req: QueryRequest): Promise<QueryResponse> {
  return new Promise((resolve, reject) => {
    client().Query(req, (err: Error | null, res: QueryResponse) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

export function getStats(): Promise<StatsResponse> {
  return new Promise((resolve, reject) => {
    client().Stats({}, (err: Error | null, res: StatsResponse) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
