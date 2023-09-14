import { ActionArgs, json } from "@remix-run/cloudflare";

import { Form, useActionData, useParams } from "@remix-run/react";

export async function action({ request, params }: ActionArgs) {
  const body = await request.formData();
  const intent = body.get("intent");
  //const { intent } = await request.json<RequestDecisionBody>();

  if (
    typeof intent !== "string" ||
    !(intent === "deny" || intent === "approve")
  ) {
    return json(
      { error: "No or bad `intent` specified", intent: null, id: null },
      422
    );
  }

  // TODO: modify things in the database
  const requestId = params.requestId;
  return json({ error: null, intent: intent, id: requestId });
}

export default function AdminClubRequestById() {
  const params = useParams();
  const clubId = params.clubId;
  const requestId = params.requestId;

  const actionData = useActionData<typeof action>();

  return (
    <>
      <h1>Placeholder</h1>
      <h3>
        Admin Page for Club Request {requestId} belonging to club {clubId}
      </h3>
      {actionData ? (
        <p>
          Error: {actionData.error}; Intent received: {actionData.intent};
          Request ID received: {actionData.id}
        </p>
      ) : null}
      <Form method="post">
        <button name="intent" value="approve">
          Approve
        </button>
        <button name="intent" value="deny">
          Deny
        </button>
      </Form>
    </>
  );
}
