import {useParams} from "@remix-run/react";

export default function AdminClubsIndex() {
  const params = useParams();
  const clubId = params.clubId;

  return <>
    <h1>Placeholder</h1>
    <h3>Viewing admin page for club {clubId}</h3>
  </>
}
