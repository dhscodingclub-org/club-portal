import type { ActionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";

export function action({ params }: ActionArgs) {
  return json({ placeholder: `joined club ${params.clubId}` });
}
