import {useParams} from "@remix-run/react";

export default function AdminClubsRequests() {
  const params = useParams();
  const clubId = params.clubId

  return <>
    <h1>Placeholder</h1>
    <h3>Admin Clubs Requests Dashboard for club {clubId}</h3>
  </>
}
