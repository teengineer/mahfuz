import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/library/")({
  beforeLoad: () => {
    throw redirect({ to: "/library/courses" });
  },
});
