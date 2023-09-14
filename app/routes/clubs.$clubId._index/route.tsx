import { useParams } from "@remix-run/react";

export default function Club() {
  const params = useParams();
  const clubId = params.clubId;

  return <>
    <h1>Placeholder</h1>
    <h3>Information about club {clubId}</h3>
  </>
}
