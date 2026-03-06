import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/juz/")({
  beforeLoad: () => {
    throw redirect({ to: "/browse/juzs" });
  },
});
