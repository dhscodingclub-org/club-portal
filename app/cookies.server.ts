import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const lastRequestTime = createCookie("lastRequestTime", {
  path: "/clubs/new",
  maxAge: 604_800, // one week
});
