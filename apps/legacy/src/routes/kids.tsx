import { createFileRoute, redirect } from "@tanstack/react-router";
import { KidsLayout } from "~/components/kids/KidsLayout";

export const Route = createFileRoute("/kids")({
  beforeLoad: ({ context }) => {
    // Kids mode doesn't require auth — works with local profiles
    // But if session exists, we can sync progress
  },
  component: KidsLayout,
});
