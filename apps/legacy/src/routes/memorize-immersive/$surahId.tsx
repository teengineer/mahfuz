import { createFileRoute, redirect } from "@tanstack/react-router";

// Backward compat redirect
export const Route = createFileRoute("/memorize-immersive/$surahId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/memorize-immersive/$sourceType/$sourceId", params: { sourceType: "surah", sourceId: params.surahId } });
  },
  component: () => null,
});
