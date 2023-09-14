import {useParams} from "@remix-run/react";

export default function EditClub(){
  const params = useParams();
  const clubId = params.clubId;

  return <>
    <h1>Placeholder</h1>
    <h3>Edit club page for club {clubId}</h3>
  </>
}
