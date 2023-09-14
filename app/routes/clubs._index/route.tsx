import { useParams } from "@remix-run/react";

export default function Club() {
  const params = useParams();
  const id = params.id;

  return <>
    <h1>Placeholder</h1>
    <h3>Information about club {id}</h3>
  </>
}
