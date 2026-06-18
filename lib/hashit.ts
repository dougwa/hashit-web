import createClient from "openapi-fetch";
import type { paths } from "./hashit-types";

const baseUrl = process.env.HASHIT_URL ?? "http://127.0.0.1:8087";
const token = process.env.HASHIT_TOKEN;

export const hashit = createClient<paths>({
  baseUrl,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
