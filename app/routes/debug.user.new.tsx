import { json, type ActionArgs } from "@remix-run/node";
import { db } from "~/utils/db.server";

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const name = form.get("name");
  const email = form.get("email");
  const graduation = form.get("graduation");

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof graduation !== "string"
  ) {
    return json(null, { status: 400 });
  }

  console.log(`name: ${name}; email: ${email}; grad: ${graduation}`);
  await db.student.create({
    data: {
      name: name,
      email: email,
      graduation: new Date(graduation),
    },
  });
  return null;
};

export default function newuserdebug() {
  const year = new Date().getFullYear();

  return (
    <>
      <form method="post">
        <label>name</label>
        <input type="text" name="name" />
        <label>email</label>
        <input type="email" name="email" />
        <label>grad</label>
        <input
          type="number"
          name="graduation"
          min={year}
          max={year + 4}
          step={1}
        />
        <input type="submit" />
      </form>
    </>
  );
}
