import { createFileRoute, redirect } from "@tanstack/react-router";

// Backward compat redirect: /memorize/session/:surahId → /memorize/session/surah/:surahId
export const Route = createFileRoute("/_app/_protected/memorize/session/$surahId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/memorize/session/$sourceType/$sourceId", params: { sourceType: "surah", sourceId: params.surahId } });
  },
  component: () => null,
});
