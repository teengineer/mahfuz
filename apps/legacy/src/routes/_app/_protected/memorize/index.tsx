import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_protected/memorize/")({
  beforeLoad: () => {
    throw redirect({ to: "/library/memorize" });
  },
});
