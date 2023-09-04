import { Outlet } from "@remix-run/react";

export default function ClubsRoute() {
  return (
    <>
      <div className="m-auto w-full">
        <h1 className="bg-red-500 font-black text-3xl">
          DO NOT DEPLOY THIS PAGE INTO PRODUCTION!
        </h1>
      </div>
      <Outlet />
    </>
  );
}
