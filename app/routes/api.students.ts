import { type LoaderArgs, json } from "@remix-run/node";
import { db } from "~/utils/db.server";

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const afterDate = new Date(url.searchParams.get("after") ?? 0);

  return json(
    await db.student.findMany({
      where: {
        updatedAt: {
          gte: afterDate,
        },
      },
    }),
  );
}
