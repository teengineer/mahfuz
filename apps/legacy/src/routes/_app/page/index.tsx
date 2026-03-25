import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/page/")({
  beforeLoad: () => {
    throw redirect({ to: "/browse/pages" });
  },
});
