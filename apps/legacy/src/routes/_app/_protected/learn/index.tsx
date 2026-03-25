import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/learn/")({
  beforeLoad: () => {
    throw redirect({ to: "/library/courses" });
  },
});
