import createClient from "openapi-fetch";
import type { paths } from "./hashit-types";

// Client-side API helper. openapi-fetch prepends baseUrl to spec paths which
// start with /v1/, so /api + /v1/drives = /api/v1/drives — matching the proxy.
export const api = createClient<paths>({ baseUrl: "/api" });
